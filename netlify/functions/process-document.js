// On-demand document AI: derive a vendor-based title + proactive tags from an
// uploaded file. Triggered by the browser right after upload (src/lib/files.js
// #triggerDocAi). Reads the binary from the `item-files` bucket, asks Claude to
// extract ONLY the supplier/letterhead + doc type + amount + section hint (it does
// not summarize the document), then writes the title/vendor/category/tags back.
//
// Server-side only. Env (Netlify): ANTHROPIC_API_KEY, SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY. Never breaks the upload: on any error the file row is
// marked ai_status='error' and a non-2xx is returned, so the UI degrades gracefully.

import { createClient } from '@supabase/supabase-js'

const BUCKET = 'item-files'
const MAX_BYTES = 10 * 1024 * 1024
const ANTHROPIC_MODEL = 'claude-sonnet-4-6'
const ANTHROPIC_VERSION = '2023-06-01'
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

// Fixed document-type tags (must match the names seeded in supabase/documents_ai.sql).
const DOCTYPE_TAG = { offerte: 'Offerte', factuur: 'Factuur', architect: 'Architect' }
// doc_type → files.category enum.
const DOCTYPE_CATEGORY = { offerte: 'quote', factuur: 'invoice' }

const SYSTEM_RULE =
  'Je krijgt één document van een huisverbouwing (PDF of afbeelding). Je taak is SMAL: ' +
  'haal ENKEL de leverancier/afzender uit het briefhoofd, het documenttype, het ' +
  'totaalbedrag (indien duidelijk zichtbaar) en de bouwsectie. Vat het document NIET ' +
  'samen en geef geen advies. Antwoord met UITSLUITEND één JSON-object, geen prose, ' +
  'geen code fences.'

function buildPrompt(name) {
  return [
    'Geef ALLEEN dit JSON-object terug:',
    '{"vendor":"naam van de leverancier/afzender uit het briefhoofd, of null",' +
      '"doc_type":"offerte|factuur|architect|overig",' +
      '"amount":"totaalbedrag als getal (punt als decimaal) of null",' +
      '"section_hint":"de bouwsectie waar dit bij hoort (bv. ruwbouw, ramen, vloeren, afwerking, tuin, sanitair, elektriciteit) of null"}',
    '',
    `Originele bestandsnaam: ${name || '(onbekend)'}`,
  ].join('\n')
}

function parseModelJson(text) {
  let t = (text || '').trim()
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start !== -1 && end !== -1) t = t.slice(start, end + 1)
  return JSON.parse(t)
}

// Find a tag by case-insensitive name within a project, creating it if absent.
async function ensureTag(supabase, projectId, name, color = null) {
  const clean = String(name || '').trim()
  if (!clean) return null
  const { data: found } = await supabase
    .from('tags')
    .select('id')
    .eq('project_id', projectId)
    .ilike('name', clean)
    .limit(1)
  if (found?.[0]) return found[0].id
  const { data, error } = await supabase
    .from('tags')
    .insert({ id: crypto.randomUUID(), project_id: projectId, name: clean, color })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

async function linkTags(supabase, fileId, tagIds) {
  const rows = tagIds.filter(Boolean).map((tag_id) => ({ file_id: fileId, tag_id }))
  if (!rows.length) return
  await supabase.from('file_tags').upsert(rows, { onConflict: 'file_id,tag_id', ignoreDuplicates: true })
}

function titleCase(s) {
  const t = String(s || '').trim()
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!url || !key || !apiKey) {
    return { statusCode: 500, body: 'Server is not configured' }
  }
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  let fileId
  try {
    fileId = JSON.parse(event.body || '{}').fileId
  } catch {
    return { statusCode: 400, body: 'Invalid JSON body' }
  }
  if (!fileId) return { statusCode: 400, body: 'Missing fileId' }

  // Mark errored + return; used by every failure path below.
  const fail = async (code, msg) => {
    await supabase.from('files').update({ ai_status: 'error' }).eq('id', fileId)
    return { statusCode: code, body: msg }
  }

  try {
    const { data: file, error: loadErr } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()
    if (loadErr || !file) return await fail(404, 'File not found')

    const mime = file.mime_type || ''
    const isPdf = mime === 'application/pdf'
    const isImage = IMAGE_TYPES.includes(mime)
    if (!isPdf && !isImage) {
      // Nothing to read; don't leave it stuck on "pending".
      await supabase.from('files').update({ ai_status: 'done' }).eq('id', fileId)
      const { data } = await supabase.from('files').select('*, file_tags(tag_id)').eq('id', fileId).single()
      return { statusCode: 200, body: JSON.stringify({ file: { ...data, tag_ids: (data.file_tags ?? []).map((t) => t.tag_id) } }) }
    }
    if (file.size_bytes && file.size_bytes > MAX_BYTES) {
      return await fail(413, 'File too large for AI processing')
    }

    // Download the binary and base64-encode it for the model.
    const dl = await supabase.storage.from(BUCKET).download(file.storage_path)
    if (dl.error || !dl.data) return await fail(502, 'Could not download file')
    const buf = Buffer.from(await dl.data.arrayBuffer())
    if (buf.length > MAX_BYTES) return await fail(413, 'File too large for AI processing')
    const dataB64 = buf.toString('base64')

    const content = [{ type: 'text', text: buildPrompt(file.name) }]
    content.push(
      isPdf
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: dataB64 } }
        : { type: 'image', source: { type: 'base64', media_type: mime, data: dataB64 } },
    )

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 256,
        system: SYSTEM_RULE,
        messages: [{ role: 'user', content }],
      }),
    })
    if (!res.ok) return await fail(502, `Anthropic error ${res.status}`)
    const json = await res.json()
    const textBlock = (json.content || []).find((c) => c.type === 'text')
    const parsed = parseModelJson(textBlock ? textBlock.text : '{}')

    const vendor = parsed.vendor && String(parsed.vendor).trim() ? String(parsed.vendor).trim() : null
    const docType = ['offerte', 'factuur', 'architect', 'overig'].includes(parsed.doc_type) ? parsed.doc_type : 'overig'
    const amountNum = parsed.amount != null && !Number.isNaN(Number(parsed.amount)) ? Number(parsed.amount) : null
    const sectionHint = parsed.section_hint && String(parsed.section_hint).trim() ? String(parsed.section_hint).trim() : null

    // Build the friendly title: "Vendor – Type (€amount)".
    const typeLabel = DOCTYPE_TAG[docType] || 'Document'
    let aiTitle = vendor ? `${vendor} – ${typeLabel}` : `${typeLabel} – ${file.name}`
    if (amountNum != null) aiTitle += ` (€${amountNum.toLocaleString('nl-BE')})`

    const patch = { ai_title: aiTitle, vendor, ai_status: 'done' }
    if (DOCTYPE_CATEGORY[docType]) patch.category = DOCTYPE_CATEGORY[docType]
    if (amountNum != null && (file.amount == null)) patch.amount = amountNum
    await supabase.from('files').update(patch).eq('id', fileId)

    // Proactive tags: fixed doc-type tag + section tag (combination rule).
    const tagIds = []
    if (DOCTYPE_TAG[docType]) tagIds.push(await ensureTag(supabase, file.project_id, DOCTYPE_TAG[docType]))
    if (sectionHint) {
      // Combination: match an existing project section by name; else a general term.
      const { data: secs } = await supabase
        .from('entries')
        .select('name')
        .eq('project_id', file.project_id)
        .eq('type', 'section')
      const hintLc = sectionHint.toLowerCase()
      const match = (secs || []).find((s) => {
        const n = (s.name || '').trim().toLowerCase()
        return n && (n === hintLc || n.includes(hintLc) || hintLc.includes(n))
      })
      tagIds.push(await ensureTag(supabase, file.project_id, match ? match.name.trim() : titleCase(sectionHint)))
    }
    await linkTags(supabase, fileId, tagIds)

    const { data: out } = await supabase.from('files').select('*, file_tags(tag_id)').eq('id', fileId).single()
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ file: { ...out, tag_ids: (out.file_tags ?? []).map((t) => t.tag_id) } }),
    }
  } catch (e) {
    return await fail(500, `AI processing failed: ${e.message}`)
  }
}

// Seed the DEMO Supabase project with a login + a fictional renovation: sections,
// items, generated quote/invoice PDFs and inspiration photos. Runs against a SEPARATE
// demo project (never the real one). Idempotent: clears the project's entries/files
// first, then re-seeds.
//
// Run: node scripts/seed-demo.mjs   (reads scripts/.demo.env or the environment)
// Env: DEMO_SUPABASE_URL, DEMO_SUPABASE_SERVICE_ROLE_KEY
// Login it creates: demo@demo.com / demo1234 (email auto-confirmed).

import { createClient } from '@supabase/supabase-js'
import { createHash, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { withGenerator } from './demo-assets.mjs'

const here = dirname(fileURLToPath(import.meta.url))

;(function loadEnv() {
  try {
    const txt = readFileSync(join(here, '.demo.env'), 'utf8')
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    /* rely on the environment */
  }
})()

const URL = process.env.DEMO_SUPABASE_URL
const KEY = process.env.DEMO_SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) {
  console.error('Missing DEMO_SUPABASE_URL / DEMO_SUPABASE_SERVICE_ROLE_KEY (see scripts/.demo.env).')
  process.exit(1)
}
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@demo.com'
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demo1234'
const BUCKET = 'item-files'

const supabase = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } })

const incBtw = (lines) => Math.round(lines.reduce((s, l) => s + l.qty * l.unit, 0) * 1.21 * 100) / 100

// --- The fictional renovation -------------------------------------------------
// Each item may carry a quote and/or invoice (→ generated PDF + files row) and
// inspiration photo labels (→ generated images). Amounts roll up in the app.
const PLAN = [
  { name: 'Ruwbouw', tag: 'Ruwbouw', items: [
    { name: 'Afbraak & grondwerken', raming: 14000,
      invoice: { vendor: 'Bouwwerken De Smet', sub: 'Algemene aannemingen', lines: [
        { desc: 'Afbraak binnenmuren en chape', qty: 1, unit: 6800 },
        { desc: 'Grondwerken en afvoer puin', qty: 1, unit: 5200 } ], status: 'accepted' } },
    { name: 'Funderingen & metselwerk', raming: 28000,
      quote: { vendor: 'Bouwwerken De Smet', sub: 'Algemene aannemingen', lines: [
        { desc: 'Funderingsplaat gewapend beton', qty: 1, unit: 11500 },
        { desc: 'Snelbouw dragend metselwerk', qty: 1, unit: 14200 } ], status: 'accepted' } } ] },
  { name: 'Dakwerken', tag: 'Dakwerken', items: [
    { name: 'Hellend dak & isolatie', raming: 16000,
      invoice: { vendor: 'Dakwerken Janssens', sub: 'Hellende & platte daken', lines: [
        { desc: 'Renovatie hellend dak incl. isolatie', qty: 1, unit: 12800 },
        { desc: 'Dakgoten zink incl. afvoer', qty: 24, unit: 78 } ], status: 'accepted' } } ] },
  { name: 'Buitenschrijnwerk', tag: 'Ramen', items: [
    { name: 'Ramen & voordeur', raming: 11000,
      quote: { vendor: 'Schrijnwerkerij Vermeulen', sub: 'Maatwerk ramen & deuren sinds 1998', lines: [
        { desc: 'PVC ramen triple glas', qty: 8, unit: 685 },
        { desc: 'Voordeur aluminium RAL 7016', qty: 1, unit: 2450 },
        { desc: 'Demontage bestaand schrijnwerk', qty: 1, unit: 540 } ], status: 'accepted' } },
    { name: 'Rolluiken', raming: 3200,
      quote: { vendor: 'Schrijnwerkerij Vermeulen', sub: 'Maatwerk ramen & deuren sinds 1998', lines: [
        { desc: 'Elektrische rolluiken', qty: 6, unit: 430 } ], status: 'declined' } } ] },
  { name: 'Sanitair', tag: 'Sanitair', items: [
    { name: 'Leidingwerk & toestellen', raming: 9500,
      invoice: { vendor: 'Sanitair & Verwarming Peeters', sub: 'Installatie & onderhoud', lines: [
        { desc: 'Vernieuwen sanitaire leidingen', qty: 1, unit: 4200 },
        { desc: 'Hangtoilet en lavabo', qty: 2, unit: 980 } ], status: 'accepted' } } ] },
  { name: 'Centrale verwarming', tag: 'Verwarming', items: [
    { name: 'Warmtepomp & vloerverwarming', raming: 18500,
      quote: { vendor: 'Sanitair & Verwarming Peeters', sub: 'Installatie & onderhoud', lines: [
        { desc: 'Lucht/water warmtepomp', qty: 1, unit: 11800 },
        { desc: 'Vloerverwarming gelijkvloers', qty: 95, unit: 48 } ], status: 'accepted' } } ] },
  { name: 'Elektriciteit', tag: 'Elektriciteit', items: [
    { name: 'Volledige herbekabeling', raming: 12000,
      invoice: { vendor: 'Elektro Maes', sub: 'Residentiële elektrotechniek', lines: [
        { desc: 'Herbekabeling + zekeringkast', qty: 1, unit: 8600 },
        { desc: 'Keuring installatie', qty: 1, unit: 220 } ], status: 'accepted' } } ] },
  { name: 'Binnenafwerking', tag: 'Afwerking', items: [
    { name: 'Pleisterwerk', raming: 8000,
      invoice: { vendor: 'Schilderwerken Claes', sub: 'Pleister- & schilderwerken', lines: [
        { desc: 'Bepleistering muren en plafonds', qty: 1, unit: 7400 } ], status: 'accepted' } },
    { name: 'Schilderwerken', raming: 6500,
      quote: { vendor: 'Schilderwerken Claes', sub: 'Pleister- & schilderwerken', lines: [
        { desc: 'Schilderen volledig gelijkvloers', qty: 1, unit: 5900 } ], status: 'accepted' } } ] },
  { name: 'Vloeren', tag: 'Vloeren', items: [
    { name: 'Tegel- en parketwerk', raming: 14500, photos: ['Vloeren'],
      quote: { vendor: 'Vloeren Wauters', sub: 'Tegels, parket & natuursteen', lines: [
        { desc: 'Keramische tegels gelijkvloers', qty: 78, unit: 95 },
        { desc: 'Meerlagenparket verdieping', qty: 52, unit: 79 } ], status: 'accepted' } } ] },
  { name: 'Keuken', tag: 'Afwerking', items: [
    { name: 'Maatkeuken', raming: 22000, photos: ['Keuken', 'Keuken — eiland'],
      quote: { vendor: 'Keukens Devos', sub: 'Maatwerkkeukens', lines: [
        { desc: 'Maatkeuken incl. toestellen', qty: 1, unit: 18500 } ], status: 'accepted' } } ] },
  { name: 'Badkamer', tag: 'Sanitair', items: [
    { name: 'Volledige badkamer', raming: 13000, photos: ['Badkamer'],
      quote: { vendor: 'Sanitair & Verwarming Peeters', sub: 'Installatie & onderhoud', lines: [
        { desc: 'Inloopdouche, bad en meubel', qty: 1, unit: 7200 },
        { desc: 'Tegelwerk badkamer', qty: 24, unit: 110 } ], status: 'accepted' } } ] },
  { name: 'Tuin & terras', tag: 'Tuin', items: [
    { name: 'Terras & tuinaanleg', raming: 9000, photos: ['Tuin', 'Terras'],
      quote: { vendor: 'Tuinaanleg Verstraeten', sub: 'Tuinarchitectuur & aanleg', lines: [
        { desc: 'Terras keramische tegels', qty: 35, unit: 120 },
        { desc: 'Beplanting en gazon', qty: 1, unit: 3400 } ], status: 'declined' } } ] },
]

const PALETTES = {
  Keuken: { c1: '#e8a87c', c2: '#c38d9e' }, 'Keuken — eiland': { c1: '#d9a06b', c2: '#8a5a44' },
  Badkamer: { c1: '#8ec5d6', c2: '#5b8a9a' }, Vloeren: { c1: '#c9a27a', c2: '#8a6a4a' },
  Tuin: { c1: '#9ec18f', c2: '#5a7d52' }, Terras: { c1: '#b7a98f', c2: '#7d6f57' },
}

async function clearProject(projectId) {
  const { data: files } = await supabase.from('files').select('id, storage_path').eq('project_id', projectId)
  if (files?.length) {
    await supabase.storage.from(BUCKET).remove(files.map((f) => f.storage_path))
    await supabase.from('files').delete().eq('project_id', projectId)
  }
  await supabase.from('entries').delete().eq('project_id', projectId)
}

async function ensureUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL, password: DEMO_PASSWORD, email_confirm: true,
    user_metadata: { display_name: 'Demo' },
  })
  if (error && !/already.*registered|already been registered|duplicate/i.test(error.message)) throw error
  let userId = data?.user?.id
  if (!userId) {
    const { data: list } = await supabase.auth.admin.listUsers()
    userId = list?.users?.find((u) => u.email === DEMO_EMAIL)?.id
  }
  if (userId) {
    await supabase.auth.admin.updateUserById(userId, { password: DEMO_PASSWORD, email_confirm: true })
    await supabase.from('profiles').upsert({ id: userId, display_name: 'Demo', initial: 'D' })
  }
  return userId
}

async function tagId(projectId, name, color, cache) {
  const key = name.toLowerCase()
  if (cache.has(key)) return cache.get(key)
  const { data: found } = await supabase.from('tags').select('id').eq('project_id', projectId).ilike('name', name).limit(1)
  let id = found?.[0]?.id
  if (!id) {
    const ins = await supabase.from('tags').insert({ id: randomUUID(), project_id: projectId, name, color }).select('id').single()
    id = ins.data.id
  }
  cache.set(key, id)
  return id
}

async function uploadDoc(projectId, entryId, buffer, name, contentType, versions, meta, gen, tags, tagCache, projectTags) {
  const path = `${entryId}/${randomUUID()}_${name.replace(/[^\w.\-]+/g, '_')}`
  const up = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType, upsert: false })
  if (up.error) throw up.error
  const hash = createHash('sha256').update(buffer).digest('hex')
  const fileId = randomUUID()
  const row = {
    id: fileId, project_id: projectId, entry_id: entryId, name, storage_path: path, mime_type: contentType,
    category: meta.category, size_bytes: buffer.length, amount: meta.amount ?? null, status: meta.status ?? null,
    uploaded_by: 'Demo', content_hash: hash, ai_status: 'done',
    ai_title: meta.aiTitle ?? null, vendor: meta.vendor ?? null,
  }
  const ins = await supabase.from('files').insert(row).select('id').single()
  if (ins.error) throw ins.error
  // Tags: doc-type + section.
  const links = []
  for (const t of tags) links.push({ file_id: fileId, tag_id: await tagId(projectId, t.name, t.color, tagCache) })
  if (links.length) await supabase.from('file_tags').upsert(links, { onConflict: 'file_id,tag_id', ignoreDuplicates: true })
  return fileId
}

async function main() {
  console.log('→ demo project:', URL)
  const userId = await ensureUser()
  console.log('✓ login klaar:', DEMO_EMAIL, '/', DEMO_PASSWORD, userId ? `(user ${userId.slice(0, 8)}…)` : '')

  const { data: proj, error: pErr } = await supabase.from('projects').select('*').limit(1).single()
  if (pErr || !proj) throw new Error('Geen project gevonden — is het schema (demo_bundle.sql) gedraaid?')
  await supabase.from('projects').update({ name: 'Demo verbouwing', budget: 185000 }).eq('id', proj.id)
  const projectId = proj.id

  const { data: versions } = await supabase.from('versions').select('id').eq('project_id', projectId)
  const versionIds = (versions ?? []).map((v) => v.id)

  await clearProject(projectId)
  console.log('✓ project geleegd, opnieuw zaaien…')

  const tagCache = new Map()
  let pos = 0, nQuote = 0, nInvoice = 0, nPhoto = 0
  let quoteSeq = 10, invoiceSeq = 280

  await withGenerator(async (gen) => {
    for (const section of PLAN) {
      const secId = randomUUID()
      await supabase.from('entries').insert({
        id: secId, project_id: projectId, parent_id: null, type: 'section', name: section.name,
        position: pos++, raming: 0, offertes: 0, facturen: 0, version_ids: versionIds,
      })
      let itemPos = 0
      for (const item of section.items) {
        const itemId = randomUUID()
        let offertes = 0, facturen = 0
        const client = 'V. & K. De Bock<br>Demostraat 12, 9000 Gent'

        // Insert the item first so document rows can reference it (FK on entry_id).
        await supabase.from('entries').insert({
          id: itemId, project_id: projectId, parent_id: secId, type: 'item', name: item.name,
          position: itemPos++, raming: item.raming, offertes: 0, facturen: 0, version_ids: versionIds,
          description: `Demo-item onder ${section.name}.`,
        })

        if (item.quote) {
          const total = incBtw(item.quote.lines)
          const number = `OFF-2026-${String(quoteSeq++).padStart(3, '0')}`
          const date = new Date('2026-02-10'); const due = new Date('2026-03-12')
          const pdf = await gen.pdf({ kind: 'offerte', number, vendor: item.quote.vendor, vendorSub: item.quote.sub,
            client, date, validOrDue: due, lines: item.quote.lines })
          await uploadDoc(projectId, itemId, pdf, `Offerte_${number}_${item.quote.vendor.split(' ')[0]}.pdf`,
            'application/pdf', versionIds, { category: 'quote', amount: total, status: item.quote.status,
              vendor: item.quote.vendor, aiTitle: `${item.quote.vendor} – Offerte (€${total.toLocaleString('nl-BE')})` },
            gen, [{ name: 'Offerte', color: '#ff7a1a' }, { name: section.tag, color: '#2b2d5b' }], tagCache)
          offertes += total; nQuote++
        }
        if (item.invoice) {
          const total = incBtw(item.invoice.lines)
          const number = `F2026-${String(invoiceSeq++).padStart(4, '0')}`
          const date = new Date('2026-02-22'); const due = new Date('2026-03-08')
          const pdf = await gen.pdf({ kind: 'factuur', number, vendor: item.invoice.vendor, vendorSub: item.invoice.sub,
            client, date, validOrDue: due, lines: item.invoice.lines })
          await uploadDoc(projectId, itemId, pdf, `Factuur_${number}_${item.invoice.vendor.split(' ')[0]}.pdf`,
            'application/pdf', versionIds, { category: 'invoice', amount: total, status: item.invoice.status,
              vendor: item.invoice.vendor, aiTitle: `${item.invoice.vendor} – Factuur (€${total.toLocaleString('nl-BE')})` },
            gen, [{ name: 'Factuur', color: '#b47a12' }, { name: section.tag, color: '#2b2d5b' }], tagCache)
          facturen += total; nInvoice++
        }
        for (const label of item.photos ?? []) {
          const pal = PALETTES[label] || { c1: '#e8a87c', c2: '#c38d9e' }
          const img = await gen.image({ label, c1: pal.c1, c2: pal.c2, accent: '#ff7a1a' })
          await uploadDoc(projectId, itemId, img, `Inspiratie_${label.replace(/[^\w]+/g, '_')}.jpg`,
            'image/jpeg', versionIds, { category: 'picture' },
            gen, [{ name: section.tag, color: '#2b2d5b' }], tagCache)
          nPhoto++
        }

        // Now that documents are linked, write the rolled-up amounts onto the item.
        if (offertes || facturen) await supabase.from('entries').update({ offertes, facturen }).eq('id', itemId)
      }
    }
  })

  console.log(`✓ klaar: ${PLAN.length} secties, offertes: ${nQuote}, facturen: ${nInvoice}, foto's: ${nPhoto}`)
  console.log(`\nLog in op de demo-app met:  ${DEMO_EMAIL}  /  ${DEMO_PASSWORD}`)
}

main().catch((e) => {
  console.error('Seed mislukt:', e.message)
  process.exit(1)
})

// Daily "Verbouwing" email summary job.
//
// Pulls new Gmail messages labeled `Verbouwing` since the last cursor, decodes the
// body, fetches PDF attachments, summarizes each message with the Anthropic API
// (reading the PDFs natively), and upserts one row per message into email_summaries.
// Read-only on Gmail; never writes to budget tables. Idempotent on gmail_message_id.
//
// Run: `node scripts/daily-summary.mjs` (locally with a .env, or in CI with secrets).
// Secrets (env only, never hardcoded): GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET,
// GMAIL_REFRESH_TOKEN, ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const here = dirname(fileURLToPath(import.meta.url))

// --- config ---------------------------------------------------------------
// Resolved against the real Gmail labels at runtime (matches e.g. "01. Verbouwing").
// Override with GMAIL_LABEL if the label name changes.
const LABEL = process.env.GMAIL_LABEL || 'Verbouwing'
const BACKFILL_DAYS = 7
const MAX_PDF_BYTES = 10 * 1024 * 1024
const ANTHROPIC_MODEL = 'claude-sonnet-4-6'
const ANTHROPIC_VERSION = '2023-06-01'

// Optionally load a local .env (CI provides real env, so this is best-effort).
;(function loadEnv() {
  try {
    const txt = readFileSync(join(here, '..', '.env'), 'utf8')
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
    }
  } catch {
    /* no .env — rely on the environment */
  }
})()

const REQUIRED = [
  'GMAIL_CLIENT_ID',
  'GMAIL_CLIENT_SECRET',
  'GMAIL_REFRESH_TOKEN',
  'ANTHROPIC_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
]
const missing = REQUIRED.filter((k) => !process.env[k])
if (missing.length) {
  console.error(`Missing required secret(s): ${missing.join(', ')}`)
  process.exit(1)
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// --- helpers ---------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Retry a fetch-returning fn on 429/5xx with small exponential backoff.
async function withRetry(fn, { tries = 3, baseMs = 600, label = 'request' } = {}) {
  let lastErr
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await fn()
      if (res.ok) return res
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`${label} ${res.status}`)
      } else {
        const body = await res.text().catch(() => '')
        throw new Error(`${label} ${res.status}: ${body.slice(0, 300)}`)
      }
    } catch (e) {
      lastErr = e
    }
    if (attempt < tries) await sleep(baseMs * 2 ** (attempt - 1))
  }
  throw lastErr
}

function b64urlToString(data) {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
}
function b64urlToB64(data) {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('base64')
}
function stripHtml(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}
function header(headers, name) {
  const h = (headers || []).find((x) => x.name.toLowerCase() === name.toLowerCase())
  return h ? h.value : ''
}

// --- Gmail -----------------------------------------------------------------
async function gmailAccessToken() {
  const res = await withRetry(
    () =>
      fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GMAIL_CLIENT_ID,
          client_secret: process.env.GMAIL_CLIENT_SECRET,
          refresh_token: process.env.GMAIL_REFRESH_TOKEN,
          grant_type: 'refresh_token',
        }),
      }),
    { label: 'oauth token' },
  )
  const json = await res.json()
  return json.access_token
}

function gmailHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

// Resolve a label name to its id (exact match, else first name that contains it).
async function resolveLabelId(token, name) {
  const res = await withRetry(
    () => fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', { headers: gmailHeaders(token) }),
    { label: 'labels.list' },
  )
  const labels = (await res.json()).labels || []
  const lc = name.toLowerCase()
  const match =
    labels.find((l) => (l.name || '').toLowerCase() === lc) ||
    labels.find((l) => (l.name || '').toLowerCase().includes(lc))
  if (!match) {
    throw new Error(
      `Gmail label not found matching "${name}". Available: ${labels.map((l) => l.name).join(', ')}`,
    )
  }
  return { id: match.id, name: match.name }
}

async function listMessageIds(token, labelId, cursor) {
  const ids = []
  let pageToken
  do {
    const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages')
    url.searchParams.set('labelIds', labelId)
    url.searchParams.set('q', `after:${cursor}`)
    url.searchParams.set('maxResults', '100')
    if (pageToken) url.searchParams.set('pageToken', pageToken)
    const res = await withRetry(() => fetch(url, { headers: gmailHeaders(token) }), {
      label: 'messages.list',
    })
    const json = await res.json()
    for (const m of json.messages || []) ids.push(m.id)
    pageToken = json.nextPageToken
  } while (pageToken)
  return ids
}

async function getMessage(token, id) {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`
  const res = await withRetry(() => fetch(url, { headers: gmailHeaders(token) }), {
    label: 'messages.get',
  })
  return res.json()
}

async function getAttachment(token, messageId, attachmentId) {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`
  const res = await withRetry(() => fetch(url, { headers: gmailHeaders(token) }), {
    label: 'attachments.get',
  })
  return res.json()
}

// Walk MIME parts: collect plain text (preferred), html (fallback), attachments.
function walkParts(payload) {
  const out = { text: [], html: [], attachments: [] }
  function walk(part) {
    if (!part) return
    const mime = part.mimeType || ''
    const filename = part.filename || ''
    if (filename && part.body && part.body.attachmentId) {
      out.attachments.push({
        filename,
        mimeType: mime,
        attachmentId: part.body.attachmentId,
        size: part.body.size || 0,
      })
    } else if (mime === 'text/plain' && part.body && part.body.data) {
      out.text.push(b64urlToString(part.body.data))
    } else if (mime === 'text/html' && part.body && part.body.data) {
      out.html.push(b64urlToString(part.body.data))
    }
    for (const child of part.parts || []) walk(child)
  }
  walk(payload)
  return out
}

// --- Anthropic -------------------------------------------------------------
const SYSTEM_RULE =
  'You summarize renovation-related emails for a budget-tracking app. You DESCRIBE and ' +
  'SUMMARIZE only. You must NEVER recommend, create, modify, imply, or perform any budget ' +
  'line item, database write, or financial action — you only report what the email and its ' +
  'attachments communicated. Extract amounts, vendors, dates and deadlines from the body AND ' +
  'any attached PDFs. Write "summary_text" and every "key_points" entry in DUTCH (Nederlands), ' +
  'regardless of the email language. Keep the "category" value as one of the exact English codes. ' +
  'Reply with ONLY a single JSON object, no prose, no code fences.'

function buildPrompt({ sender, subject, date, body, attachmentNames, skippedNote }) {
  return [
    'Summarize this renovation email IN DUTCH. Return ONLY JSON of this exact shape:',
    '{"category":"quote|invoice|architect|other","summary_text":"2-4 zinnen samenvatting in het Nederlands, inclusief bedragen uit bijgevoegde PDF\'s","key_points":["korte Nederlandse punten: bedragen, data, deadlines"],"action_needed":true}',
    '',
    `From: ${sender}`,
    `Subject: ${subject}`,
    `Date: ${date}`,
    attachmentNames.length ? `Attachments: ${attachmentNames.join(', ')}` : 'Attachments: none',
    skippedNote ? `Note: ${skippedNote}` : '',
    '',
    'Body:',
    body || '(no readable text body; rely on subject and any attached PDFs)',
  ]
    .filter(Boolean)
    .join('\n')
}

function parseModelJson(text) {
  let t = (text || '').trim()
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start !== -1 && end !== -1) t = t.slice(start, end + 1)
  return JSON.parse(t)
}

async function summarize({ promptText, pdfs }) {
  const content = [{ type: 'text', text: promptText }]
  for (const pdf of pdfs) {
    content.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: pdf.dataB64 },
    })
  }
  const res = await withRetry(
    () =>
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': ANTHROPIC_VERSION,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 1024,
          system: SYSTEM_RULE,
          messages: [{ role: 'user', content }],
        }),
      }),
    { label: 'anthropic', tries: 4, baseMs: 1000 },
  )
  const json = await res.json()
  const textBlock = (json.content || []).find((c) => c.type === 'text')
  const parsed = parseModelJson(textBlock ? textBlock.text : '')
  const category = ['quote', 'invoice', 'architect', 'other'].includes(parsed.category)
    ? parsed.category
    : 'other'
  return {
    category,
    summary_text: String(parsed.summary_text || '').slice(0, 4000),
    key_points: Array.isArray(parsed.key_points) ? parsed.key_points.map(String).slice(0, 20) : [],
    action_needed: Boolean(parsed.action_needed),
  }
}

// --- cursor ----------------------------------------------------------------
async function readCursor() {
  const { data, error } = await supabase
    .from('processing_runs')
    .select('new_cursor')
    .in('status', ['success', 'partial'])
    .not('new_cursor', 'is', null)
    .order('ran_at', { ascending: false })
    .limit(1)
  if (error) throw error
  if (data && data.length && data[0].new_cursor) return parseInt(data[0].new_cursor, 10)
  return Math.floor(Date.now() / 1000) - BACKFILL_DAYS * 86400 // first-run backfill
}

// --- main ------------------------------------------------------------------
async function main() {
  const runStart = Math.floor(Date.now() / 1000)
  const cursor = await readCursor()
  const token = await gmailAccessToken()
  const label = await resolveLabelId(token, LABEL)
  console.log(
    `[daily-summary] label="${label.name}" cursor=${cursor} (${new Date(cursor * 1000).toISOString()})`,
  )

  const ids = await listMessageIds(token, label.id, cursor)
  console.log(`[daily-summary] ${ids.length} candidate message(s)`)

  const successes = []
  const failures = []

  for (const id of ids) {
    try {
      const msg = await getMessage(token, id)
      const internalSec = Math.floor(Number(msg.internalDate || runStart * 1000) / 1000)
      const headers = msg.payload?.headers || []
      const sender = header(headers, 'From')
      const subject = header(headers, 'Subject')
      const dateHeader = header(headers, 'Date')
      const rfc822 = header(headers, 'Message-ID').replace(/^<|>$/g, '')
      const parts = walkParts(msg.payload)
      const body = parts.text.join('\n').trim() || (parts.html.length ? stripHtml(parts.html.join('\n')) : '')

      const attachmentNames = parts.attachments.map((a) => a.filename)
      const pdfs = []
      let skippedNote = ''
      for (const att of parts.attachments) {
        if (att.mimeType !== 'application/pdf') continue
        if ((att.size || 0) > MAX_PDF_BYTES) {
          skippedNote += `Large attachment not analyzed: ${att.filename}. `
          continue
        }
        const a = await getAttachment(token, id, att.attachmentId)
        if (a && a.data) {
          if ((a.size || 0) > MAX_PDF_BYTES) {
            skippedNote += `Large attachment not analyzed: ${att.filename}. `
            continue
          }
          pdfs.push({ filename: att.filename, dataB64: b64urlToB64(a.data) })
        }
      }

      const promptText = buildPrompt({
        sender,
        subject,
        date: dateHeader,
        body,
        attachmentNames,
        skippedNote: skippedNote.trim(),
      })
      const result = await summarize({ promptText, pdfs })

      const keyPoints = [...result.key_points]
      if (skippedNote.trim()) keyPoints.push(skippedNote.trim())

      const row = {
        gmail_message_id: id,
        gmail_thread_id: msg.threadId || null,
        rfc822_message_id: rfc822 || null,
        received_at: new Date(internalSec * 1000).toISOString(),
        sender,
        subject,
        category: result.category,
        summary_text: result.summary_text,
        key_points: keyPoints,
        has_attachments: attachmentNames.length > 0,
        attachment_names: attachmentNames,
        action_needed: result.action_needed,
      }
      const { error } = await supabase
        .from('email_summaries')
        .upsert(row, { onConflict: 'gmail_message_id' })
      if (error) throw error

      successes.push({ id, internalSec })
      console.log(`  ✓ ${subject || '(no subject)'} → ${result.category}`)
    } catch (e) {
      failures.push({ id, internalSec: runStart, error: e.message })
      console.error(`  ✗ message ${id}: ${e.message}`)
    }
  }

  // Advance cursor only past successfully processed messages: if anything failed,
  // resume from just before the earliest failure so it is retried next run.
  let newCursor
  if (failures.length) {
    newCursor = Math.min(...failures.map((f) => f.internalSec)) - 1
  } else {
    newCursor = runStart
  }
  const status = failures.length === 0 ? 'success' : successes.length ? 'partial' : 'failed'

  const { error: runErr } = await supabase.from('processing_runs').insert({
    cursor_used: String(cursor),
    new_cursor: String(newCursor),
    messages_processed: successes.length,
    status,
    error_detail: failures.length ? failures.map((f) => `${f.id}: ${f.error}`).join(' | ').slice(0, 4000) : null,
  })
  if (runErr) throw runErr

  console.log(`[daily-summary] done: status=${status} processed=${successes.length} failed=${failures.length} new_cursor=${newCursor}`)
  if (status === 'failed') process.exit(1)
}

main().catch((e) => {
  console.error('[daily-summary] fatal:', e.message)
  process.exit(1)
})

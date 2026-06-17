// Diagnostic: liveness-check the daily-summary secrets WITHOUT printing any values.
// Run in CI via the check-secrets workflow (workflow_dispatch). Each service that is
// configured gets a real ping; missing ones are skipped. Exit non-zero on any failure.

const need = [
  'GMAIL_CLIENT_ID',
  'GMAIL_CLIENT_SECRET',
  'GMAIL_REFRESH_TOKEN',
  'ANTHROPIC_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
]
console.log('--- presence (names only) ---')
for (const k of need) console.log(`${k}: ${process.env[k] ? 'present' : 'MISSING'}`)

let ok = true
console.log('\n--- liveness ---')

// Supabase service role
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
    const { error, count } = await sb
      .from('processing_runs')
      .select('id', { count: 'exact', head: true })
    if (error) throw error
    console.log(`Supabase service role: OK (processing_runs reachable, rows=${count})`)
  } catch (e) {
    ok = false
    console.log(`Supabase service role: FAIL — ${e.message}`)
  }
} else {
  console.log('Supabase: skipped (url/key missing)')
}

// Anthropic — minimal 1-token call with the model the job uses
if (process.env.ANTHROPIC_API_KEY) {
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      }),
    })
    if (r.ok) console.log('Anthropic API (claude-sonnet-4-6): OK')
    else {
      ok = false
      console.log(`Anthropic API: FAIL ${r.status} — ${(await r.text()).slice(0, 200)}`)
    }
  } catch (e) {
    ok = false
    console.log(`Anthropic API: FAIL — ${e.message}`)
  }
} else {
  console.log('Anthropic: skipped (key missing)')
}

// Gmail OAuth — only if the refresh token is present
if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) {
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GMAIL_CLIENT_ID,
        client_secret: process.env.GMAIL_CLIENT_SECRET,
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    })
    if (r.ok) console.log('Gmail OAuth refresh: OK (access token obtained)')
    else {
      ok = false
      console.log(`Gmail OAuth refresh: FAIL ${r.status} — ${(await r.text()).slice(0, 200)}`)
    }
  } catch (e) {
    ok = false
    console.log(`Gmail OAuth refresh: FAIL — ${e.message}`)
  }
} else {
  const haveClient = process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET
  console.log(
    `Gmail OAuth: ${haveClient ? 'client id/secret present' : 'client id/secret MISSING'}; ` +
      'refresh token not set yet → cannot validate the token exchange.',
  )
}

console.log(`\nResult: ${ok ? 'all configured services OK' : 'one or more FAILED'}`)
process.exit(ok ? 0 : 1)

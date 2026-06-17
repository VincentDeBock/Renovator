// One-off helper to mint a Gmail refresh token for a DESKTOP OAuth client, using
// the loopback (localhost) flow — no OAuth Playground or redirect-URI setup needed.
//
// Run:
//   GMAIL_CLIENT_ID=xxx GMAIL_CLIENT_SECRET=yyy node scripts/get-refresh-token.mjs
//   (or put those two in .env and just run: node scripts/get-refresh-token.mjs)
//
// It opens Google's consent page, you approve read-only Gmail access, and it prints
// the refresh token. Copy that into the GMAIL_REFRESH_TOKEN GitHub secret.

import http from 'node:http'
import { exec } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
try {
  for (const line of readFileSync(join(here, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  /* no .env */
}

const CLIENT_ID = process.env.GMAIL_CLIENT_ID
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET first (your Desktop client values).')
  process.exit(1)
}

const PORT = 4280
const REDIRECT = `http://localhost:${PORT}`
const SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'
const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
  })

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  if (error) {
    res.end(`Consent error: ${error}. You can close this tab.`)
    console.error('Consent error:', error)
    server.close()
    process.exit(1)
  }
  if (!code) {
    res.end('Waiting for Google…')
    return
  }
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT,
        grant_type: 'authorization_code',
      }),
    })
    const json = await r.json()
    if (!r.ok) {
      res.end('Token exchange failed — check the terminal.')
      console.error('Token exchange failed:', JSON.stringify(json))
      server.close()
      process.exit(1)
    }
    res.end('<h2>Done — you can close this tab and return to the terminal.</h2>')
    if (json.refresh_token) {
      console.log('\n========== GMAIL_REFRESH_TOKEN ==========\n' + json.refresh_token + '\n=========================================\n')
      console.log('Copy the value above into the GMAIL_REFRESH_TOKEN GitHub secret.')
      server.close()
      process.exit(0)
    } else {
      console.error(
        'No refresh_token returned. Revoke prior access at ' +
          'https://myaccount.google.com/permissions and run again.',
      )
      server.close()
      process.exit(1)
    }
  } catch (e) {
    res.end('Error — check the terminal.')
    console.error(e)
    server.close()
    process.exit(1)
  }
})

server.listen(PORT, () => {
  console.log(`\nOpening Google consent in your browser… If it doesn't open, paste this URL:\n\n${authUrl}\n`)
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  exec(`${opener} "${authUrl}"`, () => {})
})

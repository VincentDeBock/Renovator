// Manual "Sync nu" trigger for the Communicatie page. Verifies the caller is a
// logged-in app user, then fires the existing GitHub Actions workflow
// (daily-summary.yml) via workflow_dispatch — reusing all secrets already
// configured in GitHub Actions. Returns 202 immediately; the run itself is
// cursor-based and idempotent, so it is safe alongside the scheduled runs.
//
// Server-side only. Env (Netlify): GITHUB_DISPATCH_TOKEN (fine-grained PAT with
// Actions: read/write on the repo), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Optional: GITHUB_REPO ("owner/name"), GITHUB_WORKFLOW_FILE, GITHUB_REF.

import { createClient } from '@supabase/supabase-js'

const REPO = process.env.GITHUB_REPO || 'VincentDeBock/Renovator'
const WORKFLOW = process.env.GITHUB_WORKFLOW_FILE || 'daily-summary.yml'
const REF = process.env.GITHUB_REF || 'main'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }

  const token = process.env.GITHUB_DISPATCH_TOKEN
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!token || !url || !key) return { statusCode: 500, body: 'Server is not configured' }

  // AuthZ: require a valid Supabase session token so the endpoint can't be hit anonymously.
  const auth = event.headers.authorization || event.headers.Authorization || ''
  const jwt = auth.replace(/^Bearer\s+/i, '')
  if (!jwt) return { statusCode: 401, body: 'Niet ingelogd' }
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await supabase.auth.getUser(jwt)
  if (error || !data?.user) return { statusCode: 401, body: 'Sessie ongeldig' }

  // Fire the workflow.
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'renovator-sync',
      },
      body: JSON.stringify({ ref: REF }),
    },
  )
  // GitHub returns 204 No Content on a successful dispatch.
  if (res.status !== 204) {
    const detail = await res.text().catch(() => '')
    return { statusCode: 502, body: `GitHub dispatch faalde (${res.status}): ${detail.slice(0, 300)}` }
  }
  return { statusCode: 202, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ started: true }) }
}

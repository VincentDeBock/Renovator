import { supabase } from './supabase'

// Email summaries produced by the daily job (scripts/daily-summary.mjs). Read-only
// from the frontend; rows are written server-side with the service role.
export async function getEmailSummaries() {
  const { data, error } = await supabase
    .from('email_summaries')
    .select('*')
    .order('received_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// Kick off a manual mailbox sync. Calls the Netlify function, which verifies the
// session and fires the GitHub Actions summary workflow. Returns when the run is
// queued (not finished) — new summaries appear after the job completes (~1 min).
export async function triggerSync() {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Niet ingelogd')
  const res = await fetch('/.netlify/functions/trigger-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(txt || `Sync mislukt (${res.status})`)
  }
  return true
}

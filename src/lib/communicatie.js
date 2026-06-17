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

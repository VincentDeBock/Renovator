import { supabase } from './supabase'

// The handful of app users (Vincent & Karo), seeded into `profiles` from auth.
// Used for the task owner picker and its single-letter avatar.
export async function getProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('display_name', { ascending: true })
  if (error) throw error
  return data ?? []
}

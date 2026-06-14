// Auth data layer: thin wrappers over Supabase Auth so components never touch the
// client directly. Supabase persists the session in localStorage and refreshes the
// token on its own (persistSession + autoRefreshToken are on by default).

import { supabase } from './supabase'

// Email + password sign-in. Returns Supabase's { data, error }.
export function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export function signOut() {
  return supabase.auth.signOut()
}

// Resolve the persisted session (if any) on load. Returns { data, error }.
export function getSession() {
  return supabase.auth.getSession()
}

// Subscribe to login/logout/token-refresh events. Returns the subscription so the
// caller can unsubscribe. callback signature: (event, session).
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}

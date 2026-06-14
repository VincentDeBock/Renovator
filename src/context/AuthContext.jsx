import { createContext, useContext, useEffect, useState } from 'react'
import * as auth from '../lib/auth'

const AuthContext = createContext(null)

// Holds the session for the whole app. Resolves the persisted session once on
// load, then tracks login/logout via Supabase's auth listener.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    auth.getSession().then(({ data }) => {
      if (!mounted) return
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: listener } = auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  // Prefer an explicit display name from user metadata, else the email.
  const displayName = user
    ? user.user_metadata?.display_name || user.email
    : null

  const value = {
    user,
    displayName,
    loading,
    // Returns an error object on failure, or null on success. We never surface
    // tokens; the session lives inside the Supabase client.
    signIn: async (email, password) => {
      const { error } = await auth.signIn(email, password)
      return error ?? null
    },
    signOut: () => auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

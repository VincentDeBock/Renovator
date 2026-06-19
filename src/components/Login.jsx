import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

// Login-only screen. There is no registration or reset here by design — the two
// accounts are created in the Supabase dashboard.
export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    const err = await signIn(email.trim(), password)
    setSubmitting(false)
    if (err) {
      setError(messageFor(err))
    }
    // On success the auth listener flips the gate to the app — nothing to do here.
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={onSubmit} noValidate>
        <h1 className="login-title">Renotrack</h1>
        <p className="login-sub">Meld je aan om verder te gaan</p>

        <label className="field">
          <span className="field-label">E-mail</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Wachtwoord</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        <button type="submit" className="login-submit" disabled={submitting}>
          {submitting ? 'Bezig…' : 'Aanmelden'}
        </button>
      </form>
    </div>
  )
}

// Map Supabase auth errors to a clear, friendly message.
function messageFor(error) {
  const msg = (error?.message || '').toLowerCase()
  if (msg.includes('invalid login credentials')) {
    return 'E-mail of wachtwoord klopt niet.'
  }
  if (msg.includes('email not confirmed')) {
    return 'Dit account is nog niet bevestigd.'
  }
  return 'Aanmelden mislukt. Probeer het opnieuw.'
}

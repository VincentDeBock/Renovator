import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang, LangToggle } from '../i18n'

// Login-only screen. There is no registration or reset here by design — the two
// accounts are created in the Supabase dashboard.
export default function Login() {
  const { signIn } = useAuth()
  const { t } = useLang()
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
      setError(t(keyFor(err)))
    }
    // On success the auth listener flips the gate to the app — nothing to do here.
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={onSubmit} noValidate>
        <div className="login-lang">
          <LangToggle />
        </div>
        <h1 className="login-title">Renotrack</h1>
        <p className="login-sub">{t('login.sub')}</p>

        <label className="field">
          <span className="field-label">{t('login.email')}</span>
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
          <span className="field-label">{t('login.password')}</span>
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
          {submitting ? t('common.busy') : t('login.submit')}
        </button>
      </form>
    </div>
  )
}

// Map Supabase auth errors to a translation key for a clear, friendly message.
function keyFor(error) {
  const msg = (error?.message || '').toLowerCase()
  if (msg.includes('invalid login credentials')) return 'login.errCredentials'
  if (msg.includes('email not confirmed')) return 'login.errUnconfirmed'
  return 'login.errGeneric'
}

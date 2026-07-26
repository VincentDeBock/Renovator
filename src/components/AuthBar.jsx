import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n'

// Slim bar above the app: who is logged in + a sign-out button. Intentionally
// minimal — no settings or navigation here (out of scope for this prompt).
export default function AuthBar() {
  const { displayName, signOut } = useAuth()
  const { t } = useLang()

  return (
    <div className="authbar">
      <span className="authbar-user">
        {t('nav.signedInAs')} <strong>{displayName}</strong>
      </span>
      <button type="button" className="authbar-signout" onClick={() => signOut()}>
        {t('nav.signout')}
      </button>
    </div>
  )
}

import { useAuth } from '../context/AuthContext'

// Slim bar above the app: who is logged in + a sign-out button. Intentionally
// minimal — no settings or navigation here (out of scope for this prompt).
export default function AuthBar() {
  const { displayName, signOut } = useAuth()

  return (
    <div className="authbar">
      <span className="authbar-user">
        Ingelogd als <strong>{displayName}</strong>
      </span>
      <button type="button" className="authbar-signout" onClick={() => signOut()}>
        Afmelden
      </button>
    </div>
  )
}

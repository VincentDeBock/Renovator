import { useAuth } from '../context/AuthContext'
import Login from './Login'

// Gate: loading → brief loading state (no login flash on reload); no user → Login;
// user → the app. Sign-out lives in TopNav now.
export default function AuthGate({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="boot">
        <div className="boot-card">Even geduld…</div>
      </div>
    )
  }
  if (!user) return <Login />
  return children
}

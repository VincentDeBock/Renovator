import { useAuth } from '../context/AuthContext'
import Login from './Login'
import AuthBar from './AuthBar'

// Decides what the app shows based on the session:
//  - still resolving -> brief loading state (no flash of Login on reload)
//  - no user         -> Login
//  - user            -> the existing app, unchanged, with a slim sign-out bar
export default function AuthGate({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="boot">
        <div className="boot-card">Even geduld…</div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <>
      <AuthBar />
      {children}
    </>
  )
}

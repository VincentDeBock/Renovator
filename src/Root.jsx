import { Routes, Route, Navigate } from 'react-router-dom'
import App from './App.jsx'
import Login from './components/Login'
import Landing from './pages/Landing'
import { useAuth } from './context/AuthContext'
import { useLang } from './i18n'

// Top-level auth branch. Logged-out visitors get the public marketing site
// (landing at `/`, login at `/login`); a signed-in user gets the full app, which
// owns its own routes. Replaces the old unconditional AuthGate wrap so there is a
// public surface in front of the login.
export default function Root() {
  const { user, loading } = useAuth()
  const { t } = useLang()

  if (loading) {
    return (
      <div className="boot">
        <div className="boot-card">{t('boot.wait')}</div>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return <App />
}

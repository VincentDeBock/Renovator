import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LINKS = [
  { to: '/', label: 'Overzicht', end: true },
  { to: '/todo', label: 'To do' },
  { to: '/documenten', label: 'Documenten' },
  { to: '/instellingen', label: 'Instellingen' },
]

export default function TopNav({ projectName }) {
  const { displayName, signOut } = useAuth()
  return (
    <header className="topnav">
      <div className="topnav-inner">
        <span className="topnav-title">{projectName}</span>
        <nav className="topnav-links">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `navtab ${isActive ? 'navtab--active' : ''}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="topnav-user">
          <span className="topnav-username">{displayName}</span>
          <button type="button" className="authbar-signout" onClick={() => signOut()}>
            Afmelden
          </button>
        </div>
      </div>
    </header>
  )
}

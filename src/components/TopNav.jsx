import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from './Icon'
import logo from '../assets/brand/logo.png'
import homeIcon from '../assets/brand/nav-home.png'
import tasksIcon from '../assets/brand/nav-tasks.png'
import docsIcon from '../assets/brand/nav-documents.png'
import settingsIcon from '../assets/brand/nav-settings.png'
import mailIcon from '../assets/brand/nav-mail.png'

const LINKS = [
  { to: '/', label: 'Overzicht', end: true, icon: homeIcon },
  { to: '/todo', label: 'To do', icon: tasksIcon },
  { to: '/communicatie', label: 'Communicatie', icon: mailIcon },
  { to: '/documenten', label: 'Documenten', icon: docsIcon },
  { to: '/instellingen', label: 'Instellingen', icon: settingsIcon },
]

export default function TopNav() {
  const { displayName, signOut } = useAuth()
  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Link to="/" className="topnav-brand" aria-label="RenovAI — naar overzicht">
          <img className="topnav-logo" src={logo} alt="" />
          <span className="topnav-wordmark">RenovAI</span>
        </Link>
        <nav className="topnav-links">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `navtab ${isActive ? 'navtab--active' : ''}`}
            >
              {l.icon ? (
                <img className="navtab-icon" src={l.icon} alt="" />
              ) : (
                <span className="navtab-icon navtab-icon--svg">
                  <Icon name={l.svg} size={20} />
                </span>
              )}
              <span>{l.label}</span>
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

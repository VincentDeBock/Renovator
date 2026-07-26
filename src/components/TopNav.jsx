import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang, LangToggle } from '../i18n'
import Icon from './Icon'
import logo from '../assets/brand/logo.png'
import homeIcon from '../assets/brand/nav-home.png'
import tasksIcon from '../assets/brand/nav-tasks.png'
import docsIcon from '../assets/brand/nav-documents.png'
import settingsIcon from '../assets/brand/nav-settings.png'
import mailIcon from '../assets/brand/nav-mail.png'

const LINKS = [
  { to: '/', key: 'nav.overview', end: true, icon: homeIcon },
  { to: '/todo', key: 'nav.todo', icon: tasksIcon },
  { to: '/communicatie', key: 'nav.comms', icon: mailIcon },
  { to: '/documenten', key: 'nav.docs', icon: docsIcon },
  { to: '/instellingen', key: 'nav.settings', icon: settingsIcon },
]

export default function TopNav() {
  const { displayName, signOut } = useAuth()
  const { t } = useLang()
  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Link to="/" className="topnav-brand" aria-label={t('nav.brandAria')}>
          <img className="topnav-logo" src={logo} alt="" />
          <span className="topnav-wordmark">Renotrack</span>
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
              <span>{t(l.key)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="topnav-user">
          <LangToggle />
          <span className="topnav-username">{displayName}</span>
          <button type="button" className="authbar-signout" onClick={() => signOut()}>
            {t('nav.signout')}
          </button>
        </div>
      </div>
    </header>
  )
}

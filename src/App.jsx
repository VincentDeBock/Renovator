import { useEffect, useState } from 'react'
import Overzicht from './components/Overzicht'
import Settings from './components/Settings'
import { getProject, getEntries, updateProject } from './lib/entries'

// Startup guard: confirm the Supabase wiring is alive and load the seeded
// project + its entries before handing off to the screens. App owns the project
// and entries state so it can be shared across the Overzicht and Settings views.
export default function App() {
  const [status, setStatus] = useState('loading')
  const [project, setProject] = useState(null)
  const [entries, setEntries] = useState([])
  const [error, setError] = useState(null)
  const [view, setView] = useState('overzicht') // 'overzicht' | 'settings'

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const proj = await getProject()
        if (!proj) {
          if (!cancelled) {
            setStatus('error')
            setError('Geen project gevonden. Voer supabase/schema.sql uit om er één te zaaien.')
          }
          return
        }
        const rows = await getEntries(proj.id)
        if (!cancelled) {
          setProject(proj)
          setEntries(rows)
          setStatus('ready')
        }
      } catch (e) {
        if (!cancelled) {
          setStatus('error')
          setError(e.message)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function saveBudget(budget) {
    const saved = await updateProject(project.id, { budget })
    setProject((p) => ({ ...p, ...saved }))
  }

  if (status === 'loading') {
    return (
      <div className="boot">
        <div className="boot-card">Verbinden met Supabase…</div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="boot">
        <div className="boot-card boot-card--error">
          <strong>Geen verbinding.</strong>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="appbar">
        <span className="appbar-title">{project.name}</span>
        <nav className="appnav">
          <button
            type="button"
            className={`navtab ${view === 'overzicht' ? 'navtab--active' : ''}`}
            onClick={() => setView('overzicht')}
          >
            Overzicht
          </button>
          <button
            type="button"
            className={`navtab ${view === 'settings' ? 'navtab--active' : ''}`}
            onClick={() => setView('settings')}
          >
            Instellingen
          </button>
        </nav>
      </div>

      {view === 'overzicht' ? (
        <Overzicht project={project} entries={entries} setEntries={setEntries} />
      ) : (
        <Settings project={project} onSaveBudget={saveBudget} />
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import Overzicht from './components/Overzicht'
import { getProject, getEntries } from './lib/entries'

// Startup guard: confirm the Supabase wiring is alive and load the seeded
// project + its entries before handing off to the Overzicht screen.
export default function App() {
  const [status, setStatus] = useState('loading')
  const [project, setProject] = useState(null)
  const [entries, setEntries] = useState([])
  const [error, setError] = useState(null)

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

  return <Overzicht project={project} initialEntries={entries} />
}

import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import TopNav from './components/TopNav'
import Overzicht from './components/Overzicht'
import Settings from './components/Settings'
import ToDo from './pages/ToDo'
import Documenten from './pages/Documenten'
import ItemDetail from './pages/ItemDetail'
import { useAuth } from './context/AuthContext'
import {
  getProject,
  getEntries,
  makeEntry,
  insertEntry,
  updateEntry,
  deleteEntry,
  updatePositions,
  updateProject,
} from './lib/entries'
import { getProfiles } from './lib/profiles'

// Startup guard + shared state. App owns project, entries and profiles and exposes
// optimistic entry mutations so both Overzicht and the item detail page can edit.
export default function App() {
  const { user } = useAuth()
  const [status, setStatus] = useState('loading')
  const [project, setProject] = useState(null)
  const [entries, setEntries] = useState([])
  const [profiles, setProfiles] = useState([])
  const [error, setError] = useState(null)
  const [opError, setOpError] = useState(null)

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
        const [rows, profs] = await Promise.all([getEntries(proj.id), getProfiles()])
        if (cancelled) return
        setProject(proj)
        setEntries(rows)
        setProfiles(profs)
        setStatus('ready')
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

  async function patchEntry(id, patch) {
    const snapshot = entries
    setEntries((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    try {
      const saved = await updateEntry(id, patch)
      setEntries((rows) => rows.map((r) => (r.id === id ? { ...r, ...saved } : r)))
    } catch (e) {
      setEntries(snapshot)
      setOpError(`Opslaan mislukt: ${e.message}`)
    }
  }

  async function removeEntry(id) {
    const snapshot = entries
    setEntries((rows) => rows.filter((r) => r.id !== id && r.parent_id !== id))
    try {
      await deleteEntry(id)
    } catch (e) {
      setEntries(snapshot)
      setOpError(`Verwijderen mislukt: ${e.message}`)
    }
  }

  function nextPosition(predicate) {
    const siblings = entries.filter(predicate)
    return siblings.length ? Math.max(...siblings.map((s) => s.position ?? 0)) + 1 : 0
  }

  async function addSection() {
    const row = makeEntry({ projectId: project.id, type: 'section', position: nextPosition((e) => e.type === 'section') })
    const snapshot = entries
    setEntries((rows) => [...rows, row])
    try {
      const saved = await insertEntry(row)
      setEntries((rows) => rows.map((r) => (r.id === row.id ? saved : r)))
    } catch (e) {
      setEntries(snapshot)
      setOpError(`Sectie toevoegen mislukt: ${e.message}`)
    }
  }

  async function addItem(sectionId) {
    const row = makeEntry({
      projectId: project.id,
      type: 'item',
      parentId: sectionId,
      position: nextPosition((e) => e.type === 'item' && e.parent_id === sectionId),
    })
    const snapshot = entries
    setEntries((rows) => [...rows, row])
    try {
      const saved = await insertEntry(row)
      setEntries((rows) => rows.map((r) => (r.id === row.id ? saved : r)))
    } catch (e) {
      setEntries(snapshot)
      setOpError(`Item toevoegen mislukt: ${e.message}`)
    }
  }

  async function persistOrder(orderedIds) {
    const snapshot = entries
    const posById = new Map(orderedIds.map((id, i) => [id, i]))
    setEntries((rows) => rows.map((r) => (posById.has(r.id) ? { ...r, position: posById.get(r.id) } : r)))
    try {
      await updatePositions(orderedIds.map((id, i) => ({ id, position: i })))
    } catch (e) {
      setEntries(snapshot)
      setOpError(`Volgorde opslaan mislukt: ${e.message}`)
    }
  }

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
      <TopNav projectName={project.name} />

      {opError && (
        <div className="app-banner banner banner--error" role="alert">
          {opError}
          <button type="button" className="banner-close" onClick={() => setOpError(null)}>✕</button>
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={
            <Overzicht
              project={project}
              entries={entries}
              patchEntry={patchEntry}
              removeEntry={removeEntry}
              addSection={addSection}
              addItem={addItem}
              persistOrder={persistOrder}
            />
          }
        />
        <Route path="/todo" element={<ToDo project={project} entries={entries} profiles={profiles} currentUserId={user?.id} />} />
        <Route path="/documenten" element={<Documenten project={project} entries={entries} />} />
        <Route path="/instellingen" element={<Settings project={project} onSaveBudget={saveBudget} />} />
        <Route
          path="/item/:id"
          element={
            <ItemDetail
              project={project}
              entries={entries}
              patchEntry={patchEntry}
              profiles={profiles}
              currentUserId={user?.id}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

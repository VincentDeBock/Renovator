import { useEffect, useState } from 'react'
import Overzicht from './components/Overzicht'
import Settings from './components/Settings'
import VersionTabs from './components/VersionTabs'
import {
  getProject,
  getEntries,
  getVersions,
  createVersion,
  updateVersion,
  deleteVersion,
  updateMemberships,
  updateProject,
} from './lib/entries'

const VERSION_PALETTE = [
  '#2dd4bf',
  '#ec4899',
  '#8b5cf6',
  '#f59e0b',
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#6366f1',
]

const activeKey = (projectId) => `renovator.activeVersion.${projectId}`

// Startup guard + top-level state. App owns project, entries and versions so they
// can be shared across the Overzicht and Settings views and the version tabs.
export default function App() {
  const [status, setStatus] = useState('loading')
  const [project, setProject] = useState(null)
  const [entries, setEntries] = useState([])
  const [versions, setVersions] = useState([])
  const [activeVersionId, setActiveVersionId] = useState(null)
  const [error, setError] = useState(null)
  const [opError, setOpError] = useState(null)
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
        const [rows, vers] = await Promise.all([getEntries(proj.id), getVersions(proj.id)])
        if (cancelled) return
        setProject(proj)
        setEntries(rows)
        setVersions(vers)

        const stored = localStorage.getItem(activeKey(proj.id))
        const valid = vers.find((v) => v.id === stored)
        setActiveVersionId(valid ? stored : vers[0]?.id ?? null)
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

  function selectVersion(id) {
    setActiveVersionId(id)
    if (project) localStorage.setItem(activeKey(project.id), id)
  }

  async function saveBudget(budget) {
    const saved = await updateProject(project.id, { budget })
    setProject((p) => ({ ...p, ...saved }))
  }

  // "+" duplicates the active version's membership into a new version.
  async function addVersion() {
    const id = crypto.randomUUID()
    const position = versions.length
      ? Math.max(...versions.map((v) => v.position ?? 0)) + 1
      : 0
    const color = VERSION_PALETTE[versions.length % VERSION_PALETTE.length]
    const name = `V${versions.length + 1}`
    const src = activeVersionId

    const snapV = versions
    const snapE = entries
    setVersions((vs) => [...vs, { id, project_id: project.id, name, color, position }])
    setEntries((rows) =>
      rows.map((r) =>
        (r.version_ids ?? []).includes(src)
          ? { ...r, version_ids: [...r.version_ids, id] }
          : r,
      ),
    )
    selectVersion(id)

    try {
      await createVersion({ projectId: project.id, id, name, color, position })
      const affected = snapE
        .filter((r) => (r.version_ids ?? []).includes(src))
        .map((r) => ({ id: r.id, version_ids: [...r.version_ids, id] }))
      if (affected.length) await updateMemberships(affected)
    } catch (e) {
      setVersions(snapV)
      setEntries(snapE)
      if (snapV[0]) selectVersion(snapV[0].id)
      setOpError(`Versie toevoegen mislukt: ${e.message}`)
    }
  }

  async function renameVersion(id, name) {
    const snapV = versions
    setVersions((vs) => vs.map((v) => (v.id === id ? { ...v, name } : v)))
    try {
      await updateVersion(id, { name })
    } catch (e) {
      setVersions(snapV)
      setOpError(`Hernoemen mislukt: ${e.message}`)
    }
  }

  async function removeVersion(id) {
    if (versions.length <= 1) return
    const snapV = versions
    const snapE = entries
    const remaining = versions.filter((v) => v.id !== id)

    setVersions(remaining)
    setEntries((rows) =>
      rows.map((r) =>
        (r.version_ids ?? []).includes(id)
          ? { ...r, version_ids: r.version_ids.filter((x) => x !== id) }
          : r,
      ),
    )
    if (activeVersionId === id) selectVersion(remaining[0].id)

    try {
      const affected = snapE
        .filter((r) => (r.version_ids ?? []).includes(id))
        .map((r) => ({ id: r.id, version_ids: r.version_ids.filter((x) => x !== id) }))
      if (affected.length) await updateMemberships(affected)
      await deleteVersion(id)
    } catch (e) {
      setVersions(snapV)
      setEntries(snapE)
      setOpError(`Versie verwijderen mislukt: ${e.message}`)
    }
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
      <VersionTabs
        versions={versions}
        activeId={activeVersionId}
        onSelect={selectVersion}
        onAdd={addVersion}
        onRename={renameVersion}
        onDelete={removeVersion}
      />

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

      {opError && (
        <div className="app-banner banner banner--error" role="alert">
          {opError}
          <button type="button" className="banner-close" onClick={() => setOpError(null)}>
            ✕
          </button>
        </div>
      )}

      {view === 'overzicht' ? (
        <Overzicht
          project={project}
          entries={entries}
          setEntries={setEntries}
          versions={versions}
          activeVersionId={activeVersionId}
        />
      ) : (
        <Settings project={project} onSaveBudget={saveBudget} />
      )}
    </div>
  )
}

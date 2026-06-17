import { useEffect, useMemo, useState } from 'react'
import EditableCell from './EditableCell'
import Icon from './Icon'
import { getTasks, makeTask, insertTask, updateTask, deleteTask } from '../lib/tasks'

const PRIO_RANK = { high: 0, medium: 1, low: 2 }
const PRIO_LABEL = { high: 'High', medium: 'Medium', low: 'Low' }

function OwnerCell({ ownerId, profiles, onChange }) {
  const p = profiles.find((x) => x.id === ownerId)
  return (
    <span className="owner">
      <span className="owner-avatar" title={p?.display_name || 'Niemand'}>{p?.initial || '?'}</span>
      <select className="owner-select" value={ownerId || ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">—</option>
        {profiles.map((pr) => (
          <option key={pr.id} value={pr.id}>{pr.display_name}</option>
        ))}
      </select>
    </span>
  )
}

// Reusable tasks table. When entryId is set, tasks are scoped to that item, new
// tasks auto-link to it, and the Item column is hidden.
export default function TaskTable({ projectId, entryId = null, profiles, currentUserId, itemOptions = [] }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [sort, setSort] = useState({ key: 'deadline', dir: 'asc' })
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getTasks({ projectId, entryId: entryId || undefined })
      .then((rows) => !cancelled && setTasks(rows))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [projectId, entryId])

  const itemLabel = useMemo(() => {
    const m = new Map(itemOptions.map((o) => [o.id, o.label]))
    return (id) => m.get(id) || '—'
  }, [itemOptions])

  const visible = useMemo(() => {
    let list = tasks.filter((t) => showCompleted || !t.completed)
    const dir = sort.dir === 'asc' ? 1 : -1
    list = [...list].sort((a, b) => {
      let r = 0
      if (sort.key === 'priority') r = PRIO_RANK[a.priority] - PRIO_RANK[b.priority]
      else if (sort.key === 'owner') r = (a.owner_id || '').localeCompare(b.owner_id || '')
      else if (sort.key === 'deadline') r = (a.deadline || '9999').localeCompare(b.deadline || '9999')
      else if (sort.key === 'title') r = (a.title || '').localeCompare(b.title || '')
      return r * dir
    })
    return list
  }, [tasks, showCompleted, sort])

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  }

  async function patch(id, p) {
    const snap = tasks
    setTasks((rows) => rows.map((t) => (t.id === id ? { ...t, ...p } : t)))
    try {
      const saved = await updateTask(id, p)
      setTasks((rows) => rows.map((t) => (t.id === id ? { ...t, ...saved } : t)))
    } catch (e) {
      setTasks(snap)
      setError(`Opslaan mislukt: ${e.message}`)
    }
  }

  async function add() {
    const row = makeTask({ projectId, entryId, ownerId: currentUserId, createdBy: currentUserId })
    const snap = tasks
    setTasks((rows) => [...rows, { ...row, created_at: new Date().toISOString() }])
    try {
      const saved = await insertTask(row)
      setTasks((rows) => rows.map((t) => (t.id === row.id ? saved : t)))
    } catch (e) {
      setTasks(snap)
      setError(`Taak toevoegen mislukt: ${e.message}`)
    }
  }

  async function remove(id) {
    const snap = tasks
    setTasks((rows) => rows.filter((t) => t.id !== id))
    try {
      await deleteTask(id)
    } catch (e) {
      setTasks(snap)
      setError(`Verwijderen mislukt: ${e.message}`)
    }
  }

  const sortMark = (key) => (sort.key === key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : '')

  return (
    <div className="tasks">
      <div className="tasks-toolbar">
        <button type="button" className="link-btn" onClick={() => setShowCompleted((v) => !v)}>
          {showCompleted ? 'Verberg voltooide taken' : 'Toon voltooide taken'}
        </button>
      </div>

      {error && <div className="banner banner--error" role="alert">{error}<button className="banner-close" onClick={() => setError(null)}>✕</button></div>}

      <div className="tasktable">
        <div className={`trow trow--head ${entryId ? 'trow--scoped' : ''}`}>
          <div className="tcell tcell--check" />
          <div className="tcell tcell--title sortable" onClick={() => toggleSort('title')}>Taak{sortMark('title')}</div>
          {!entryId && <div className="tcell tcell--item">Item</div>}
          <div className="tcell tcell--owner sortable" onClick={() => toggleSort('owner')}>Eigenaar{sortMark('owner')}</div>
          <div className="tcell tcell--prio sortable" onClick={() => toggleSort('priority')}>Prioriteit{sortMark('priority')}</div>
          <div className="tcell tcell--deadline sortable" onClick={() => toggleSort('deadline')}>Deadline{sortMark('deadline')}</div>
          <div className="tcell tcell--act" />
        </div>

        {loading && <div className="empty">Laden…</div>}
        {!loading && visible.length === 0 && <div className="empty">Nog geen taken.</div>}

        {visible.map((t) => (
          <div key={t.id} className={`trow ${entryId ? 'trow--scoped' : ''} ${t.completed ? 'trow--done' : ''}`}>
            <div className="tcell tcell--check">
              <input type="checkbox" checked={t.completed} onChange={(e) => patch(t.id, { completed: e.target.checked })} aria-label="Voltooid" />
            </div>
            <div className="tcell tcell--title" data-label="Taak">
              <EditableCell value={t.title} placeholder="Nieuwe taak" ariaLabel="Taak" onSave={(v) => patch(t.id, { title: v })} />
            </div>
            {!entryId && (
              <div className="tcell tcell--item" data-label="Item">
                <select className="item-select" value={t.entry_id || ''} onChange={(e) => patch(t.id, { entry_id: e.target.value || null })}>
                  <option value="">—</option>
                  {itemOptions.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="tcell tcell--owner" data-label="Eigenaar">
              <OwnerCell ownerId={t.owner_id} profiles={profiles} onChange={(v) => patch(t.id, { owner_id: v })} />
            </div>
            <div className="tcell tcell--prio" data-label="Prioriteit">
              <select className={`prio-pill prio-pill--${t.priority}`} value={t.priority} onChange={(e) => patch(t.id, { priority: e.target.value })}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="tcell tcell--deadline" data-label="Deadline">
              <input type="date" className="date-input" value={t.deadline || ''} onChange={(e) => patch(t.id, { deadline: e.target.value || null })} />
            </div>
            <div className="tcell tcell--act">
              <button type="button" className="btn-icon" title="Taak verwijderen" onClick={() => remove(t.id)}><Icon name="trash" size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="btn-add-item tasks-add" onClick={add}>+ Taak toevoegen</button>
    </div>
  )
}

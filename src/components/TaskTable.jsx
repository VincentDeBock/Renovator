import { useEffect, useMemo, useRef, useState } from 'react'
import EditableCell from './EditableCell'
import Icon from './Icon'
import { getTasks, makeTask, insertTask, updateTask, deleteTask } from '../lib/tasks'

const PRIO_RANK = { high: 0, medium: 1, low: 2 }

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

// Custom item picker: the trigger shows section + item on two lines (no
// truncation of the meaningful item name), and the popover is wider than the
// cell so long "Section / Item" paths stay fully readable. Grouped by section,
// the way Linear/Asana surface long reference lists.
function ItemSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find((o) => o.id === value)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const groups = useMemo(() => {
    const m = new Map()
    for (const o of options) {
      if (!m.has(o.section)) m.set(o.section, [])
      m.get(o.section).push(o)
    }
    return [...m.entries()]
  }, [options])

  function pick(id) {
    onChange(id)
    setOpen(false)
  }

  return (
    <div className={`itempick ${open ? 'itempick--open' : ''}`} ref={ref}>
      <button type="button" className="itempick-trigger" onClick={() => setOpen((v) => !v)}>
        {selected ? (
          <span className="itempick-value">
            <span className="itempick-section">{selected.section}</span>
            <span className="itempick-item">{selected.item}</span>
          </span>
        ) : (
          <span className="itempick-placeholder">Koppel item</span>
        )}
        <Icon name="chevron" size={14} className="itempick-caret" />
      </button>

      {open && (
        <div className="itempick-pop" role="listbox">
          <button
            type="button"
            className={`itempick-opt itempick-opt--none ${!value ? 'is-selected' : ''}`}
            onClick={() => pick(null)}
          >
            Geen item
          </button>
          {groups.map(([section, opts]) => (
            <div key={section} className="itempick-group">
              <div className="itempick-group-label">{section}</div>
              {opts.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={`itempick-opt ${o.id === value ? 'is-selected' : ''}`}
                  onClick={() => pick(o.id)}
                >
                  {o.item}
                  {o.id === value && <Icon name="check" size={14} />}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
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

  const SortHead = ({ k, children, className }) => (
    <button
      type="button"
      className={`tcol-btn ${sort.key === k ? 'tcol-btn--active' : ''}`}
      onClick={() => toggleSort(k)}
    >
      {children}
      <span className="tcol-caret">{sort.key === k ? (sort.dir === 'asc' ? '↑' : '↓') : ''}</span>
    </button>
  )

  return (
    <div className="tasks">
      <div className="tasks-toolbar">
        <label className="toggle tasks-showdone">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
          />
          <span className="toggle-track" aria-hidden="true"><span className="toggle-thumb" /></span>
          <span className="toggle-text">Voltooide taken tonen</span>
        </label>
      </div>

      {error && <div className="banner banner--error" role="alert">{error}<button className="banner-close" onClick={() => setError(null)}>✕</button></div>}

      <div className="tasktable">
        <div className={`trow trow--head ${entryId ? 'trow--scoped' : ''}`}>
          <div className="tcell tcell--check" />
          <div className="tcell tcell--title"><SortHead k="title">Taak</SortHead></div>
          {!entryId && <div className="tcell tcell--item">Item</div>}
          <div className="tcell tcell--owner"><SortHead k="owner">Eigenaar</SortHead></div>
          <div className="tcell tcell--prio"><SortHead k="priority">Prioriteit</SortHead></div>
          <div className="tcell tcell--deadline"><SortHead k="deadline">Deadline</SortHead></div>
          <div className="tcell tcell--act" />
        </div>

        {loading && <div className="empty">Laden…</div>}
        {!loading && visible.length === 0 && <div className="empty">Nog geen taken.</div>}

        {visible.map((t) => (
          <div key={t.id} className={`trow ${entryId ? 'trow--scoped' : ''} ${t.completed ? 'trow--done' : ''}`}>
            <div className="tcell tcell--check">
              <label className="task-check">
                <input type="checkbox" checked={t.completed} onChange={(e) => patch(t.id, { completed: e.target.checked })} aria-label="Voltooid" />
                <span className="task-check-box" aria-hidden="true"><Icon name="check" size={13} strokeWidth={3} /></span>
              </label>
            </div>
            <div className="tcell tcell--title" data-label="Taak">
              <EditableCell value={t.title} placeholder="Nieuwe taak" ariaLabel="Taak" onSave={(v) => patch(t.id, { title: v })} />
            </div>
            {!entryId && (
              <div className="tcell tcell--item" data-label="Item">
                <ItemSelect value={t.entry_id || null} options={itemOptions} onChange={(v) => patch(t.id, { entry_id: v })} />
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
              <span className={`date-field ${t.deadline ? '' : 'date-field--empty'}`}>
                <Icon name="calendar" size={15} className="date-field-icon" />
                <input
                  type="date"
                  className="date-input"
                  value={t.deadline || ''}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  onChange={(e) => patch(t.id, { deadline: e.target.value || null })}
                />
              </span>
            </div>
            <div className="tcell tcell--act">
              <button type="button" className="btn-icon" title="Taak verwijderen" onClick={() => remove(t.id)}><Icon name="trash" size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="btn-add-item tasks-add" onClick={add}><Icon name="plus" size={15} /> Taak toevoegen</button>
    </div>
  )
}

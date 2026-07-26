import { useEffect, useMemo, useRef, useState } from 'react'
import EditableCell from './EditableCell'
import Icon from './Icon'
import { getTasks, makeTask, insertTask, updateTask, deleteTask } from '../lib/tasks'
import { useLang } from '../i18n'

const PRIO_RANK = { high: 0, medium: 1, low: 2 }

function OwnerCell({ ownerId, profiles, onChange, nobodyLabel }) {
  const p = profiles.find((x) => x.id === ownerId)
  return (
    <span className="owner">
      <span className="owner-avatar" title={p?.display_name || nobodyLabel}>{p?.initial || '?'}</span>
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
  const { t } = useLang()
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
          <span className="itempick-placeholder">{t('tasks.linkItem')}</span>
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
            {t('tasks.noItem')}
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
// NOTE: the translate function is named `tr` here because rows are mapped as
// `(t) => …` (task), which would shadow the usual `t`.
export default function TaskTable({ projectId, entryId = null, profiles, currentUserId, itemOptions = [] }) {
  const { t: tr } = useLang()
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
      setError(tr('op.saveFailed', { msg: e.message }))
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
      setError(tr('op.addTaskFailed', { msg: e.message }))
    }
  }

  async function remove(id) {
    const snap = tasks
    setTasks((rows) => rows.filter((t) => t.id !== id))
    try {
      await deleteTask(id)
    } catch (e) {
      setTasks(snap)
      setError(tr('op.deleteFailed', { msg: e.message }))
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
          <span className="toggle-text">{tr('tasks.showCompleted')}</span>
        </label>
      </div>

      {error && <div className="banner banner--error" role="alert">{error}<button className="banner-close" onClick={() => setError(null)}>✕</button></div>}

      <div className="tasktable">
        <div className={`trow trow--head ${entryId ? 'trow--scoped' : ''}`}>
          <div className="tcell tcell--check" />
          <div className="tcell tcell--title"><SortHead k="title">{tr('tasks.colTask')}</SortHead></div>
          {!entryId && <div className="tcell tcell--item">{tr('common.item')}</div>}
          <div className="tcell tcell--owner"><SortHead k="owner">{tr('tasks.colOwner')}</SortHead></div>
          <div className="tcell tcell--prio"><SortHead k="priority">{tr('tasks.colPriority')}</SortHead></div>
          <div className="tcell tcell--deadline"><SortHead k="deadline">{tr('tasks.colDeadline')}</SortHead></div>
          <div className="tcell tcell--act" />
        </div>

        {loading && <div className="empty">{tr('common.loading')}</div>}
        {!loading && visible.length === 0 && <div className="empty">{tr('tasks.empty')}</div>}

        {visible.map((t) => (
          <div key={t.id} className={`trow ${entryId ? 'trow--scoped' : ''} ${t.completed ? 'trow--done' : ''}`}>
            <div className="tcell tcell--check">
              <label className="task-check">
                <input type="checkbox" checked={t.completed} onChange={(e) => patch(t.id, { completed: e.target.checked })} aria-label={tr('tasks.completedAria')} />
                <span className="task-check-box" aria-hidden="true"><Icon name="check" size={13} strokeWidth={3} /></span>
              </label>
            </div>
            <div className="tcell tcell--title" data-label={tr('tasks.colTask')}>
              <EditableCell value={t.title} placeholder={tr('tasks.newTaskPlaceholder')} ariaLabel={tr('tasks.colTask')} onSave={(v) => patch(t.id, { title: v })} />
            </div>
            {!entryId && (
              <div className="tcell tcell--item" data-label={tr('common.item')}>
                <ItemSelect value={t.entry_id || null} options={itemOptions} onChange={(v) => patch(t.id, { entry_id: v })} />
              </div>
            )}
            <div className="tcell tcell--owner" data-label={tr('tasks.colOwner')}>
              <OwnerCell ownerId={t.owner_id} profiles={profiles} nobodyLabel={tr('tasks.nobody')} onChange={(v) => patch(t.id, { owner_id: v })} />
            </div>
            <div className="tcell tcell--prio" data-label={tr('tasks.colPriority')}>
              <select className={`prio-pill prio-pill--${t.priority}`} value={t.priority} onChange={(e) => patch(t.id, { priority: e.target.value })}>
                <option value="high">{tr('tasks.prioHigh')}</option>
                <option value="medium">{tr('tasks.prioMedium')}</option>
                <option value="low">{tr('tasks.prioLow')}</option>
              </select>
            </div>
            <div className="tcell tcell--deadline" data-label={tr('tasks.colDeadline')}>
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
              <button type="button" className="btn-icon" title={tr('tasks.deleteTask')} onClick={() => remove(t.id)}><Icon name="trash" size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="btn-add-item tasks-add" onClick={add}><Icon name="plus" size={15} /> {tr('tasks.addTask')}</button>
    </div>
  )
}

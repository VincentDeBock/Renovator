import { useEffect, useState } from 'react'
import Icon from './Icon'
import { formatEuro, parseAmount } from '../lib/format'
import { getTags, createTag, updateTag, deleteTag } from '../lib/tags'
import { useLang } from '../i18n'

const DEFAULT_TAG_COLOR = '#ff7a1a'

// `tr` (not `t`) because the tag rows are mapped as `(t) => …`.
function TagsManager({ projectId }) {
  const { t: tr } = useLang()
  const [tags, setTags] = useState([])
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_TAG_COLOR)
  const [error, setError] = useState(null)

  useEffect(() => {
    let c = false
    getTags(projectId).then((t) => !c && setTags(t)).catch((e) => !c && setError(e.message))
    return () => {
      c = true
    }
  }, [projectId])

  async function add(e) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    try {
      const t = await createTag({ projectId, name: n, color })
      setTags((rows) => [...rows, t].sort((a, b) => a.name.localeCompare(b.name)))
      setName('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function rename(id, newName) {
    setTags((rows) => rows.map((t) => (t.id === id ? { ...t, name: newName } : t)))
    try {
      await updateTag(id, { name: newName })
    } catch (err) {
      setError(err.message)
    }
  }
  async function recolor(id, newColor) {
    setTags((rows) => rows.map((t) => (t.id === id ? { ...t, color: newColor } : t)))
    try {
      await updateTag(id, { color: newColor })
    } catch (err) {
      setError(err.message)
    }
  }
  async function remove(id) {
    const snap = tags
    setTags((rows) => rows.filter((t) => t.id !== id))
    try {
      await deleteTag(id)
    } catch (err) {
      setTags(snap)
      setError(err.message)
    }
  }

  return (
    <div className="settings-card">
      <h2 className="panel-title">{tr('set.tagsTitle')}</h2>
      <p className="settings-hint">{tr('set.tagsHint')}</p>
      {error && <div className="banner banner--error">{error}<button className="banner-close" onClick={() => setError(null)}>✕</button></div>}

      <div className="taglist">
        {tags.map((t) => (
          <div key={t.id} className="tagrow">
            <input type="color" value={t.color || DEFAULT_TAG_COLOR} onChange={(e) => recolor(t.id, e.target.value)} aria-label={tr('common.color')} />
            <input className="tag-name" defaultValue={t.name} onBlur={(e) => e.target.value.trim() && e.target.value !== t.name && rename(t.id, e.target.value.trim())} />
            <button type="button" className="btn-icon" title={tr('set.deleteTag')} onClick={() => remove(t.id)}><Icon name="trash" size={16} /></button>
          </div>
        ))}
        {tags.length === 0 && <p className="file-sub">{tr('set.noTags')}</p>}
      </div>

      <form className="tag-add" onSubmit={add}>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label={tr('common.color')} />
        <input className="tag-name" placeholder={tr('set.newTagPlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit" className="btn-add-item">{tr('common.add')}</button>
      </form>
    </div>
  )
}

export default function Settings({ project, onSaveBudget }) {
  const { t } = useLang()
  const [value, setValue] = useState(String(project.budget ?? 0))
  const [status, setStatus] = useState('idle')

  async function onSubmit(e) {
    e.preventDefault()
    if (status === 'saving') return
    setStatus('saving')
    try {
      await onSaveBudget(parseAmount(value))
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="page settings">
      <header className="page-header">
        <h1>{t('set.title')}</h1>
        <p className="subtitle">{t('set.sub')}</p>
      </header>

      <form className="settings-card" onSubmit={onSubmit}>
        <h2 className="panel-title">{t('set.budgetTitle')}</h2>
        <label className="field">
          <span className="field-label">{t('set.budgetField')}</span>
          <input type="text" inputMode="decimal" value={value} onChange={(e) => { setValue(e.target.value); setStatus('idle') }} />
        </label>
        <p className="settings-hint">{t('set.budgetHint', { amount: formatEuro(project.budget) })}</p>
        <div className="settings-actions">
          <button type="submit" className="btn-add-section" disabled={status === 'saving'}>{status === 'saving' ? t('common.busy') : t('common.save')}</button>
          {status === 'saved' && <span className="settings-ok">{t('set.saved')}</span>}
          {status === 'error' && <span className="settings-err">{t('set.saveFailed')}</span>}
        </div>
      </form>

      <TagsManager projectId={project.id} />
    </div>
  )
}

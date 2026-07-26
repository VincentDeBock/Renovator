import { useEffect, useMemo, useState } from 'react'
import FileViewer from '../components/FileViewer'
import FileUpload from '../components/FileUpload'
import Icon from '../components/Icon'
import { fmtSize, fmtDate } from '../components/FileList'
import { listFiles, setFileTags, uploadFile, updateFile, archiveFile, unarchiveFile, computeHash, findDuplicate, triggerDocAi } from '../lib/files'
import { getTags } from '../lib/tags'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n'

const CATEGORY_KEY = { quote: 'cat.quote', invoice: 'cat.invoice', picture: 'cat.picture', plan: 'cat.plan', other: 'cat.other' }

// `tr` (not `t`) because tags are mapped as `(t) => …` below.
export default function Documenten({ project, entries }) {
  const { displayName } = useAuth()
  const { t: tr, locale } = useLang()
  const [files, setFiles] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterTag, setFilterTag] = useState('')
  const [sortKey, setSortKey] = useState('date') // date | name
  const [showArchived, setShowArchived] = useState(false)
  const [viewer, setViewer] = useState(null)
  const [dupPrompt, setDupPrompt] = useState(null) // { file, hash, dup }

  useEffect(() => {
    let c = false
    setLoading(true)
    Promise.all([listFiles({ projectId: project.id, includeArchived: showArchived }), getTags(project.id)])
      .then(([f, t]) => {
        if (c) return
        setFiles(f)
        setTags(t)
      })
      .catch((e) => !c && setError(e.message))
      .finally(() => !c && setLoading(false))
    return () => {
      c = true
    }
  }, [project.id, showArchived])

  const itemName = useMemo(() => {
    const m = new Map(entries.map((e) => [e.id, e.name?.trim() || (e.type === 'section' ? tr('common.section') : tr('common.item'))]))
    return (id) => (id ? m.get(id) || '—' : null)
  }, [entries, tr])

  // Sections with their items, for the per-row link picker.
  const sections = useMemo(() => {
    const secs = entries.filter((e) => e.type === 'section')
    return secs.map((s) => ({
      ...s,
      items: entries.filter((e) => e.type === 'item' && e.parent_id === s.id),
    }))
  }, [entries])

  const visible = useMemo(() => {
    let list = filterTag ? files.filter((f) => f.tag_ids?.includes(filterTag)) : files
    list = [...list].sort((a, b) =>
      sortKey === 'name'
        ? (a.ai_title || a.name || '').localeCompare(b.ai_title || b.name || '')
        : (b.uploaded_at || '').localeCompare(a.uploaded_at || ''),
    )
    return list
  }, [files, filterTag, sortKey])

  async function refreshTags() {
    try {
      setTags(await getTags(project.id))
    } catch {
      /* tag refresh is best-effort */
    }
  }

  // Upload one file: store it, then kick off the AI naming/tagging step.
  async function doUpload(file, hash) {
    try {
      const saved = await uploadFile(file, {
        projectId: project.id,
        category: 'other',
        uploadedBy: displayName,
        contentHash: hash,
      })
      setFiles((rows) => [saved, ...rows])
      // Fire the AI step; patch the row + pick up any new section tags when done.
      triggerDocAi(saved.id).then((updated) => {
        if (!updated) {
          setFiles((rows) => rows.map((f) => (f.id === saved.id ? { ...f, ai_status: 'error' } : f)))
          return
        }
        setFiles((rows) => rows.map((f) => (f.id === saved.id ? { ...f, ...updated } : f)))
        refreshTags()
      })
    } catch (e) {
      setError(tr('op.uploadFailed', { msg: e.message }))
    }
  }

  // Each picked file: hash it, warn on an exact duplicate, otherwise upload.
  async function onPick(file) {
    try {
      const hash = await computeHash(file)
      const dup = await findDuplicate(project.id, hash)
      if (dup) {
        setDupPrompt({ file, hash, dup })
        return
      }
      await doUpload(file, hash)
    } catch (e) {
      setError(tr('op.uploadFailed', { msg: e.message }))
    }
  }

  async function toggleTag(file, tagId) {
    const has = file.tag_ids?.includes(tagId)
    const next = has ? file.tag_ids.filter((t) => t !== tagId) : [...(file.tag_ids || []), tagId]
    const snap = files
    setFiles((rows) => rows.map((f) => (f.id === file.id ? { ...f, tag_ids: next } : f)))
    try {
      await setFileTags(file.id, next)
    } catch (e) {
      setFiles(snap)
      setError(tr('op.tagSaveFailed', { msg: e.message }))
    }
  }

  async function linkEntry(file, entryId) {
    const snap = files
    setFiles((rows) => rows.map((f) => (f.id === file.id ? { ...f, entry_id: entryId || null } : f)))
    try {
      await updateFile(file.id, { entry_id: entryId || null })
    } catch (e) {
      setFiles(snap)
      setError(tr('op.linkSaveFailed', { msg: e.message }))
    }
  }

  async function toggleArchive(file) {
    const snap = files
    // Remove from the current list optimistically (active list hides archived and vice versa).
    setFiles((rows) => rows.filter((f) => f.id !== file.id))
    try {
      if (file.archived_at) await unarchiveFile(file.id)
      else await archiveFile(file.id)
    } catch (e) {
      setFiles(snap)
      setError(tr('op.archiveFailed', { msg: e.message }))
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>{tr('docs.title')}</h1>
        <p className="subtitle">{tr('docs.sub')}</p>
      </header>

      <div className="panel">
        <FileUpload onUpload={onPick} accept="application/pdf,image/*" dropzone />

        <div className="docs-toolbar">
          <label>{tr('docs.filter')}
            <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
              <option value="">{tr('docs.allTags')}</option>
              {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label>{tr('docs.sort')}
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
              <option value="date">{tr('docs.newestFirst')}</option>
              <option value="name">{tr('docs.nameAZ')}</option>
            </select>
          </label>
          <button
            type="button"
            className={`btn-ghost docs-archive-toggle ${showArchived ? 'is-on' : ''}`}
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? tr('docs.showActive') : tr('docs.showArchive')}
          </button>
        </div>

        {error && <div className="banner banner--error">{error}<button className="banner-close" onClick={() => setError(null)}>✕</button></div>}
        {loading && <div className="empty">{tr('common.loading')}</div>}
        {!loading && visible.length === 0 && <div className="empty">{showArchived ? tr('docs.emptyArchived') : tr('docs.empty')}</div>}

        <div className="filelist">
          {visible.map((f) => {
            const title = f.ai_title || f.name
            const linked = itemName(f.entry_id)
            return (
              <div key={f.id} className="docrow">
                <button type="button" className="filerow-main" onClick={() => setViewer(f)}>
                  <span className="file-icon" aria-hidden="true"><Icon name="file" size={20} /></span>
                  <span className="file-meta">
                    <span className="file-name">{title}</span>
                    {f.ai_title && <span className="file-origname">{f.name}</span>}
                    <span className="file-sub">
                      {CATEGORY_KEY[f.category] ? tr(CATEGORY_KEY[f.category]) : f.category}
                      {linked ? ` · ${linked}` : ''} · {fmtSize(f.size_bytes)} · {fmtDate(f.uploaded_at, locale)}
                      {f.ai_status === 'pending' && <span className="ai-badge ai-badge--pending"> · {tr('docs.aiPending')}</span>}
                      {f.ai_status === 'error' && <span className="ai-badge ai-badge--error"> · {tr('docs.aiError')}</span>}
                    </span>
                  </span>
                </button>

                <div className="docrow-controls">
                  <label className="doc-link">
                    <span className="doc-link-label">{tr('docs.link')}</span>
                    <select value={f.entry_id || ''} onChange={(e) => linkEntry(f, e.target.value)}>
                      <option value="">{tr('docs.noItemOption')}</option>
                      {sections.map((s) => (
                        <optgroup key={s.id} label={s.name?.trim() || tr('common.section')}>
                          {s.items.map((it) => (
                            <option key={it.id} value={it.id}>{it.name?.trim() || tr('common.item')}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>

                  <span className="doc-tags">
                    {tags.map((t) => {
                      const on = f.tag_ids?.includes(t.id)
                      return (
                        <button
                          key={t.id}
                          type="button"
                          className={`tagchip ${on ? 'tagchip--on' : ''}`}
                          style={on && t.color ? { background: t.color, borderColor: t.color } : undefined}
                          onClick={() => toggleTag(f, t.id)}
                          title={on ? tr('docs.removeTag') : tr('docs.addTag')}
                        >
                          {t.name}
                        </button>
                      )
                    })}
                    {tags.length === 0 && <span className="file-sub">{tr('docs.makeTagsHint')}</span>}
                  </span>

                  <button
                    type="button"
                    className="btn-ghost doc-archive-btn"
                    onClick={() => toggleArchive(f)}
                    title={f.archived_at ? tr('docs.unarchiveTitle') : tr('docs.archiveTitle')}
                  >
                    {f.archived_at ? tr('docs.unarchive') : tr('docs.archive')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {dupPrompt && (
        <div className="modal-overlay" onClick={() => setDupPrompt(null)}>
          <div className="modal confirm" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-title">{tr('docs.dupTitle')}</h3>
            <p className="confirm-message">
              {tr('docs.dupPre')} <strong>{dupPrompt.dup.ai_title || dupPrompt.dup.name}</strong>{' '}
              {tr('docs.dupPost', { date: fmtDate(dupPrompt.dup.uploaded_at, locale) })}
            </p>
            <div className="confirm-actions">
              <button type="button" className="btn-ghost" onClick={() => setDupPrompt(null)}>{tr('common.cancel')}</button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const { file, hash } = dupPrompt
                  setDupPrompt(null)
                  doUpload(file, hash)
                }}
              >
                {tr('docs.dupConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <FileViewer file={viewer} onClose={() => setViewer(null)} />
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import FileViewer from '../components/FileViewer'
import FileUpload from '../components/FileUpload'
import Icon from '../components/Icon'
import { fmtSize, fmtDate } from '../components/FileList'
import { listFiles, setFileTags, uploadFile, updateFile, archiveFile, unarchiveFile, computeHash, findDuplicate, triggerDocAi } from '../lib/files'
import { getTags } from '../lib/tags'
import { useAuth } from '../context/AuthContext'

const CATEGORY_LABEL = { quote: 'Offerte', invoice: 'Factuur', picture: 'Foto', plan: 'Plan', other: 'Overig' }

export default function Documenten({ project, entries }) {
  const { displayName } = useAuth()
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
    const m = new Map(entries.map((e) => [e.id, e.name?.trim() || (e.type === 'section' ? 'Sectie' : 'Item')]))
    return (id) => (id ? m.get(id) || '—' : null)
  }, [entries])

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
      setError(`Upload mislukt: ${e.message}`)
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
      setError(`Upload mislukt: ${e.message}`)
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
      setError(`Tag opslaan mislukt: ${e.message}`)
    }
  }

  async function linkEntry(file, entryId) {
    const snap = files
    setFiles((rows) => rows.map((f) => (f.id === file.id ? { ...f, entry_id: entryId || null } : f)))
    try {
      await updateFile(file.id, { entry_id: entryId || null })
    } catch (e) {
      setFiles(snap)
      setError(`Koppeling opslaan mislukt: ${e.message}`)
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
      setError(`Archiveren mislukt: ${e.message}`)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Documenten</h1>
        <p className="subtitle">Alle bestanden, filterbaar op tag</p>
      </header>

      <div className="panel">
        <FileUpload onUpload={onPick} accept="application/pdf,image/*" dropzone />

        <div className="docs-toolbar">
          <label>Filter:
            <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
              <option value="">Alle tags</option>
              {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label>Sorteer:
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
              <option value="date">Nieuwste eerst</option>
              <option value="name">Naam (A–Z)</option>
            </select>
          </label>
          <button
            type="button"
            className={`btn-ghost docs-archive-toggle ${showArchived ? 'is-on' : ''}`}
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? 'Toon actieve' : 'Toon archief'}
          </button>
        </div>

        {error && <div className="banner banner--error">{error}<button className="banner-close" onClick={() => setError(null)}>✕</button></div>}
        {loading && <div className="empty">Laden…</div>}
        {!loading && visible.length === 0 && <div className="empty">{showArchived ? 'Geen gearchiveerde documenten.' : 'Geen documenten.'}</div>}

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
                      {CATEGORY_LABEL[f.category] || f.category}
                      {linked ? ` · ${linked}` : ''} · {fmtSize(f.size_bytes)} · {fmtDate(f.uploaded_at)}
                      {f.ai_status === 'pending' && <span className="ai-badge ai-badge--pending"> · AI verwerkt…</span>}
                      {f.ai_status === 'error' && <span className="ai-badge ai-badge--error"> · AI mislukt</span>}
                    </span>
                  </span>
                </button>

                <div className="docrow-controls">
                  <label className="doc-link">
                    <span className="doc-link-label">Koppel:</span>
                    <select value={f.entry_id || ''} onChange={(e) => linkEntry(f, e.target.value)}>
                      <option value="">— Geen item —</option>
                      {sections.map((s) => (
                        <optgroup key={s.id} label={s.name?.trim() || 'Sectie'}>
                          {s.items.map((it) => (
                            <option key={it.id} value={it.id}>{it.name?.trim() || 'Item'}</option>
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
                          title={on ? 'Tag verwijderen' : 'Tag toevoegen'}
                        >
                          {t.name}
                        </button>
                      )
                    })}
                    {tags.length === 0 && <span className="file-sub">Maak tags aan onder Instellingen</span>}
                  </span>

                  <button
                    type="button"
                    className="btn-ghost doc-archive-btn"
                    onClick={() => toggleArchive(f)}
                    title={f.archived_at ? 'Terug naar actief' : 'Archiveer document'}
                  >
                    {f.archived_at ? 'De-archiveer' : 'Archiveer'}
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
            <h3 className="confirm-title">Mogelijk duplicaat</h3>
            <p className="confirm-message">
              Dit lijkt op <strong>{dupPrompt.dup.ai_title || dupPrompt.dup.name}</strong> dat je op{' '}
              {fmtDate(dupPrompt.dup.uploaded_at)} uploadde. Toch opladen? Je kan een document later eenvoudig archiveren.
            </p>
            <div className="confirm-actions">
              <button type="button" className="btn-ghost" onClick={() => setDupPrompt(null)}>Annuleren</button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const { file, hash } = dupPrompt
                  setDupPrompt(null)
                  doUpload(file, hash)
                }}
              >
                Toch opladen
              </button>
            </div>
          </div>
        </div>
      )}

      <FileViewer file={viewer} onClose={() => setViewer(null)} />
    </div>
  )
}

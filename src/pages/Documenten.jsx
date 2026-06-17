import { useEffect, useMemo, useState } from 'react'
import FileViewer from '../components/FileViewer'
import Icon from '../components/Icon'
import { fmtSize, fmtDate } from '../components/FileList'
import { listFiles, setFileTags } from '../lib/files'
import { getTags } from '../lib/tags'

const CATEGORY_LABEL = { quote: 'Offerte', invoice: 'Factuur', picture: 'Foto', plan: 'Plan', other: 'Overig' }

export default function Documenten({ project, entries }) {
  const [files, setFiles] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterTag, setFilterTag] = useState('')
  const [sortKey, setSortKey] = useState('date') // date | name
  const [viewer, setViewer] = useState(null)

  useEffect(() => {
    let c = false
    Promise.all([listFiles({ projectId: project.id }), getTags(project.id)])
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
  }, [project.id])

  const itemName = useMemo(() => {
    const m = new Map(entries.map((e) => [e.id, e.name?.trim() || (e.type === 'section' ? 'Sectie' : 'Item')]))
    return (id) => m.get(id) || '—'
  }, [entries])

  const tagById = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags])

  const visible = useMemo(() => {
    let list = filterTag ? files.filter((f) => f.tag_ids?.includes(filterTag)) : files
    list = [...list].sort((a, b) =>
      sortKey === 'name' ? (a.name || '').localeCompare(b.name || '') : (b.uploaded_at || '').localeCompare(a.uploaded_at || ''),
    )
    return list
  }, [files, filterTag, sortKey])

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

  return (
    <div className="page">
      <header className="page-header">
        <h1>Documenten</h1>
        <p className="subtitle">Alle bestanden, filterbaar op tag</p>
      </header>

      <div className="panel">
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
        </div>

        {error && <div className="banner banner--error">{error}<button className="banner-close" onClick={() => setError(null)}>✕</button></div>}
        {loading && <div className="empty">Laden…</div>}
        {!loading && visible.length === 0 && <div className="empty">Geen documenten.</div>}

        <div className="filelist">
          {visible.map((f) => (
            <div key={f.id} className="docrow">
              <button type="button" className="filerow-main" onClick={() => setViewer(f)}>
                <span className="file-icon" aria-hidden="true"><Icon name="file" size={20} /></span>
                <span className="file-meta">
                  <span className="file-name">{f.name}</span>
                  <span className="file-sub">{CATEGORY_LABEL[f.category] || f.category} · {itemName(f.entry_id)} · {fmtSize(f.size_bytes)} · {fmtDate(f.uploaded_at)}</span>
                </span>
              </button>
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
            </div>
          ))}
        </div>
      </div>

      <FileViewer file={viewer} onClose={() => setViewer(null)} />
    </div>
  )
}

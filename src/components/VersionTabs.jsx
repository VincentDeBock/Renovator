import { useState } from 'react'
import { useLang } from '../i18n'

// Colored tabs for project versions. Click to switch, double-click to rename,
// "+" duplicates the active version, "×" on the active tab deletes it.
export default function VersionTabs({ versions, activeId, onSelect, onAdd, onRename, onDelete }) {
  const { t } = useLang()
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState('')

  function startRename(v) {
    setEditingId(v.id)
    setDraft(v.name)
  }
  function commitRename() {
    if (editingId) onRename(editingId, draft.trim() || t('ver.fallbackName'))
    setEditingId(null)
  }

  return (
    <div className="vtabs" role="tablist" aria-label={t('ver.tabsLabel')}>
      <span className="vtabs-label">{t('ver.tabsLabel')}</span>
      <div className="vtabs-row">
        {versions.map((v) => {
          const active = v.id === activeId
          const color = v.color || '#94a3b8'
          return (
            <div
              key={v.id}
              role="tab"
              aria-selected={active}
              tabIndex={0}
              className={`vtab ${active ? 'vtab--active' : ''}`}
              style={{ '--vcolor': color }}
              onClick={() => onSelect(v.id)}
              onDoubleClick={() => startRename(v)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(v.id)
                }
              }}
            >
              {editingId === v.id ? (
                <input
                  className="vtab-input"
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commitRename}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      commitRename()
                    } else if (e.key === 'Escape') {
                      setEditingId(null)
                    }
                  }}
                />
              ) : (
                <span className="vtab-name">{v.name}</span>
              )}

              {active && editingId !== v.id && versions.length > 1 && (
                <button
                  type="button"
                  className="vtab-del"
                  title={t('ver.deleteTitle')}
                  aria-label={t('ver.deleteAria', { name: v.name })}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm(t('ver.deleteConfirm', { name: v.name }))) onDelete(v.id)
                  }}
                >
                  ×
                </button>
              )}
            </div>
          )
        })}

        <button
          type="button"
          className="vtab vtab--add"
          title={t('ver.addTitle')}
          aria-label={t('ver.addAria')}
          onClick={onAdd}
        >
          +
        </button>
      </div>
    </div>
  )
}

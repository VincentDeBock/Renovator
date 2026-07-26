import { useEffect, useRef, useState } from 'react'
import FileSection from './FileSection'
import { loadPinterestWidget, buildPins, parseBoardUrl } from '../lib/pinterest'
import { useLang } from '../i18n'

// Renders the embedded Pinterest board. The embedBoard anchor is written into a
// ref'd container via innerHTML (NOT JSX) so that Pinterest's script can replace it
// with the rendered grid without React reconciling/wiping that DOM on re-render.
// The anchor's own text doubles as the fallback link for private/invalid boards.
function BoardEmbed({ href }) {
  const { t } = useLang()
  const ref = useRef(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const el = ref.current
    if (el) {
      const safe = href.replace(/"/g, '&quot;')
      el.innerHTML =
        `<a data-pin-do="embedBoard" data-pin-board-width="640" data-pin-scale-height="340" ` +
        `data-pin-scale-width="92" href="${safe}">${t('pin.boardAnchor')}</a>`
    }
    loadPinterestWidget().then((ok) => {
      if (cancelled) return
      if (!ok) setFailed(true)
      else buildPins()
    })
    return () => {
      cancelled = true
    }
  }, [href])

  return (
    <>
      <div className="pinboard-embed" ref={ref} />
      {failed && (
        <p className="pinboard-hint">{t('pin.loadFailed')}</p>
      )}
    </>
  )
}

// Item-level inspiration: a linked Pinterest board (embedded) with a photo-upload
// fallback when no board is set. `onSave(url|null)` persists entries.pinterest_url.
export default function InspirationBoard({ entry, onSave, projectId, entryId, uploadedBy }) {
  const { t } = useLang()
  const url = entry.pinterest_url || ''
  const parsed = url ? parseBoardUrl(url) : null
  const validHref = parsed?.ok ? parsed.href : null

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(url)
  const [err, setErr] = useState(null)

  function submit(e) {
    e.preventDefault()
    const v = draft.trim()
    if (!v) {
      onSave(null)
      setErr(null)
      setEditing(false)
      return
    }
    const p = parseBoardUrl(v)
    if (!p.ok) {
      setErr(p.reason)
      return
    }
    onSave(p.href)
    setErr(null)
    setEditing(false)
  }

  function remove() {
    onSave(null)
    setDraft('')
    setErr(null)
    setEditing(false)
  }

  // Linked + valid board → show the embed (with edit/remove + an explicit open link).
  if (validHref && !editing) {
    return (
      <section className="panel pinboard">
        <div className="panel-head">
          <h2 className="panel-title">{t('pin.sectionTitle')}</h2>
          <div className="pinboard-actions">
            <a className="cw-link" href={validHref} target="_blank" rel="noreferrer">{t('pin.openOnPinterest')}</a>
            <button type="button" className="btn-ghost pinboard-btn" onClick={() => { setDraft(url); setEditing(true) }}>{t('common.edit')}</button>
            <button type="button" className="btn-ghost pinboard-btn" onClick={remove}>{t('common.delete')}</button>
          </div>
        </div>
        {/* key on href: remount a fresh anchor per board so the widget rebuilds cleanly. */}
        <BoardEmbed key={validHref} href={validHref} />
      </section>
    )
  }

  // No (valid) board, or editing → link form + the photo-upload fallback.
  return (
    <>
      <section className="panel pinboard">
        <div className="panel-head"><h2 className="panel-title">{t('pin.boardTitle')}</h2></div>
        <form className="pinboard-form" onSubmit={submit}>
          <div className="pinboard-input-row">
            <input
              className="pinboard-input"
              type="url"
              inputMode="url"
              placeholder="https://www.pinterest.com/gebruiker/keuken/"
              aria-label={t('pin.urlAria')}
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setErr(null) }}
            />
            <button type="submit" className="btn-primary">{t('pin.linkBtn')}</button>
            {editing && (
              <button type="button" className="btn-ghost" onClick={() => { setEditing(false); setDraft(url); setErr(null) }}>{t('common.cancel')}</button>
            )}
          </div>
          <p className="pinboard-hint">{t('pin.hint1')} <strong>{t('pin.hintStrong')}</strong> {t('pin.hint2')}</p>
          {err && <p className="pinboard-err">{t(err)}</p>}
          {url && !validHref && !err && (
            <p className="pinboard-err">{t('pin.invalidSaved', { reason: t(parsed?.reason) })}</p>
          )}
        </form>
      </section>

      <FileSection
        projectId={projectId}
        entryId={entryId}
        category="picture"
        mode="gallery"
        title={t('item.photos')}
        accept="image/*,video/mp4,application/pdf"
        uploadedBy={uploadedBy}
      />
    </>
  )
}

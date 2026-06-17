import { useEffect, useState } from 'react'
import { signedUrl } from '../lib/files'

// Modal preview via a short-lived signed URL. Images and video render natively;
// PDFs render inline in an iframe (browser-native viewer) — no download needed.
export default function FileViewer({ file, onClose }) {
  const [url, setUrl] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!file) return
    let cancelled = false
    setUrl(null)
    setError(null)
    signedUrl(file.storage_path)
      .then((u) => !cancelled && setUrl(u))
      .catch((e) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [file])

  if (!file) return null
  const mime = file.mime_type || ''

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal viewer" role="dialog" aria-modal="true" aria-label={file.name} onClick={(e) => e.stopPropagation()}>
        <div className="viewer-head">
          <span className="viewer-name">{file.name}</span>
          <div className="viewer-actions">
            {url && <a className="btn-ghost" href={url} target="_blank" rel="noreferrer" download={file.name}>Download</a>}
            <button type="button" className="btn-ghost" onClick={onClose}>Sluiten</button>
          </div>
        </div>
        <div className="viewer-body">
          {error && <div className="banner banner--error">{error}</div>}
          {!url && !error && <div className="empty">Laden…</div>}
          {url && mime.startsWith('image/') && <img className="viewer-img" src={url} alt={file.name} />}
          {url && mime.startsWith('video/') && <video className="viewer-video" src={url} controls />}
          {url && mime === 'application/pdf' && <iframe className="viewer-frame" src={url} title={file.name} />}
          {url && !mime.startsWith('image/') && !mime.startsWith('video/') && mime !== 'application/pdf' && (
            <p>Geen voorbeeld beschikbaar. <a href={url} target="_blank" rel="noreferrer">Openen</a></p>
          )}
        </div>
      </div>
    </div>
  )
}

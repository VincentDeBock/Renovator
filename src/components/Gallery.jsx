import { useEffect, useState } from 'react'
import { signedUrl } from '../lib/files'

function Thumb({ file, onView }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let c = false
    signedUrl(file.storage_path).then((u) => !c && setUrl(u)).catch(() => {})
    return () => {
      c = true
    }
  }, [file])

  const isVideo = (file.mime_type || '').startsWith('video/')
  return (
    <button type="button" className="thumb" onClick={() => onView(file)} title={file.name}>
      {!url ? (
        <span className="thumb-loading" />
      ) : isVideo ? (
        <video className="thumb-media" src={url} muted />
      ) : (
        <img className="thumb-media" src={url} alt={file.name} loading="lazy" />
      )}
    </button>
  )
}

// Photo/video grid for the Inspiratie section.
export default function Gallery({ files, onView }) {
  if (files.length === 0) return null
  return (
    <div className="gallery">
      {files.map((f) => (
        <Thumb key={f.id} file={f} onView={onView} />
      ))}
    </div>
  )
}

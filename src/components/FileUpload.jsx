import { useRef, useState } from 'react'
import Icon from './Icon'

const MAX_BYTES = 50 * 1024 * 1024 // 50MB

// Drag-and-drop + browse uploader. Calls onUpload(file) for each accepted file.
export default function FileUpload({ onUpload, accept, label = '+ Bestand toevoegen', dropzone = false }) {
  const inputRef = useRef(null)
  const [over, setOver] = useState(false)
  const [error, setError] = useState(null)

  function handleFiles(fileList) {
    setError(null)
    for (const file of fileList) {
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is groter dan 50MB en wordt overgeslagen.`)
        continue
      }
      onUpload(file)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="upload">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      {dropzone ? (
        <div
          className={`dropzone ${over ? 'dropzone--over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <div className="dropzone-icon" aria-hidden="true"><Icon name="upload" size={28} /></div>
          <div className="dropzone-text">Sleep &amp; drop bestanden hier</div>
          <button type="button" className="btn-primary dropzone-btn" onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}>
            Bestanden kiezen
          </button>
          <div className="dropzone-hint">Ondersteunt PDF, PNG, JPG, MP4 tot 50MB</div>
        </div>
      ) : (
        <button type="button" className="btn-add-item" onClick={() => inputRef.current?.click()}>{label}</button>
      )}
      {error && <div className="upload-error">{error}</div>}
    </div>
  )
}

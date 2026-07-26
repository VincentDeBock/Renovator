import { useRef, useState } from 'react'
import Icon from './Icon'
import { useLang } from '../i18n'

const MAX_BYTES = 50 * 1024 * 1024 // 50MB

// Drag-and-drop + browse uploader. Calls onUpload(file) for each accepted file.
export default function FileUpload({ onUpload, accept, label, dropzone = false }) {
  const { t } = useLang()
  const inputRef = useRef(null)
  const [over, setOver] = useState(false)
  const [error, setError] = useState(null)
  label = label ?? t('file.addFile')

  function handleFiles(fileList) {
    setError(null)
    for (const file of fileList) {
      if (file.size > MAX_BYTES) {
        setError(t('file.tooBig', { name: file.name }))
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
          <div className="dropzone-text">{t('file.dropHere')}</div>
          <button type="button" className="btn-primary dropzone-btn" onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}>
            {t('file.choose')}
          </button>
          <div className="dropzone-hint">{t('file.dropHint')}</div>
        </div>
      ) : (
        <button type="button" className="btn-add-item" onClick={() => inputRef.current?.click()}>{label}</button>
      )}
      {error && <div className="upload-error">{error}</div>}
    </div>
  )
}

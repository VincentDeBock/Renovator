import { useEffect, useState } from 'react'
import FileList from './FileList'
import Gallery from './Gallery'
import FileUpload from './FileUpload'
import FileViewer from './FileViewer'
import ConfirmDialog from './ConfirmDialog'
import { listFiles, uploadFile, updateFile, deleteFile } from '../lib/files'
import { useLang } from '../i18n'

// One category's files (quote/invoice/picture). Self-contained: load, upload,
// edit (amount/status), view, delete-with-confirm.
export default function FileSection({ projectId, entryId, category, mode = 'list', title, accept, uploadedBy }) {
  const { t } = useLang()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewer, setViewer] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let c = false
    listFiles({ entryId, category })
      .then((rows) => !c && setFiles(rows))
      .catch((e) => !c && setError(e.message))
      .finally(() => !c && setLoading(false))
    return () => {
      c = true
    }
  }, [entryId, category])

  async function onUpload(file) {
    try {
      const saved = await uploadFile(file, { projectId, entryId, category, uploadedBy })
      setFiles((rows) => [saved, ...rows])
    } catch (e) {
      setError(t('op.uploadFailed', { msg: e.message }))
    }
  }

  async function onUpdate(id, patch) {
    const snap = files
    setFiles((rows) => rows.map((f) => (f.id === id ? { ...f, ...patch } : f)))
    try {
      await updateFile(id, patch)
    } catch (e) {
      setFiles(snap)
      setError(t('op.saveFailed', { msg: e.message }))
    }
  }

  async function confirmDelete() {
    const file = pendingDelete
    setPendingDelete(null)
    const snap = files
    setFiles((rows) => rows.filter((f) => f.id !== file.id))
    try {
      await deleteFile(file)
    } catch (e) {
      setFiles(snap)
      setError(t('op.deleteFailed', { msg: e.message }))
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">{title}</h2>
        {mode === 'gallery' && (
          <FileUpload onUpload={onUpload} accept={accept} label={t('file.addPhoto')} />
        )}
      </div>

      {error && <div className="banner banner--error">{error}<button className="banner-close" onClick={() => setError(null)}>✕</button></div>}
      {loading && <div className="empty">{t('common.loading')}</div>}

      {mode === 'list' ? (
        <>
          <FileList files={files} onView={setViewer} onUpdate={onUpdate} onRequestDelete={setPendingDelete} />
          <FileUpload onUpload={onUpload} accept={accept} label={t('file.addFile')} />
        </>
      ) : (
        <>
          <FileUpload onUpload={onUpload} accept={accept} dropzone />
          <Gallery files={files} onView={setViewer} />
        </>
      )}

      <FileViewer file={viewer} onClose={() => setViewer(null)} />
      <ConfirmDialog
        open={!!pendingDelete}
        title={t('file.deleteTitle')}
        message={t('file.deleteMsg', { name: pendingDelete?.name })}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </section>
  )
}

// Small confirmation modal. Render when `open` is true; calls onConfirm/onCancel.
export default function ConfirmDialog({
  open,
  title = 'Bevestigen',
  message,
  confirmLabel = 'Verwijderen',
  cancelLabel = 'Annuleren',
  onConfirm,
  onCancel,
}) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal confirm"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="confirm-title">{title}</h2>
        {message && <p className="confirm-message">{message}</p>}
        <div className="confirm-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

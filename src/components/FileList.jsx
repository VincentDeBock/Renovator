import EditableCell from './EditableCell'
import { formatEuro } from '../lib/format'

function fmtSize(b) {
  if (!b && b !== 0) return ''
  if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`
  if (b >= 1024) return `${Math.round(b / 1024)} KB`
  return `${b} B`
}
function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Offerte/Factuur document rows: name, amount (editable), date, status, view, delete.
export default function FileList({ files, onView, onUpdate, onRequestDelete }) {
  if (files.length === 0) return null
  return (
    <div className="filelist">
      {files.map((f) => (
        <div key={f.id} className="filerow">
          <button type="button" className="filerow-main" onClick={() => onView(f)} title="Bekijken">
            <span className="file-icon" aria-hidden="true">📄</span>
            <span className="file-meta">
              <span className="file-name">{f.name}</span>
              <span className="file-sub">{(f.mime_type || '').split('/').pop()?.toUpperCase()} · {fmtSize(f.size_bytes)}</span>
            </span>
          </button>

          <span className="file-amount" data-label="Bedrag">
            <EditableCell kind="amount" value={f.amount ?? 0} ariaLabel="Bedrag" onSave={(v) => onUpdate(f.id, { amount: v })} />
          </span>

          <span className="file-date" data-label="Gewijzigd">{fmtDate(f.uploaded_at)}</span>

          <select
            className={`status-pill status-pill--${f.status || 'none'}`}
            value={f.status || ''}
            onChange={(e) => onUpdate(f.id, { status: e.target.value || null })}
            aria-label="Status"
          >
            <option value="">— Status —</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
          </select>

          <span className="file-actions">
            <button type="button" className="btn-icon" title="Bekijken" onClick={() => onView(f)}>👁</button>
            <button type="button" className="btn-icon" title="Verwijderen" onClick={() => onRequestDelete(f)}>🗑</button>
          </span>
        </div>
      ))}
    </div>
  )
}

export { fmtSize, fmtDate }

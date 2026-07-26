import EditableCell from './EditableCell'
import Icon from './Icon'
import { useLang } from '../i18n'

function fmtSize(b) {
  if (!b && b !== 0) return ''
  if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`
  if (b >= 1024) return `${Math.round(b / 1024)} KB`
  return `${b} B`
}
function fmtDate(d, locale = 'nl-BE') {
  if (!d) return ''
  return new Date(d).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
}

// Offerte/Factuur document rows: name, amount (editable), date, status, view, delete.
export default function FileList({ files, onView, onUpdate, onRequestDelete }) {
  const { t, locale } = useLang()
  if (files.length === 0) return null
  return (
    <div className="filelist">
      {files.map((f) => (
        <div key={f.id} className="filerow">
          <button type="button" className="filerow-main" onClick={() => onView(f)} title={t('common.view')}>
            <span className="file-icon" aria-hidden="true"><Icon name="file" size={20} /></span>
            <span className="file-meta">
              <span className="file-name">{f.name}</span>
              <span className="file-sub">{(f.mime_type || '').split('/').pop()?.toUpperCase()} · {fmtSize(f.size_bytes)}</span>
            </span>
          </button>

          <span className="file-amount" data-label={t('file.amount')}>
            <EditableCell kind="amount" value={f.amount ?? 0} ariaLabel={t('file.amount')} onSave={(v) => onUpdate(f.id, { amount: v })} />
          </span>

          <span className="file-date" data-label={t('file.modified')}>{fmtDate(f.uploaded_at, locale)}</span>

          <select
            className={`status-pill status-pill--${f.status || 'none'}`}
            value={f.status || ''}
            onChange={(e) => onUpdate(f.id, { status: e.target.value || null })}
            aria-label={t('common.status')}
          >
            <option value="">{t('file.statusNone')}</option>
            <option value="accepted">{t('file.statusAccepted')}</option>
            <option value="declined">{t('file.statusDeclined')}</option>
          </select>

          <span className="file-actions">
            <button type="button" className="btn-icon" title={t('common.view')} onClick={() => onView(f)}><Icon name="eye" size={16} /></button>
            <button type="button" className="btn-icon" title={t('common.delete')} onClick={() => onRequestDelete(f)}><Icon name="trash" size={16} /></button>
          </span>
        </div>
      ))}
    </div>
  )
}

export { fmtSize, fmtDate }

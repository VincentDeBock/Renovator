import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import EditableCell from '../components/EditableCell'
import Icon from '../components/Icon'
import TaskTable from '../components/TaskTable'
import FileSection from '../components/FileSection'
import InspirationBoard from '../components/InspirationBoard'
import { formatEuro } from '../lib/format'
import { useLang } from '../i18n'

function DescriptionEditor({ value, onSave, placeholder }) {
  const [draft, setDraft] = useState(value || '')
  return (
    <textarea
      className="description"
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== (value || '') && onSave(draft)}
      rows={3}
    />
  )
}

export default function ItemDetail({ project, entries, patchEntry, profiles, currentUserId }) {
  const { t } = useLang()
  const { id } = useParams()
  const entry = entries.find((e) => e.id === id)

  if (!entry) {
    return (
      <div className="page">
        <Link to="/" className="back-link">← {t('item.backToOverview')}</Link>
        <div className="empty">{t('item.notFound')}</div>
      </div>
    )
  }

  const offerte = Number(entry.offertes) || 0
  const factuur = Number(entry.facturen) || 0
  const diff = factuur - offerte // > 0 means invoice exceeds quote (overspend → red)
  const me = profiles.find((p) => p.id === currentUserId)

  return (
    <div className="page detail">
      <div className="panel">
        <div className="detail-head">
          <Link to="/" className="back-link" aria-label={t('item.backToOverview')}><Icon name="back" size={20} /></Link>
          <EditableCell value={entry.name} placeholder={t('item.namePlaceholder')} ariaLabel={t('item.namePlaceholder')} onSave={(name) => patchEntry(entry.id, { name })} />
          <span className="detail-edit-hint" aria-hidden="true"><Icon name="pencil" size={15} /></span>
        </div>

        <div className="cards cards--2 detail-tiles">
          <div className="card">
            <span className="card-label">{t('cards.quotes')}</span>
            <span className="card-value">{formatEuro(offerte)}</span>
          </div>
          <div className="card">
            <span className="card-label">{t('cards.invoices')}</span>
            <span className="card-value">{formatEuro(factuur)}</span>
            <span className={`card-delta ${diff > 0 ? 'card-delta--over' : 'card-delta--under'}`}>
              {t('item.vsQuote', { amount: formatEuro(diff) })}
            </span>
          </div>
        </div>
      </div>

      <section className="panel">
        <h2 className="panel-title">{t('item.notes')}</h2>
        <DescriptionEditor value={entry.description} placeholder={t('item.descriptionPlaceholder')} onSave={(d) => patchEntry(entry.id, { description: d })} />
      </section>

      <section className="panel">
        <h2 className="panel-title">{t('item.todo')}</h2>
        <TaskTable projectId={project.id} entryId={entry.id} profiles={profiles} currentUserId={currentUserId} />
      </section>

      <FileSection projectId={project.id} entryId={entry.id} category="quote" mode="list" title={t('cards.quotes')} accept="application/pdf,image/*" uploadedBy={me?.display_name} />
      <FileSection projectId={project.id} entryId={entry.id} category="invoice" mode="list" title={t('cards.invoices')} accept="application/pdf,image/*" uploadedBy={me?.display_name} />
      <InspirationBoard
        entry={entry}
        onSave={(url) => patchEntry(entry.id, { pinterest_url: url })}
        projectId={project.id}
        entryId={entry.id}
        uploadedBy={me?.display_name}
      />
    </div>
  )
}

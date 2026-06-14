import { useMemo, useState } from 'react'
import SummaryCards from './SummaryCards'
import SectionGroup from './EntryRow'
import { buildTree, projectTotals, AMOUNT_FIELDS } from '../lib/totals'
import { formatEuro } from '../lib/format'
import {
  makeEntry,
  insertEntry,
  updateEntry,
  deleteEntry,
} from '../lib/entries'

const COLUMN_LABELS = {
  raming: 'Raming',
  budget: 'Budget',
  offertes: 'Offertes',
  facturen: 'Facturen',
}

export default function Overzicht({ project, initialEntries }) {
  const [entries, setEntries] = useState(initialEntries)
  const [error, setError] = useState(null)

  const sections = useMemo(() => buildTree(entries), [entries])
  const totals = useMemo(() => projectTotals(sections), [sections])

  // --- Optimistic helpers ----------------------------------------------------
  // Apply the change locally at once, then reconcile with Supabase. On failure,
  // roll back to the snapshot taken before the change and surface the error.

  async function patchEntry(id, patch) {
    const snapshot = entries
    setEntries((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    try {
      const saved = await updateEntry(id, patch)
      setEntries((rows) => rows.map((r) => (r.id === id ? { ...r, ...saved } : r)))
    } catch (e) {
      setEntries(snapshot)
      setError(`Opslaan mislukt: ${e.message}`)
    }
  }

  function nextPosition(predicate) {
    const siblings = entries.filter(predicate)
    if (siblings.length === 0) return 0
    return Math.max(...siblings.map((s) => s.position ?? 0)) + 1
  }

  async function addSection() {
    const row = makeEntry({
      projectId: project.id,
      type: 'section',
      position: nextPosition((e) => e.type === 'section'),
      name: '',
    })
    const snapshot = entries
    setEntries((rows) => [...rows, row])
    try {
      const saved = await insertEntry(row)
      setEntries((rows) => rows.map((r) => (r.id === row.id ? saved : r)))
    } catch (e) {
      setEntries(snapshot)
      setError(`Sectie toevoegen mislukt: ${e.message}`)
    }
  }

  async function addItem(sectionId) {
    const row = makeEntry({
      projectId: project.id,
      type: 'item',
      parentId: sectionId,
      position: nextPosition((e) => e.type === 'item' && e.parent_id === sectionId),
      name: '',
    })
    const snapshot = entries
    setEntries((rows) => [...rows, row])
    try {
      const saved = await insertEntry(row)
      setEntries((rows) => rows.map((r) => (r.id === row.id ? saved : r)))
    } catch (e) {
      setEntries(snapshot)
      setError(`Item toevoegen mislukt: ${e.message}`)
    }
  }

  async function removeEntry(id) {
    const snapshot = entries
    // Drop the row and any of its children (items under a deleted section).
    setEntries((rows) => rows.filter((r) => r.id !== id && r.parent_id !== id))
    try {
      await deleteEntry(id)
    } catch (e) {
      setEntries(snapshot)
      setError(`Verwijderen mislukt: ${e.message}`)
    }
  }

  return (
    <main className="overzicht">
      <header className="overzicht-header">
        <h1>{project.name}</h1>
        <p className="subtitle">Overzicht van de verbouwingskosten</p>
      </header>

      {error && (
        <div className="banner banner--error" role="alert">
          {error}
          <button type="button" className="banner-close" onClick={() => setError(null)}>
            ✕
          </button>
        </div>
      )}

      <SummaryCards totals={totals} />

      <section className="table" aria-label="Budgettabel">
        <div className="row row--head grid">
          <div className="cell cell--name">Sectie / item</div>
          {AMOUNT_FIELDS.map((f) => (
            <div key={f} className="cell cell--amount">
              {COLUMN_LABELS[f]}
            </div>
          ))}
          <div className="cell cell--incl">Meetellen</div>
          <div className="cell cell--actions" aria-hidden="true" />
        </div>

        {sections.length === 0 && (
          <div className="empty">
            Nog geen secties. Voeg er één toe om te beginnen.
          </div>
        )}

        {sections.map((section) => (
          <SectionGroup
            key={section.id}
            section={section}
            onUpdate={patchEntry}
            onDelete={removeEntry}
            onAddItem={addItem}
            onUpdateItem={patchEntry}
            onDeleteItem={removeEntry}
          />
        ))}

        <div className="row row--total grid">
          <div className="cell cell--name" data-label="">
            TOTAAL
          </div>
          {AMOUNT_FIELDS.map((f) => (
            <div key={f} className="cell cell--amount" data-label={COLUMN_LABELS[f]}>
              {formatEuro(totals[f])}
            </div>
          ))}
          <div className="cell cell--incl" />
          <div className="cell cell--actions" />
        </div>
      </section>

      <button type="button" className="btn-add-section" onClick={addSection}>
        + Sectie toevoegen
      </button>
    </main>
  )
}

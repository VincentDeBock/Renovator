import { useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import SummaryCards from './SummaryCards'
import SectionGroup from './EntryRow'
import VersionCompare from './VersionCompare'
import { buildTree, projectTotals, memberOf, ROLLUP_FIELDS } from '../lib/totals'
import { formatEuro } from '../lib/format'
import {
  makeEntry,
  insertEntry,
  updateEntry,
  deleteEntry,
  updatePositions,
} from '../lib/entries'

const COLUMN_LABELS = {
  raming: 'Raming',
  offertes: 'Offertes',
  facturen: 'Facturen',
}

// entries + setEntries are owned by App so the data survives a trip to Settings
// and is shared with the version controls.
export default function Overzicht({ project, entries, setEntries, versions, activeVersionId }) {
  const [error, setError] = useState(null)

  const sections = useMemo(() => buildTree(entries), [entries])
  const isActive = useMemo(() => memberOf(activeVersionId), [activeVersionId])
  const totals = useMemo(() => projectTotals(sections, isActive), [sections, isActive])
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections])

  const activeVersion = versions.find((v) => v.id === activeVersionId) || null
  const activeColor = activeVersion?.color || null
  const allVersionIds = useMemo(() => versions.map((v) => v.id), [versions])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // --- Optimistic helpers ----------------------------------------------------
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
      versionIds: allVersionIds,
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
      versionIds: allVersionIds,
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
    setEntries((rows) => rows.filter((r) => r.id !== id && r.parent_id !== id))
    try {
      await deleteEntry(id)
    } catch (e) {
      setEntries(snapshot)
      setError(`Verwijderen mislukt: ${e.message}`)
    }
  }

  async function persistOrder(orderedIds) {
    const snapshot = entries
    const posById = new Map(orderedIds.map((id, i) => [id, i]))
    setEntries((rows) =>
      rows.map((r) => (posById.has(r.id) ? { ...r, position: posById.get(r.id) } : r)),
    )
    try {
      await updatePositions(orderedIds.map((id, i) => ({ id, position: i })))
    } catch (e) {
      setEntries(snapshot)
      setError(`Volgorde opslaan mislukt: ${e.message}`)
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const type = active.data.current?.type

    if (type === 'section') {
      const oldIndex = sectionIds.indexOf(active.id)
      const newIndex = sectionIds.indexOf(over.id)
      if (oldIndex < 0 || newIndex < 0) return
      persistOrder(arrayMove(sectionIds, oldIndex, newIndex))
      return
    }

    if (type === 'item') {
      const parentId = active.data.current?.parentId
      if (over.data.current?.parentId !== parentId) return
      const section = sections.find((s) => s.id === parentId)
      if (!section) return
      const order = section.items.map((i) => i.id)
      const oldIndex = order.indexOf(active.id)
      const newIndex = order.indexOf(over.id)
      if (oldIndex < 0 || newIndex < 0) return
      persistOrder(arrayMove(order, oldIndex, newIndex))
    }
  }

  return (
    <div className="overzicht">
      {error && (
        <div className="banner banner--error" role="alert">
          {error}
          <button type="button" className="banner-close" onClick={() => setError(null)}>
            ✕
          </button>
        </div>
      )}

      <SummaryCards totals={totals} budget={project.budget} />

      <VersionCompare versions={versions} sections={sections} budget={project.budget} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <section className="table" aria-label="Budgettabel">
          <div className="row row--head grid">
            <div className="cell cell--drag" aria-hidden="true" />
            <div className="cell cell--name">Sectie / item</div>
            {ROLLUP_FIELDS.map((f) => (
              <div key={f} className="cell cell--amount">
                {COLUMN_LABELS[f]}
              </div>
            ))}
            <div className="cell cell--incl">
              {activeVersion ? (
                <span className="vchip" style={{ background: activeColor || '#94a3b8' }}>
                  {activeVersion.name}
                </span>
              ) : (
                'Versie'
              )}
            </div>
            <div className="cell cell--actions" aria-hidden="true" />
          </div>

          {sections.length === 0 && (
            <div className="empty">Nog geen secties. Voeg er één toe om te beginnen.</div>
          )}

          <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
            {sections.map((section) => (
              <SectionGroup
                key={section.id}
                section={section}
                activeVersionId={activeVersionId}
                activeColor={activeColor}
                onUpdate={patchEntry}
                onDelete={removeEntry}
                onAddItem={addItem}
                onUpdateItem={patchEntry}
                onDeleteItem={removeEntry}
              />
            ))}
          </SortableContext>

          <div className="row row--total grid">
            <div className="cell cell--drag" aria-hidden="true" />
            <div className="cell cell--name">TOTAAL</div>
            {ROLLUP_FIELDS.map((f) => (
              <div key={f} className="cell cell--amount" data-label={COLUMN_LABELS[f]}>
                {formatEuro(totals[f])}
              </div>
            ))}
            <div className="cell cell--incl" />
            <div className="cell cell--actions" />
          </div>
        </section>
      </DndContext>

      <button type="button" className="btn-add-section" onClick={addSection}>
        + Sectie toevoegen
      </button>
    </div>
  )
}

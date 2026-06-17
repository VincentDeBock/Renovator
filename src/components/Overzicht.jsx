import { useMemo, useState } from 'react'
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SummaryCards from './SummaryCards'
import SectionGroup from './EntryRow'
import ConfirmDialog from './ConfirmDialog'
import { buildTree, projectTotals, verschil } from '../lib/totals'
import { formatEuro } from '../lib/format'

const collapseKey = (pid) => `renovator.collapsed.${pid}`

export default function Overzicht({ project, entries, patchEntry, removeEntry, addSection, addItem, persistOrder }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(collapseKey(project.id)) || '[]'))
    } catch {
      return new Set()
    }
  })
  const [pendingDelete, setPendingDelete] = useState(null)

  const sections = useMemo(() => buildTree(entries), [entries])
  const totals = useMemo(() => projectTotals(sections), [sections])
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function toggleCollapse(id) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      localStorage.setItem(collapseKey(project.id), JSON.stringify([...next]))
      return next
    })
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const type = active.data.current?.type
    if (type === 'section') {
      const o = sectionIds.indexOf(active.id)
      const n = sectionIds.indexOf(over.id)
      if (o < 0 || n < 0) return
      persistOrder(arrayMove(sectionIds, o, n))
    } else if (type === 'item') {
      const parentId = active.data.current?.parentId
      if (over.data.current?.parentId !== parentId) return
      const section = sections.find((s) => s.id === parentId)
      if (!section) return
      const order = section.items.map((i) => i.id)
      const o = order.indexOf(active.id)
      const n = order.indexOf(over.id)
      if (o < 0 || n < 0) return
      persistOrder(arrayMove(order, o, n))
    }
  }

  return (
    <div className="overzicht">
      <SummaryCards totals={totals} budget={project.budget} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <section className="table" aria-label="Budgettabel">
          <div className="row row--head grid">
            <div className="cell cell--drag" aria-hidden="true" />
            <div className="cell cell--name">Sectie / item</div>
            <div className="cell cell--amount">Offerte</div>
            <div className="cell cell--amount">Factuur</div>
            <div className="cell cell--amount">Verschil</div>
            <div className="cell cell--incl">Meetellen</div>
            <div className="cell cell--actions" aria-hidden="true" />
          </div>

          {sections.length === 0 && <div className="empty">Nog geen secties. Voeg er één toe om te beginnen.</div>}

          <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
            {sections.map((section) => (
              <SectionGroup
                key={section.id}
                section={section}
                collapsed={collapsed.has(section.id)}
                onToggleCollapse={toggleCollapse}
                onUpdate={patchEntry}
                onRequestDelete={setPendingDelete}
                onAddItem={addItem}
                onUpdateItem={patchEntry}
              />
            ))}
          </SortableContext>

          <div className="row row--total grid">
            <div className="cell cell--drag" aria-hidden="true" />
            <div className="cell cell--name">TOTAAL</div>
            <div className="cell cell--amount" data-label="Offerte">{formatEuro(totals.offertes)}</div>
            <div className="cell cell--amount" data-label="Factuur">{formatEuro(totals.facturen)}</div>
            <div className="cell cell--amount" data-label="Verschil">
              <span className={verschil(totals) < 0 ? 'amount--over' : ''}>{formatEuro(verschil(totals))}</span>
            </div>
            <div className="cell cell--incl" />
            <div className="cell cell--actions" />
          </div>
        </section>
      </DndContext>

      <button type="button" className="btn-add-section" onClick={addSection}>+ Sectie toevoegen</button>

      <ConfirmDialog
        open={!!pendingDelete}
        title={pendingDelete?.type === 'section' ? 'Sectie verwijderen' : 'Item verwijderen'}
        message={
          pendingDelete?.type === 'section'
            ? `"${pendingDelete?.name || 'Naamloze sectie'}" en alle items erin worden verwijderd. Dit kan niet ongedaan worden gemaakt.`
            : `"${pendingDelete?.name || 'Naamloos item'}" wordt verwijderd. Dit kan niet ongedaan worden gemaakt.`
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          removeEntry(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}

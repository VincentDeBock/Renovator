import { Link } from 'react-router-dom'
import { useSortable } from '@dnd-kit/sortable'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import EditableCell from './EditableCell'
import Icon from './Icon'
import { sectionAmounts, verschil } from '../lib/totals'
import { formatEuro } from '../lib/format'

function DragHandle({ attributes, listeners }) {
  return (
    <button type="button" className="drag-handle" aria-label="Versleep om te ordenen" {...attributes} {...listeners}>
      <Icon name="grip" size={16} />
    </button>
  )
}

function IncludeToggle({ checked, onChange, label }) {
  return (
    <label className="toggle" aria-label={label}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-thumb" />
      </span>
      <span className="toggle-text">{checked ? 'Ja' : 'Nee'}</span>
    </label>
  )
}

function VerschilCell({ amounts }) {
  const v = verschil(amounts)
  return (
    <div className="cell cell--amount" data-label="Verschil">
      <span className={`amount-rollup ${v < 0 ? 'amount--over' : ''}`}>{formatEuro(v)}</span>
    </div>
  )
}

function ItemRow({ item, onUpdateItem, onRequestDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, data: { type: 'item', parentId: item.parent_id } })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`row row--item grid ${!item.included ? 'row--off' : ''} ${isDragging ? 'row--dragging' : ''}`}
    >
      <div className="cell cell--drag">
        <DragHandle attributes={attributes} listeners={listeners} />
      </div>

      <div className="cell cell--name" data-label="Item">
        <Link className="item-link" to={`/item/${item.id}`}>
          {item.name?.trim() || 'Naamloos item'}
        </Link>
      </div>

      <div className="cell cell--amount" data-label="Offerte">
        <EditableCell
          kind="amount"
          value={item.offertes}
          ariaLabel={`Offerte ${item.name || 'item'}`}
          onSave={(val) => onUpdateItem(item.id, { offertes: val })}
        />
      </div>
      <div className="cell cell--amount" data-label="Factuur">
        <EditableCell
          kind="amount"
          value={item.facturen}
          ariaLabel={`Factuur ${item.name || 'item'}`}
          onSave={(val) => onUpdateItem(item.id, { facturen: val })}
        />
      </div>
      <VerschilCell amounts={item} />

      <div className="cell cell--incl" data-label="Meetellen">
        <IncludeToggle
          checked={item.included}
          label={`Item ${item.name || ''} meetellen`}
          onChange={(on) => onUpdateItem(item.id, { included: on })}
        />
      </div>

      <div className="cell cell--actions">
        <button
          type="button"
          className="btn-icon"
          title="Item verwijderen"
          aria-label={`Item ${item.name || ''} verwijderen`}
          onClick={() => onRequestDelete({ id: item.id, type: 'item', name: item.name })}
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </div>
  )
}

export default function SectionGroup({
  section,
  collapsed,
  onToggleCollapse,
  onUpdate,
  onRequestDelete,
  onAddItem,
  onUpdateItem,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id, data: { type: 'section' } })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const items = section.items ?? []
  const itemIds = items.map((i) => i.id)
  const hasItems = items.length > 0
  const rollup = sectionAmounts(section)

  return (
    <div className={`group ${!section.included ? 'group--off' : ''} ${isDragging ? 'group--dragging' : ''}`}>
      <div ref={setNodeRef} style={style} className="row row--section grid">
        <div className="cell cell--drag">
          <DragHandle attributes={attributes} listeners={listeners} />
        </div>

        <div className="cell cell--name" data-label="Sectie">
          <button
            type="button"
            className={`chevron ${collapsed ? 'chevron--collapsed' : ''}`}
            aria-label={collapsed ? 'Sectie openklappen' : 'Sectie inklappen'}
            onClick={() => onToggleCollapse(section.id)}
          >
            <Icon name="chevron" size={16} />
          </button>
          <EditableCell
            value={section.name}
            placeholder="Naam sectie"
            ariaLabel="Naam sectie"
            onSave={(name) => onUpdate(section.id, { name })}
          />
        </div>

        <div className="cell cell--amount" data-label="Offerte">
          {hasItems ? (
            <span className="amount-rollup">{formatEuro(rollup.offertes)}</span>
          ) : (
            <EditableCell kind="amount" value={section.offertes} ariaLabel="Offerte sectie" onSave={(v) => onUpdate(section.id, { offertes: v })} />
          )}
        </div>
        <div className="cell cell--amount" data-label="Factuur">
          {hasItems ? (
            <span className="amount-rollup">{formatEuro(rollup.facturen)}</span>
          ) : (
            <EditableCell kind="amount" value={section.facturen} ariaLabel="Factuur sectie" onSave={(v) => onUpdate(section.id, { facturen: v })} />
          )}
        </div>
        <VerschilCell amounts={rollup} />

        <div className="cell cell--incl" data-label="Meetellen">
          <IncludeToggle
            checked={section.included}
            label={`Sectie ${section.name || ''} meetellen`}
            onChange={(on) => onUpdate(section.id, { included: on })}
          />
        </div>

        <div className="cell cell--actions">
          <button
            type="button"
            className="btn-icon"
            title="Sectie verwijderen"
            aria-label={`Sectie ${section.name || ''} verwijderen`}
            onClick={() => onRequestDelete({ id: section.id, type: 'section', name: section.name })}
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <ItemRow key={item.id} item={item} onUpdateItem={onUpdateItem} onRequestDelete={onRequestDelete} />
            ))}
          </SortableContext>

          <div className="row row--additem">
            <button type="button" className="btn-add-item" onClick={() => onAddItem(section.id)}>
              + Item toevoegen
            </button>
          </div>
        </>
      )}
    </div>
  )
}

import { useSortable } from '@dnd-kit/sortable'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import EditableCell from './EditableCell'
import { ROLLUP_FIELDS, sectionAmounts, memberOf } from '../lib/totals'
import { formatEuro } from '../lib/format'

const COLUMN_LABELS = {
  raming: 'Raming',
  offertes: 'Offertes',
  facturen: 'Facturen',
}

// New membership array after toggling the active version on/off for a row.
function toggledMembership(row, versionId, on) {
  const current = Array.isArray(row.version_ids) ? row.version_ids : []
  if (on) return current.includes(versionId) ? current : [...current, versionId]
  return current.filter((id) => id !== versionId)
}

function DragHandle({ attributes, listeners }) {
  return (
    <button
      type="button"
      className="drag-handle"
      aria-label="Versleep om te ordenen"
      {...attributes}
      {...listeners}
    >
      <span aria-hidden="true">⠿</span>
    </button>
  )
}

function IncludeToggle({ checked, color, onChange, label }) {
  return (
    <label className="toggle" aria-label={label}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        className="toggle-track"
        aria-hidden="true"
        style={checked && color ? { background: color } : undefined}
      >
        <span className="toggle-thumb" />
      </span>
      <span className="toggle-text">{checked ? 'Ja' : 'Nee'}</span>
    </label>
  )
}

function ItemRow({ item, activeVersionId, activeColor, onUpdateItem, onDeleteItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, data: { type: 'item', parentId: item.parent_id } })

  const style = { transform: CSS.Transform.toString(transform), transition }
  const inVersion = (item.version_ids ?? []).includes(activeVersionId)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`row row--item grid ${!inVersion ? 'row--off' : ''} ${
        isDragging ? 'row--dragging' : ''
      }`}
    >
      <div className="cell cell--drag">
        <DragHandle attributes={attributes} listeners={listeners} />
      </div>

      <div className="cell cell--name" data-label="Item">
        <EditableCell
          value={item.name}
          placeholder="Naam item"
          ariaLabel="Naam item"
          onSave={(name) => onUpdateItem(item.id, { name })}
        />
      </div>

      {ROLLUP_FIELDS.map((field) => (
        <div key={field} className="cell cell--amount" data-label={COLUMN_LABELS[field]}>
          <EditableCell
            kind="amount"
            value={item[field]}
            ariaLabel={`${COLUMN_LABELS[field]} ${item.name || 'item'}`}
            onSave={(val) => onUpdateItem(item.id, { [field]: val })}
          />
        </div>
      ))}

      <div className="cell cell--incl" data-label="In versie">
        <IncludeToggle
          checked={inVersion}
          color={activeColor}
          label={`Item ${item.name || ''} in deze versie`}
          onChange={(on) =>
            onUpdateItem(item.id, { version_ids: toggledMembership(item, activeVersionId, on) })
          }
        />
      </div>

      <div className="cell cell--actions">
        <button
          type="button"
          className="btn-icon"
          title="Item verwijderen"
          aria-label={`Item ${item.name || ''} verwijderen`}
          onClick={() => onDeleteItem(item.id)}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// One section plus its items. Both the section and its items are drag-sortable.
// The include toggle and rollups are scoped to the active version.
export default function SectionGroup({
  section,
  activeVersionId,
  activeColor,
  onUpdate,
  onDelete,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id, data: { type: 'section' } })

  const style = { transform: CSS.Transform.toString(transform), transition }

  const items = section.items ?? []
  const itemIds = items.map((i) => i.id)
  const hasItems = items.length > 0
  const rollup = sectionAmounts(section, memberOf(activeVersionId))
  const inVersion = (section.version_ids ?? []).includes(activeVersionId)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group ${!inVersion ? 'group--off' : ''} ${
        isDragging ? 'group--dragging' : ''
      }`}
    >
      {/* Section row */}
      <div className="row row--section grid">
        <div className="cell cell--drag">
          <DragHandle attributes={attributes} listeners={listeners} />
        </div>

        <div className="cell cell--name" data-label="Sectie">
          <EditableCell
            value={section.name}
            placeholder="Naam sectie"
            ariaLabel="Naam sectie"
            onSave={(name) => onUpdate(section.id, { name })}
          />
        </div>

        {ROLLUP_FIELDS.map((field) => (
          <div key={field} className="cell cell--amount" data-label={COLUMN_LABELS[field]}>
            {hasItems ? (
              <span className="amount-rollup" title="Som van de items in deze versie">
                {formatEuro(rollup[field])}
              </span>
            ) : (
              <EditableCell
                kind="amount"
                value={section[field]}
                ariaLabel={`${COLUMN_LABELS[field]} ${section.name || 'sectie'}`}
                onSave={(val) => onUpdate(section.id, { [field]: val })}
              />
            )}
          </div>
        ))}

        <div className="cell cell--incl" data-label="In versie">
          <IncludeToggle
            checked={inVersion}
            color={activeColor}
            label={`Sectie ${section.name || ''} in deze versie`}
            onChange={(on) =>
              onUpdate(section.id, { version_ids: toggledMembership(section, activeVersionId, on) })
            }
          />
        </div>

        <div className="cell cell--actions">
          <button
            type="button"
            className="btn-icon"
            title="Sectie verwijderen"
            aria-label={`Sectie ${section.name || ''} verwijderen`}
            onClick={() => onDelete(section.id)}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Item rows (sortable within this section) */}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            activeVersionId={activeVersionId}
            activeColor={activeColor}
            onUpdateItem={onUpdateItem}
            onDeleteItem={onDeleteItem}
          />
        ))}
      </SortableContext>

      <div className="row row--additem">
        <button type="button" className="btn-add-item" onClick={() => onAddItem(section.id)}>
          + Item toevoegen
        </button>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useSortable } from '@dnd-kit/sortable'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import EditableCell from './EditableCell'
import Icon from './Icon'
import { sectionAmounts, verschil } from '../lib/totals'
import { formatEuro } from '../lib/format'
import { useLang } from '../i18n'

function DragHandle({ attributes, listeners, label }) {
  return (
    <button type="button" className="drag-handle" aria-label={label} {...attributes} {...listeners}>
      <Icon name="grip" size={16} />
    </button>
  )
}

function IncludeToggle({ checked, onChange, label }) {
  return (
    <label className="incl" aria-label={label}>
      <input className="incl-input" type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="incl-box" aria-hidden="true">
        <Icon name="check" size={13} strokeWidth={3} />
      </span>
    </label>
  )
}

function VerschilCell({ amounts, label }) {
  const v = verschil(amounts)
  return (
    <div className="cell cell--amount" data-label={label}>
      <span className={`amount-rollup ${v < 0 ? 'amount--over' : ''}`}>{formatEuro(v)}</span>
    </div>
  )
}

function ItemRow({ item, onUpdateItem, onRequestDelete }) {
  const { t } = useLang()
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
        <DragHandle attributes={attributes} listeners={listeners} label={t('ov.dragAria')} />
      </div>

      <div className="cell cell--name" data-label={t('common.item')}>
        <Link className="item-link" to={`/item/${item.id}`}>
          {item.name?.trim() || t('common.unnamedItem')}
        </Link>
      </div>

      <div className="cell cell--amount" data-label={t('ov.colQuote')}>
        <EditableCell
          kind="amount"
          value={item.offertes}
          ariaLabel={`${t('ov.colQuote')} ${item.name || t('common.item')}`}
          onSave={(val) => onUpdateItem(item.id, { offertes: val })}
        />
      </div>
      <div className="cell cell--amount" data-label={t('ov.colInvoice')}>
        <EditableCell
          kind="amount"
          value={item.facturen}
          ariaLabel={`${t('ov.colInvoice')} ${item.name || t('common.item')}`}
          onSave={(val) => onUpdateItem(item.id, { facturen: val })}
        />
      </div>
      <VerschilCell amounts={item} label={t('ov.colDiff')} />

      <div className="cell cell--incl" data-label={t('ov.colInclude')}>
        <IncludeToggle
          checked={item.included}
          label={t('ov.includeItemAria', { name: item.name || '' })}
          onChange={(on) => onUpdateItem(item.id, { included: on })}
        />
      </div>

      <div className="cell cell--actions">
        <button
          type="button"
          className="btn-icon"
          title={t('ov.deleteItemTitle')}
          aria-label={t('ov.deleteItemAria', { name: item.name || '' })}
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
  const { t } = useLang()
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
          <DragHandle attributes={attributes} listeners={listeners} label={t('ov.dragAria')} />
        </div>

        <div className="cell cell--name" data-label={t('common.section')}>
          <button
            type="button"
            className={`chevron ${collapsed ? 'chevron--collapsed' : ''}`}
            aria-label={collapsed ? t('ov.expandSection') : t('ov.collapseSection')}
            onClick={() => onToggleCollapse(section.id)}
          >
            <Icon name="chevron" size={16} />
          </button>
          <EditableCell
            value={section.name}
            placeholder={t('ov.sectionNamePlaceholder')}
            ariaLabel={t('ov.sectionNamePlaceholder')}
            onSave={(name) => onUpdate(section.id, { name })}
          />
          {hasItems && (
            <span className="section-count">
              {t(items.length === 1 ? 'ov.itemCountOne' : 'ov.itemCountMany', { n: items.length })}
            </span>
          )}
        </div>

        <div className="cell cell--amount" data-label={t('ov.colQuote')}>
          {hasItems ? (
            <span className="amount-rollup">{formatEuro(rollup.offertes)}</span>
          ) : (
            <EditableCell kind="amount" value={section.offertes} ariaLabel={t('ov.quoteSectionAria')} onSave={(v) => onUpdate(section.id, { offertes: v })} />
          )}
        </div>
        <div className="cell cell--amount" data-label={t('ov.colInvoice')}>
          {hasItems ? (
            <span className="amount-rollup">{formatEuro(rollup.facturen)}</span>
          ) : (
            <EditableCell kind="amount" value={section.facturen} ariaLabel={t('ov.invoiceSectionAria')} onSave={(v) => onUpdate(section.id, { facturen: v })} />
          )}
        </div>
        <VerschilCell amounts={rollup} label={t('ov.colDiff')} />

        <div className="cell cell--incl" data-label={t('ov.colInclude')}>
          <IncludeToggle
            checked={section.included}
            label={t('ov.includeSectionAria', { name: section.name || '' })}
            onChange={(on) => onUpdate(section.id, { included: on })}
          />
        </div>

        <div className="cell cell--actions">
          <button
            type="button"
            className="btn-icon"
            title={t('ov.deleteSectionTitle')}
            aria-label={t('ov.deleteSectionAria', { name: section.name || '' })}
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

          <div className="row row--additem grid">
            <div className="cell cell--drag" aria-hidden="true" />
            <div className="cell cell--name">
              <button type="button" className="btn-add-item" onClick={() => onAddItem(section.id)}>
                <Icon name="plus" size={15} /> {t('ov.addItem')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

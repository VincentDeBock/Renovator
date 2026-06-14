import EditableCell from './EditableCell'
import { AMOUNT_FIELDS, sectionAmounts } from '../lib/totals'
import { formatEuro } from '../lib/format'

const COLUMN_LABELS = {
  raming: 'Raming',
  budget: 'Budget',
  offertes: 'Offertes',
  facturen: 'Facturen',
}

function IncludeToggle({ included, onChange, label }) {
  return (
    <label className="toggle" aria-label={label}>
      <input
        type="checkbox"
        checked={included}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-thumb" />
      </span>
      <span className="toggle-text">{included ? 'Ja' : 'Nee'}</span>
    </label>
  )
}

// One section plus its items. All edits flow up through the callbacks.
export default function SectionGroup({
  section,
  onUpdate,
  onDelete,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}) {
  const items = section.items ?? []
  const hasItems = items.length > 0
  const rollup = sectionAmounts(section)
  const dimmed = !section.included

  return (
    <div className={`group ${dimmed ? 'group--off' : ''}`}>
      {/* Section row */}
      <div className="row row--section grid">
        <div className="cell cell--name" data-label="Sectie">
          <EditableCell
            value={section.name}
            placeholder="Naam sectie"
            ariaLabel="Naam sectie"
            onSave={(name) => onUpdate(section.id, { name })}
          />
        </div>

        {AMOUNT_FIELDS.map((field) => (
          <div key={field} className="cell cell--amount" data-label={COLUMN_LABELS[field]}>
            {hasItems ? (
              <span className="amount-rollup" title="Som van de items">
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

        <div className="cell cell--incl" data-label="Meetellen">
          <IncludeToggle
            included={section.included}
            label={`Sectie ${section.name || ''} meetellen`}
            onChange={(included) => onUpdate(section.id, { included })}
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

      {/* Item rows */}
      {items.map((item) => {
        const itemDimmed = !item.included
        return (
          <div
            key={item.id}
            className={`row row--item grid ${itemDimmed ? 'row--off' : ''}`}
          >
            <div className="cell cell--name" data-label="Item">
              <EditableCell
                value={item.name}
                placeholder="Naam item"
                ariaLabel="Naam item"
                onSave={(name) => onUpdateItem(item.id, { name })}
              />
            </div>

            {AMOUNT_FIELDS.map((field) => (
              <div key={field} className="cell cell--amount" data-label={COLUMN_LABELS[field]}>
                <EditableCell
                  kind="amount"
                  value={item[field]}
                  ariaLabel={`${COLUMN_LABELS[field]} ${item.name || 'item'}`}
                  onSave={(val) => onUpdateItem(item.id, { [field]: val })}
                />
              </div>
            ))}

            <div className="cell cell--incl" data-label="Meetellen">
              <IncludeToggle
                included={item.included}
                label={`Item ${item.name || ''} meetellen`}
                onChange={(included) => onUpdateItem(item.id, { included })}
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
      })}

      <div className="row row--additem">
        <button type="button" className="btn-add-item" onClick={() => onAddItem(section.id)}>
          + Item toevoegen
        </button>
      </div>
    </div>
  )
}

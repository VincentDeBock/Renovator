// Pure rollup logic, kept out of the components so it stays testable.
//
// Rules (from the spec):
//  - A section's amounts are the sum of its items' amounts.
//  - A section with no items can hold amounts directly.
//  - Only rows with included = true count toward section and project totals.

export const AMOUNT_FIELDS = ['raming', 'budget', 'offertes', 'facturen']

const zeroAmounts = () =>
  AMOUNT_FIELDS.reduce((acc, f) => ((acc[f] = 0), acc), {})

// Split a flat entries array into sections, each carrying its ordered items.
export function buildTree(entries) {
  const sections = entries
    .filter((e) => e.type === 'section')
    .sort(byOrder)
    .map((section) => ({ ...section, items: [] }))

  const byId = new Map(sections.map((s) => [s.id, s]))

  entries
    .filter((e) => e.type === 'item')
    .sort(byOrder)
    .forEach((item) => {
      const parent = byId.get(item.parent_id)
      if (parent) parent.items.push(item)
    })

  return sections
}

function byOrder(a, b) {
  if (a.position !== b.position) return a.position - b.position
  return (a.created_at ?? '').localeCompare(b.created_at ?? '')
}

// The amounts shown on a section row: rollup of its INCLUDED items, or its own
// stored amounts when it has no items.
export function sectionAmounts(section) {
  if (!section.items || section.items.length === 0) {
    return pickAmounts(section)
  }
  return section.items.reduce((acc, item) => {
    if (item.included) {
      for (const f of AMOUNT_FIELDS) acc[f] += Number(item[f]) || 0
    }
    return acc
  }, zeroAmounts())
}

// What a section contributes to the project totals (respects the section toggle).
export function sectionContribution(section) {
  if (!section.included) return zeroAmounts()
  return sectionAmounts(section)
}

// Project-level totals across every included section.
export function projectTotals(sections) {
  return sections.reduce((acc, section) => {
    const contrib = sectionContribution(section)
    for (const f of AMOUNT_FIELDS) acc[f] += contrib[f]
    return acc
  }, zeroAmounts())
}

function pickAmounts(row) {
  return AMOUNT_FIELDS.reduce((acc, f) => {
    acc[f] = Number(row[f]) || 0
    return acc
  }, {})
}

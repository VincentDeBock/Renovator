// Pure rollup logic, kept out of the components so it stays testable.
//
// Single version: only rows with included = true count toward section and project
// totals. Sections roll up from their items; an item-less section holds amounts
// directly. (The dormant `version_ids` column is ignored now that versions were
// removed per the Overzicht design.)
//
// Budget is a project-level target (projects.budget). Raming stays in the data but
// is no longer shown; the Overzicht surfaces offertes, facturen and their verschil.

export const ROLLUP_FIELDS = ['raming', 'offertes', 'facturen']

const zeroAmounts = () =>
  ROLLUP_FIELDS.reduce((acc, f) => ((acc[f] = 0), acc), {})

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

// Amounts shown on a section row: rollup of its included items, or its own stored
// amounts when it has no items.
export function sectionAmounts(section) {
  if (!section.items || section.items.length === 0) {
    return pickAmounts(section)
  }
  return section.items.reduce((acc, item) => {
    if (item.included) {
      for (const f of ROLLUP_FIELDS) acc[f] += Number(item[f]) || 0
    }
    return acc
  }, zeroAmounts())
}

export function sectionContribution(section) {
  if (!section.included) return zeroAmounts()
  return sectionAmounts(section)
}

export function projectTotals(sections) {
  return sections.reduce((acc, section) => {
    const contrib = sectionContribution(section)
    for (const f of ROLLUP_FIELDS) acc[f] += contrib[f]
    return acc
  }, zeroAmounts())
}

// Verschil = offerte − factuur. Negative (factuur > offerte) means overspend → red.
export function verschil(amounts) {
  return (Number(amounts.offertes) || 0) - (Number(amounts.facturen) || 0)
}

function pickAmounts(row) {
  return ROLLUP_FIELDS.reduce((acc, f) => {
    acc[f] = Number(row[f]) || 0
    return acc
  }, {})
}

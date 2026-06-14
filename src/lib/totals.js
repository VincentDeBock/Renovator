// Pure rollup logic, kept out of the components so it stays testable.
//
// Rules:
//  - A section's amounts are the sum of its items' amounts.
//  - A section with no items can hold amounts directly.
//  - Only rows that are "included" count toward section and project totals.
//
// "Included" used to be a single boolean. It is now per-version: a row counts in a
// version when its id is in that version's membership. Callers pass an
// `isIncluded(entry) => bool` predicate so this stays version-agnostic.
//
// Budget is NOT here: it is a single project-level target (projects.budget).
// The fields that roll up are raming, offertes and facturen.

export const ROLLUP_FIELDS = ['raming', 'offertes', 'facturen']

const zeroAmounts = () =>
  ROLLUP_FIELDS.reduce((acc, f) => ((acc[f] = 0), acc), {})

// Predicate factory: is this entry a member of the given version?
export function memberOf(versionId) {
  return (entry) => Array.isArray(entry.version_ids) && entry.version_ids.includes(versionId)
}

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

// The amounts shown on a section row: rollup of its included items, or its own
// stored amounts when it has no items.
export function sectionAmounts(section, isIncluded) {
  if (!section.items || section.items.length === 0) {
    return pickAmounts(section)
  }
  return section.items.reduce((acc, item) => {
    if (isIncluded(item)) {
      for (const f of ROLLUP_FIELDS) acc[f] += Number(item[f]) || 0
    }
    return acc
  }, zeroAmounts())
}

// What a section contributes to the project totals (respects its own membership).
export function sectionContribution(section, isIncluded) {
  if (!isIncluded(section)) return zeroAmounts()
  return sectionAmounts(section, isIncluded)
}

// Project-level totals across every included section, for a given predicate.
export function projectTotals(sections, isIncluded) {
  return sections.reduce((acc, section) => {
    const contrib = sectionContribution(section, isIncluded)
    for (const f of ROLLUP_FIELDS) acc[f] += contrib[f]
    return acc
  }, zeroAmounts())
}

// Convenience: totals for one version id.
export function versionTotals(sections, versionId) {
  return projectTotals(sections, memberOf(versionId))
}

function pickAmounts(row) {
  return ROLLUP_FIELDS.reduce((acc, f) => {
    acc[f] = Number(row[f]) || 0
    return acc
  }, {})
}

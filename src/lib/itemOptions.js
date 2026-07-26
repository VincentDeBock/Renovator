// Build options for the "link a task to an item" dropdown: every item, with its
// section. `label` ("Section / Item") stays for any plain-text consumers; the
// split `section`/`item` fields let the custom picker render a two-line entry.
// `labels` provides translated fallbacks for unnamed rows.
export function buildItemOptions(entries, labels = {}) {
  const fallbackSection = labels.section || 'Sectie'
  const fallbackItem = labels.unnamed || 'Naamloos item'
  const sectionName = new Map(
    entries.filter((e) => e.type === 'section').map((s) => [s.id, s.name?.trim() || fallbackSection]),
  )
  return entries
    .filter((e) => e.type === 'item')
    .map((i) => {
      const section = sectionName.get(i.parent_id) || fallbackSection
      const item = i.name?.trim() || fallbackItem
      return { id: i.id, section, item, label: `${section} / ${item}` }
    })
}

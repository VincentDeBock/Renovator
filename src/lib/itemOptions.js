// Build options for the "link a task to an item" dropdown: every item, with its
// section. `label` ("Section / Item") stays for any plain-text consumers; the
// split `section`/`item` fields let the custom picker render a two-line entry.
export function buildItemOptions(entries) {
  const sectionName = new Map(
    entries.filter((e) => e.type === 'section').map((s) => [s.id, s.name?.trim() || 'Sectie']),
  )
  return entries
    .filter((e) => e.type === 'item')
    .map((i) => {
      const section = sectionName.get(i.parent_id) || 'Sectie'
      const item = i.name?.trim() || 'Naamloos item'
      return { id: i.id, section, item, label: `${section} / ${item}` }
    })
}

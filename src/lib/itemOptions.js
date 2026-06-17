// Build { id, label } options for the "link a task to an item" dropdown:
// every item, labelled "Section / Item".
export function buildItemOptions(entries) {
  const sectionName = new Map(
    entries.filter((e) => e.type === 'section').map((s) => [s.id, s.name?.trim() || 'Sectie']),
  )
  return entries
    .filter((e) => e.type === 'item')
    .map((i) => ({
      id: i.id,
      label: `${sectionName.get(i.parent_id) || 'Sectie'} / ${i.name?.trim() || 'Naamloos item'}`,
    }))
}

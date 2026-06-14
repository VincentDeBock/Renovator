// Data layer: every Supabase read/write for projects + entries lives here so the
// components stay declarative and this stays the single place to test/replace.

import { supabase } from './supabase'
import { AMOUNT_FIELDS } from './totals'

// Load the seeded project (Phase 1 has exactly one).
export async function getProject() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

// All sections + items for a project, ordered for display.
export async function getEntries(projectId) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

// Build a full entry row in memory. The id is minted client-side so the UI can
// render the new row instantly (optimistic) and edit it before the insert lands.
export function makeEntry({ projectId, type, parentId = null, name = '', position = 0 }) {
  return {
    id: crypto.randomUUID(),
    project_id: projectId,
    parent_id: parentId,
    type,
    name,
    position,
    included: true,
    raming: 0,
    budget: 0,
    offertes: 0,
    facturen: 0,
  }
}

// Persist a row built by makeEntry. Returns the stored row.
export async function insertEntry(row) {
  const { data, error } = await supabase.from('entries').insert(row).select().single()
  if (error) throw error
  return data
}

// Patch one or more columns on an entry. `patch` is e.g. { name } or { raming }.
export async function updateEntry(id, patch) {
  const clean = sanitizePatch(patch)
  const { data, error } = await supabase
    .from('entries')
    .update(clean)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete a section (its items cascade) or a single item.
export async function deleteEntry(id) {
  const { error } = await supabase.from('entries').delete().eq('id', id)
  if (error) throw error
}

// Guard the write surface: only known columns, amounts coerced to numbers.
function sanitizePatch(patch) {
  const out = {}
  for (const [key, value] of Object.entries(patch)) {
    if (AMOUNT_FIELDS.includes(key)) {
      out[key] = Number(value) || 0
    } else if (key === 'name') {
      out[key] = String(value ?? '')
    } else if (key === 'included') {
      out[key] = Boolean(value)
    } else if (key === 'position') {
      out[key] = Number(value) || 0
    }
  }
  return out
}

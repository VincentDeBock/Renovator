// Data layer: every Supabase read/write for projects + entries lives here so the
// components stay declarative and this stays the single place to test/replace.

import { supabase } from './supabase'
import { ROLLUP_FIELDS } from './totals'

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
// New rows default into every current version (count until excluded).
export function makeEntry({
  projectId,
  type,
  parentId = null,
  name = '',
  position = 0,
  versionIds = [],
}) {
  return {
    id: crypto.randomUUID(),
    project_id: projectId,
    parent_id: parentId,
    type,
    name,
    position,
    version_ids: versionIds,
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

// Persist new positions after a drag-and-drop reorder. `updates` is an array of
// { id, position }. Runs the writes in parallel and throws on the first failure.
export async function updatePositions(updates) {
  const results = await Promise.all(
    updates.map(({ id, position }) =>
      supabase.from('entries').update({ position }).eq('id', id),
    ),
  )
  const failed = results.find((r) => r.error)
  if (failed) throw failed.error
}

// --- Versions ----------------------------------------------------------------

export async function getVersions(projectId) {
  const { data, error } = await supabase
    .from('versions')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createVersion({ projectId, name, color, position }) {
  const row = { id: crypto.randomUUID(), project_id: projectId, name, color, position }
  const { data, error } = await supabase.from('versions').insert(row).select().single()
  if (error) throw error
  return data
}

export async function updateVersion(id, patch) {
  const clean = {}
  if ('name' in patch) clean.name = String(patch.name ?? '')
  if ('color' in patch) clean.color = patch.color ?? null
  if ('position' in patch) clean.position = Number(patch.position) || 0

  const { data, error } = await supabase
    .from('versions')
    .update(clean)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteVersion(id) {
  const { error } = await supabase.from('versions').delete().eq('id', id)
  if (error) throw error
}

// Persist version_ids for several entries at once (used when adding/removing a
// version touches many rows). `updates` is an array of { id, version_ids }.
export async function updateMemberships(updates) {
  const results = await Promise.all(
    updates.map(({ id, version_ids }) =>
      supabase.from('entries').update({ version_ids }).eq('id', id),
    ),
  )
  const failed = results.find((r) => r.error)
  if (failed) throw failed.error
}

// Update project-level fields (currently the name and the budget target).
export async function updateProject(id, patch) {
  const clean = {}
  if ('name' in patch) clean.name = String(patch.name ?? '')
  if ('budget' in patch) clean.budget = Number(patch.budget) || 0

  const { data, error } = await supabase
    .from('projects')
    .update(clean)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Guard the write surface: only known columns, amounts coerced to numbers.
function sanitizePatch(patch) {
  const out = {}
  for (const [key, value] of Object.entries(patch)) {
    if (ROLLUP_FIELDS.includes(key)) {
      out[key] = Number(value) || 0
    } else if (key === 'name') {
      out[key] = String(value ?? '')
    } else if (key === 'included') {
      out[key] = Boolean(value)
    } else if (key === 'position') {
      out[key] = Number(value) || 0
    } else if (key === 'version_ids') {
      out[key] = Array.isArray(value) ? value.map((v) => String(v)) : []
    }
  }
  return out
}

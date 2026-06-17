import { supabase } from './supabase'

// Tasks for the To Do page and the item detail to-do section.
export async function getTasks({ projectId, entryId } = {}) {
  let q = supabase.from('tasks').select('*').order('created_at', { ascending: true })
  if (projectId) q = q.eq('project_id', projectId)
  if (entryId) q = q.eq('entry_id', entryId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export function makeTask({ projectId, entryId = null, ownerId = null, createdBy = null }) {
  return {
    id: crypto.randomUUID(),
    project_id: projectId,
    entry_id: entryId,
    title: '',
    owner_id: ownerId,
    priority: 'medium',
    deadline: null,
    completed: false,
    created_by: createdBy,
  }
}

export async function insertTask(row) {
  const { data, error } = await supabase.from('tasks').insert(row).select().single()
  if (error) throw error
  return data
}

export async function updateTask(id, patch) {
  const clean = {}
  if ('title' in patch) clean.title = String(patch.title ?? '')
  if ('owner_id' in patch) clean.owner_id = patch.owner_id || null
  if ('priority' in patch) clean.priority = patch.priority
  if ('deadline' in patch) clean.deadline = patch.deadline || null
  if ('completed' in patch) clean.completed = Boolean(patch.completed)
  if ('entry_id' in patch) clean.entry_id = patch.entry_id || null

  const { data, error } = await supabase.from('tasks').update(clean).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

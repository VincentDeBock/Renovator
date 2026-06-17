import { supabase } from './supabase'

export async function getTags(projectId) {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('project_id', projectId)
    .order('name', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createTag({ projectId, name, color = null }) {
  const row = { id: crypto.randomUUID(), project_id: projectId, name, color }
  const { data, error } = await supabase.from('tags').insert(row).select().single()
  if (error) throw error
  return data
}

export async function updateTag(id, patch) {
  const clean = {}
  if ('name' in patch) clean.name = String(patch.name ?? '')
  if ('color' in patch) clean.color = patch.color ?? null
  const { data, error } = await supabase.from('tags').update(clean).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteTag(id) {
  const { error } = await supabase.from('tags').delete().eq('id', id)
  if (error) throw error
}

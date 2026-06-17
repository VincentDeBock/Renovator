import { supabase } from './supabase'

const BUCKET = 'item-files'

// category: 'quote' (offertes) | 'invoice' (facturen) | 'picture' (inspiratie)
export async function listFiles({ projectId, entryId, category } = {}) {
  let q = supabase
    .from('files')
    .select('*, file_tags(tag_id)')
    .order('uploaded_at', { ascending: false })
  if (projectId) q = q.eq('project_id', projectId)
  if (entryId) q = q.eq('entry_id', entryId)
  if (category) q = q.eq('category', category)
  const { data, error } = await q
  if (error) throw error
  // Flatten nested tag ids.
  return (data ?? []).map((f) => ({ ...f, tag_ids: (f.file_tags ?? []).map((t) => t.tag_id) }))
}

export async function uploadFile(file, { projectId, entryId, category, amount = null, status = null, uploadedBy = null }) {
  const safe = file.name.replace(/[^\w.\-]+/g, '_')
  const path = `${entryId ?? 'project'}/${crypto.randomUUID()}_${safe}`

  const up = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  })
  if (up.error) throw up.error

  const row = {
    id: crypto.randomUUID(),
    project_id: projectId,
    entry_id: entryId ?? null,
    name: file.name,
    storage_path: path,
    mime_type: file.type || null,
    category,
    size_bytes: file.size ?? null,
    amount,
    status,
    uploaded_by: uploadedBy,
  }
  const { data, error } = await supabase.from('files').insert(row).select('*').single()
  if (error) throw error
  return { ...data, tag_ids: [] }
}

export async function updateFile(id, patch) {
  const clean = {}
  if ('amount' in patch) clean.amount = patch.amount === null ? null : Number(patch.amount) || 0
  if ('status' in patch) clean.status = patch.status || null
  if ('name' in patch) clean.name = String(patch.name ?? '')
  const { data, error } = await supabase.from('files').update(clean).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function deleteFile(file) {
  // Best-effort remove the binary, then the row.
  await supabase.storage.from(BUCKET).remove([file.storage_path])
  const { error } = await supabase.from('files').delete().eq('id', file.id)
  if (error) throw error
}

// Short-lived URL so private files can be viewed/previewed without downloading.
export async function signedUrl(path, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn)
  if (error) throw error
  return data.signedUrl
}

// Replace a file's tags with the given set.
export async function setFileTags(fileId, tagIds) {
  const del = await supabase.from('file_tags').delete().eq('file_id', fileId)
  if (del.error) throw del.error
  if (tagIds.length) {
    const rows = tagIds.map((tag_id) => ({ file_id: fileId, tag_id }))
    const { error } = await supabase.from('file_tags').insert(rows)
    if (error) throw error
  }
}

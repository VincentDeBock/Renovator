import { supabase } from './supabase'

const BUCKET = 'item-files'

// category: 'quote' (offertes) | 'invoice' (facturen) | 'picture' (inspiratie)
export async function listFiles({ projectId, entryId, category, includeArchived = false } = {}) {
  let q = supabase
    .from('files')
    .select('*, file_tags(tag_id)')
    .order('uploaded_at', { ascending: false })
  if (projectId) q = q.eq('project_id', projectId)
  if (entryId) q = q.eq('entry_id', entryId)
  if (category) q = q.eq('category', category)
  if (!includeArchived) q = q.is('archived_at', null)
  const { data, error } = await q
  if (error) throw error
  // Flatten nested tag ids.
  return (data ?? []).map((f) => ({ ...f, tag_ids: (f.file_tags ?? []).map((t) => t.tag_id) }))
}

// SHA-256 hex of the file bytes, used for duplicate detection before upload.
export async function computeHash(file) {
  const buf = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Returns an existing active (non-archived) file with the same hash, or null.
export async function findDuplicate(projectId, hash) {
  if (!hash) return null
  const { data, error } = await supabase
    .from('files')
    .select('id, name, ai_title, uploaded_at')
    .eq('project_id', projectId)
    .eq('content_hash', hash)
    .is('archived_at', null)
    .limit(1)
  if (error) throw error
  return data?.[0] ?? null
}

export async function uploadFile(file, { projectId, entryId, category, amount = null, status = null, uploadedBy = null, contentHash = null }) {
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
    content_hash: contentHash,
    ai_status: 'pending',
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
  if ('ai_title' in patch) clean.ai_title = patch.ai_title === null ? null : String(patch.ai_title)
  if ('vendor' in patch) clean.vendor = patch.vendor === null ? null : String(patch.vendor)
  if ('entry_id' in patch) clean.entry_id = patch.entry_id || null
  const { data, error } = await supabase.from('files').update(clean).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

// Soft delete: documents are archived, never hard-deleted in the normal flow,
// so a declined quote/invoice can be brought back later.
export async function archiveFile(id) {
  const { data, error } = await supabase
    .from('files')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function unarchiveFile(id) {
  const { data, error } = await supabase
    .from('files')
    .update({ archived_at: null })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteFile(file) {
  // Hard delete (binary + row). Reserved for permanent removal; the UI archives
  // by default. Best-effort remove the binary, then the row.
  await supabase.storage.from(BUCKET).remove([file.storage_path])
  const { error } = await supabase.from('files').delete().eq('id', file.id)
  if (error) throw error
}

// Fire-and-forget: ask the Netlify Function to derive name + tags from the PDF.
// Returns the updated file row (ai fields + tags) on success, or null on failure
// so the upload flow never breaks because of the AI step.
export async function triggerDocAi(fileId) {
  try {
    const res = await fetch('/.netlify/functions/process-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId }),
    })
    if (!res.ok) return null
    const out = await res.json()
    return out?.file ?? null
  } catch {
    return null
  }
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

import { createClient } from '@/lib/supabase/server'
import { createClient as adminSupabase } from '@supabase/supabase-js'

export const maxDuration = 60

function adminClient() {
  return adminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Response('Unauthorized', { status: 401 }) }
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: string }>()
  if (me?.role !== 'admin') return { error: new Response('Forbidden', { status: 403 }) }
  return { error: null }
}

const MAX_BYTES = 10 * 1024 * 1024

// Upload a resume on a candidate's behalf. Uses the same storage path and
// public-URL shape as a candidate self-upload, so /api/resume/[candidateId]
// (redaction, docx→pdf, OCR) handles it identically.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return new Response('No file provided', { status: 400 })
  if (file.size === 0) return new Response('File is empty', { status: 400 })
  if (file.size > MAX_BYTES) return new Response('Resume must be under 10MB', { status: 400 })

  const db = adminClient()

  // Keep the original name (sanitised) so downloads look right; the candidate
  // id folder keeps files namespaced per candidate
  const safeName = (file.name || 'resume').replace(/[^\w.\-]+/g, '_').slice(-100)
  const storagePath = `${id}/${safeName}`

  const { error: uploadError } = await db.storage.from('resumes').upload(
    storagePath,
    await file.arrayBuffer(),
    { contentType: file.type || 'application/octet-stream', upsert: true },
  )
  if (uploadError) {
    console.error('resume upload error:', uploadError.message)
    return new Response(uploadError.message, { status: 500 })
  }

  const { data: urlData } = db.storage.from('resumes').getPublicUrl(storagePath)
  const resume_url = urlData.publicUrl

  const { error: dbError } = await db
    .from('candidate_profiles')
    .update({ resume_url, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (dbError) return new Response(dbError.message, { status: 500 })

  return Response.json({ ok: true, resume_url })
}

// Detach the resume from the candidate (and delete stored copies).
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const db = adminClient()

  const { data: files } = await db.storage.from('resumes').list(id)
  if (files?.length) {
    await db.storage.from('resumes').remove(files.map((f: { name: string }) => `${id}/${f.name}`))
  }

  const { error } = await db
    .from('candidate_profiles')
    .update({ resume_url: null, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return new Response(error.message, { status: 500 })

  return Response.json({ ok: true })
}

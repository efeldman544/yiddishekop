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

function s(v: unknown): string | null {
  const t = typeof v === 'string' ? v.trim() : ''
  return t || null
}

function arr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean)
  if (typeof v === 'string') return v.split(/[;,]/).map(x => x.trim()).filter(Boolean)
  return []
}

function bool(v: unknown): boolean | null {
  if (typeof v === 'boolean') return v
  return null
}

// Update a candidate's profile fields. Status and admin_tags are owned by the
// AdminControls panel and deliberately not writable here.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return new Response('Invalid JSON', { status: 400 })

  if (!s(body.full_name)) return new Response('Full name is required', { status: 400 })

  const db = adminClient()
  const { error } = await db.from('candidate_profiles').update({
    full_name: s(body.full_name),
    email: s(body.email),
    phone: s(body.phone),
    whatsapp: s(body.whatsapp),
    location: s(body.location),
    current_job_title: s(body.current_job_title),
    education_level: s(body.education_level),
    years_experience: s(body.years_experience),
    fields_worked_in: arr(body.fields_worked_in),
    employment_type: arr(body.employment_type),
    tools_software: s(body.tools_software),
    languages: s(body.languages),
    roles_seeking: s(body.roles_seeking),
    desired_salary: s(body.desired_salary),
    currency: s(body.currency),
    us_hours_comfortable: bool(body.us_hours_comfortable),
    remote_experience: bool(body.remote_experience),
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) {
    console.error('update-candidate error:', error.message)
    return new Response(error.message, { status: 500 })
  }

  // Keep the login/profile record in step with the profile fields
  const email = s(body.email)
  await db.from('profiles').update({
    full_name: s(body.full_name),
    ...(email ? { email } : {}),
  }).eq('id', id)

  return Response.json({ ok: true })
}

// Permanently delete a candidate and everything attached to them.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const db = adminClient()

  // Rows that reference the candidate but don't cascade from auth.users
  for (const table of [
    'candidate_job_assignments',
    'employer_candidate_assignments',
    'candidate_ai_scores',
    'meeting_requests',
    'screening_bookings',
    'videos',
    'notifications',
  ]) {
    await db.from(table).delete().eq('candidate_id', id)
  }

  // Stored resumes live under a folder named for the candidate id
  const { data: files } = await db.storage.from('resumes').list(id)
  if (files?.length) {
    await db.storage.from('resumes').remove(files.map((f: { name: string }) => `${id}/${f.name}`))
  }

  // Deleting the auth user cascades profiles → candidate_profiles. Candidates
  // imported without a login have no auth user, so fall back to direct deletes.
  const { error: authDeleteError } = await db.auth.admin.deleteUser(id)
  if (authDeleteError) {
    await db.from('candidate_profiles').delete().eq('id', id)
    await db.from('profiles').delete().eq('id', id)
  }

  const { data: stillThere } = await db
    .from('candidate_profiles')
    .select('id')
    .eq('id', id)
    .maybeSingle()
  if (stillThere) {
    return new Response('Could not fully delete this candidate', { status: 500 })
  }

  return Response.json({ ok: true })
}

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

function s(v: unknown): string | null {
  const t = typeof v === 'string' ? v.trim() : ''
  return t || null
}

// Multi-value cells arrive as arrays (manual form) or ";"/"," separated strings (CSV)
function arr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean)
  if (typeof v === 'string') return v.split(/[;,]/).map(x => x.trim()).filter(Boolean)
  return []
}

function bool(v: unknown): boolean | null {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') {
    const t = v.trim().toLowerCase()
    if (['yes', 'true', '1', 'y'].includes(t)) return true
    if (['no', 'false', '0', 'n'].includes(t)) return false
  }
  return null
}

// Creates candidates the way the schema requires: an auth user first
// (candidate_profiles.id references profiles.id, and profiles is created by
// the on-signup trigger), then the candidate_profiles row. Existing candidate
// emails get their profile updated; emails belonging to other roles are skipped.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: string }>()
  if (me?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const body = await req.json().catch(() => null)
  const candidates: Record<string, unknown>[] = Array.isArray(body?.candidates) ? body.candidates : []
  if (candidates.length === 0) return new Response('No candidates provided', { status: 400 })
  if (candidates.length > 50) return new Response('Max 50 candidates per request — send in chunks', { status: 400 })

  const db = adminClient()
  let created = 0
  let updated = 0
  const errors: string[] = []

  for (const raw of candidates) {
    const full_name = s(raw.full_name)
    const email = s(raw.email)?.toLowerCase()
    if (!full_name || !email) {
      errors.push(`${email ?? full_name ?? 'row'}: name and email are required`)
      continue
    }

    const profileFields = {
      full_name,
      email,
      phone: s(raw.phone),
      whatsapp: s(raw.whatsapp),
      location: s(raw.location),
      current_job_title: s(raw.current_job_title),
      education_level: s(raw.education_level),
      years_experience: s(raw.years_experience),
      fields_worked_in: arr(raw.fields_worked_in),
      employment_type: arr(raw.employment_type),
      tools_software: s(raw.tools_software),
      languages: s(raw.languages),
      roles_seeking: s(raw.roles_seeking),
      desired_salary: s(raw.desired_salary),
      currency: s(raw.currency),
      us_hours_comfortable: bool(raw.us_hours_comfortable),
      remote_experience: bool(raw.remote_experience),
      resume_url: s(raw.resume_url),
      status: 'active',
      updated_at: new Date().toISOString(),
    }

    const { data: userData, error: authError } = await db.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name, role: 'candidate' },
    })

    let candidateId = userData?.user?.id ?? null
    let isNew = true
    if (authError) {
      if (/already registered|already exists|already been registered/i.test(authError.message)) {
        const { data: existing } = await db
          .from('profiles')
          .select('id, role')
          .ilike('email', email)
          .maybeSingle<{ id: string; role: string }>()
        if (existing?.role === 'candidate') {
          candidateId = existing.id
          isNew = false
        } else {
          errors.push(`${email}: already registered as ${existing?.role ?? 'a non-candidate user'}`)
          continue
        }
      } else {
        errors.push(`${email}: ${authError.message}`)
        continue
      }
    }

    const { error: cpError } = await db.from('candidate_profiles').upsert({ id: candidateId, ...profileFields })
    if (cpError) {
      errors.push(`${email}: ${cpError.message}`)
      continue
    }
    if (isNew) created++
    else updated++
  }

  return Response.json({ created, updated, errors })
}

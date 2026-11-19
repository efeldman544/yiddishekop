import type { SupabaseClient } from '@supabase/supabase-js'

// SERVER ONLY — call with a service-role client: it creates auth users.
//
// Adding a candidate, shared by the admin's Add / Import panel and the
// assistant, so both follow the same rules.

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

// Creates a candidate the way the schema requires: an auth user first
// (candidate_profiles.id references profiles.id, and profiles is created by
// the on-signup trigger), then the candidate_profiles row. An existing
// candidate email gets its profile updated; an email belonging to another
// role is refused.
export async function upsertCandidate(
  db: SupabaseClient,
  raw: Record<string, unknown>,
): Promise<{ id: string; isNew: boolean } | { error: string }> {
  const full_name = s(raw.full_name)
  const email = s(raw.email)?.toLowerCase()
  if (!full_name || !email) return { error: `${email ?? full_name ?? 'row'}: name and email are required` }

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
        return { error: `${email}: already registered as ${existing?.role ?? 'a non-candidate user'}` }
      }
    } else {
      return { error: `${email}: ${authError.message}` }
    }
  }
  if (!candidateId) return { error: `${email}: the account could not be created` }

  const { error: cpError } = await db.from('candidate_profiles').upsert({ id: candidateId, ...profileFields })
  if (cpError) return { error: `${email}: ${cpError.message}` }
  return { id: candidateId, isNew }
}

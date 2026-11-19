import { createClient } from '@/lib/supabase/server'
import { createClient as adminSupabase } from '@supabase/supabase-js'
import { upsertCandidate } from '@/lib/candidateCreate'

export const maxDuration = 60

function adminClient() {
  return adminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
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
    const result = await upsertCandidate(db, raw)
    if ('error' in result) { errors.push(result.error); continue }
    if (result.isNew) created++
    else updated++
  }

  return Response.json({ created, updated, errors })
}

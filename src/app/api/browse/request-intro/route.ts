import { createClient } from '@/lib/supabase/server'
import { createClient as adminSupabase } from '@supabase/supabase-js'

function adminClient() {
  return adminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

// An employer asking to be introduced to someone they found on /browse.
// Notifies every admin so it lands in the existing bell — no new table, and
// the admin still controls whether the candidate is actually shared.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Please log in first', { status: 401 })

  const { data: me } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single<{ role: string; full_name: string | null; email: string | null }>()
  if (me?.role !== 'employer' && me?.role !== 'admin') {
    return new Response('Only employer accounts can request introductions', { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const candidateId = typeof body?.candidate_id === 'string' ? body.candidate_id : null
  const candidateRef = typeof body?.candidate_ref === 'string' ? body.candidate_ref : ''
  if (!candidateId) return new Response('Missing candidate', { status: 400 })

  const db = adminClient()

  const [{ data: cp }, { data: vc }] = await Promise.all([
    db.from('candidate_profiles').select('full_name').eq('id', candidateId).maybeSingle<{ full_name: string | null }>(),
    db.from('video_candidates').select('name').eq('id', candidateId).maybeSingle<{ name: string | null }>(),
  ])
  const candidateName = cp?.full_name ?? vc?.name ?? `Candidate #${candidateRef}`
  if (!cp && !vc) return new Response('Candidate not found', { status: 404 })

  const who = me.full_name ?? me.email ?? 'An employer'

  const { data: admins } = await db.from('profiles').select('id').eq('role', 'admin')
  if (admins?.length) {
    await db.from('notifications').insert(
      admins.map((a: { id: string }) => ({
        user_id: a.id,
        type: 'intro_request',
        message: `${who} requested an introduction to ${candidateName}`,
        candidate_id: cp ? candidateId : null,
        read: false,
      }))
    )
  }

  return Response.json({ ok: true })
}

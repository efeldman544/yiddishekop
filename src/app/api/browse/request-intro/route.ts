import { createClient } from '@/lib/supabase/server'
import { createClient as adminSupabase } from '@supabase/supabase-js'
import { displayName } from '@/lib/candidateDisplay'

function adminClient() {
  return adminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

// An employer asking to be introduced to someone they found on /browse.
// Recorded in introduction_requests (the admin queue) AND sent to the
// notification bell — the record is the durable part, the bell is the nudge.
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
  if (!cp && !vc) return new Response('Candidate not found', { status: 404 })

  const candidateName =
    displayName(cp?.full_name ?? vc?.name) ?? `Candidate #${candidateRef}`
  const who = me.full_name ?? me.email ?? 'An employer'

  // Durable queue entry. Tolerated if the migration hasn't been run yet —
  // the notification below still gets through, so the request is never lost.
  let recorded = true
  const { error: insertError } = await db.from('introduction_requests').insert({
    employer_id: user.id,
    candidate_id: cp ? candidateId : null,
    candidate_name: candidateName,
    candidate_ref: candidateRef || null,
    status: 'new',
  })
  if (insertError) {
    recorded = false
    console.error('introduction_requests insert failed:', insertError.message)
  }

  const { data: admins } = await db.from('profiles').select('id').eq('role', 'admin')
  if (admins?.length) {
    const { error: notifyError } = await db.from('notifications').insert(
      admins.map((a: { id: string }) => ({
        user_id: a.id,
        type: 'intro_request',
        message: `${who} requested an introduction to ${candidateName}`,
        candidate_id: cp ? candidateId : null,
        read: false,
      }))
    )
    if (notifyError) {
      console.error('intro notification failed:', notifyError.message)
      // If neither the queue nor the bell captured it, tell the employer
      // rather than showing a false success.
      if (!recorded) {
        return new Response('Could not record that request — please call us instead.', { status: 500 })
      }
    }
  }

  return Response.json({ ok: true, recorded })
}

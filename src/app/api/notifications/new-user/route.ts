import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notify, adminIds } from '@/lib/notify'

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/**
 * Tell the admins that someone new has arrived.
 *
 * Signups happen client-side through supabase-js, so nothing on the server saw
 * them and nobody was told — a new candidate or employer could sit in the
 * database for days unnoticed. This is called once by the person who just
 * signed up, and once more when a candidate first fills in their profile,
 * which is the point the record becomes worth looking at.
 *
 * It notifies about the caller and nobody else: the id comes from their own
 * session, never from the request body.
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await req.json().catch(() => null)
  const event: 'signup' | 'profile' = body?.event === 'profile' ? 'profile' : 'signup'
  const type = event === 'profile' ? 'profile_completed' : 'new_signup'

  const db = adminClient()

  // Signing up writes the profile from the browser, so this can arrive before
  // that write lands. Read through the service role and fall back to the auth
  // metadata rather than announcing "undefined".
  const { data: profile } = await db
    .from('profiles').select('full_name, email, role').eq('id', user.id)
    .maybeSingle<{ full_name: string | null; email: string | null; role: string | null }>()

  const meta = user.user_metadata ?? {}
  const name = profile?.full_name ?? (meta.full_name as string | undefined) ?? profile?.email ?? user.email ?? 'Someone'
  const email = profile?.email ?? user.email ?? ''
  const role = profile?.role ?? (meta.role as string | undefined) ?? 'candidate'

  const message = event === 'profile'
    ? `${name} completed their candidate profile`
    : `New ${role === 'employer' ? 'employer' : 'candidate'} account: ${name}${email ? ` (${email})` : ''}`

  // Saving the profile page again shouldn't re-announce them, and a double
  // submit shouldn't either. Candidates are keyed by candidate_id; employers
  // have none stored (see below), so they are keyed by the message, which
  // carries their email.
  let existing = db.from('notifications').select('id').eq('type', type)
  existing = role === 'candidate'
    ? existing.eq('candidate_id', user.id)
    : existing.eq('message', message)
  const { data: already } = await existing.limit(1)
  if (already?.length) return Response.json({ ok: true, duplicate: true })

  const admins = await adminIds(db)
  const result = await notify(db, admins.map(id => ({
    user_id: id,
    type,
    // Only a candidate has a page for the bell to open; pointing an admin at
    // /candidates/<employer id> would land on a missing record.
    candidate_id: role === 'candidate' ? user.id : null,
    message,
  })))

  return Response.json({ ok: true, notified: result.ok, error: result.error })
}

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notify } from '@/lib/notify'
import { displayName } from '@/lib/candidateDisplay'

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/**
 * Tell an employer a candidate has been put in front of them.
 *
 * Candidates reach an employer two ways and only one of them used to notify:
 * via a job (`job_id`) or assigned directly by an admin on the candidate page
 * or the intros queue (`employer_id`). Both are accepted here so neither is
 * silent.
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Only admins assign candidates, and this route can write to anyone's bell,
  // so it must not be callable by every logged-in account.
  const { data: me } = await supabase
    .from('profiles').select('role').eq('id', user.id).single<{ role: string }>()
  if (me?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const body = await req.json().catch(() => null)
  const candidate_id = typeof body?.candidate_id === 'string' ? body.candidate_id : null
  const job_id = typeof body?.job_id === 'string' ? body.job_id : null
  const employerFromBody = typeof body?.employer_id === 'string' ? body.employer_id : null
  if (!candidate_id) return new Response('candidate_id required', { status: 400 })
  if (!job_id && !employerFromBody) {
    return new Response('job_id or employer_id required', { status: 400 })
  }

  const admin = adminClient()

  let employerId = employerFromBody
  let jobTitle: string | null = null
  if (job_id) {
    const { data: job } = await admin
      .from('job_requirements').select('employer_id, job_title').eq('id', job_id)
      .maybeSingle<{ employer_id: string | null; job_title: string | null }>()
    if (!job?.employer_id) return new Response('Job not found', { status: 404 })
    employerId = job.employer_id
    jobTitle = job.job_title
  }
  if (!employerId) return new Response('No employer to notify', { status: 404 })

  // A browse candidate may be a video candidate, which lives in its own table.
  const [{ data: profile }, { data: video }] = await Promise.all([
    admin.from('candidate_profiles').select('full_name').eq('id', candidate_id)
      .maybeSingle<{ full_name: string | null }>(),
    admin.from('video_candidates').select('name').eq('id', candidate_id)
      .maybeSingle<{ name: string | null }>(),
  ])
  const candidateName = displayName(profile?.full_name ?? video?.name) ?? 'A candidate'

  const message = jobTitle
    ? `${candidateName} has been matched to your ${jobTitle} role`
    : `${candidateName} has been shared with you — take a look and tell us if you'd like to meet`

  const result = await notify(admin, [
    { user_id: employerId, type: 'candidate_assigned', message, candidate_id },
  ])

  // The assignment itself already happened; this only reports whether the
  // employer was actually told, so the admin can see when it wasn't.
  return Response.json({ ok: true, notified: result.ok, error: result.error })
}

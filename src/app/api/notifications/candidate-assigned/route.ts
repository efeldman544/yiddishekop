import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { candidate_id, job_id } = await req.json()
  if (!candidate_id || !job_id) return new Response('candidate_id and job_id required', { status: 400 })

  const admin = adminClient()

  const [{ data: job }, { data: candidate }] = await Promise.all([
    admin.from('job_requirements').select('employer_id, job_title').eq('id', job_id).single(),
    admin.from('candidate_profiles').select('full_name').eq('id', candidate_id).single(),
  ])

  if (!job?.employer_id) return new Response('Job not found', { status: 404 })

  const candidateName = candidate?.full_name ?? 'A candidate'
  const jobTitle = job.job_title ?? 'your role'

  await admin.from('notifications').insert({
    user_id: job.employer_id,
    type: 'candidate_assigned',
    message: `${candidateName} has been matched to your ${jobTitle} role`,
    candidate_id,
    read: false,
  })

  return new Response('OK', { status: 200 })
}

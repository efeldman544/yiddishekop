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

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const { assignment_id, candidate_id, employer_id, scheduled_at, meeting_link, notes } = await req.json()
  if (!assignment_id || !candidate_id || !employer_id || !scheduled_at) {
    return new Response('Missing required fields', { status: 400 })
  }

  const admin = adminClient()

  const { data: meeting, error } = await admin
    .from('meeting_requests')
    .insert({ assignment_id, candidate_id, employer_id, scheduled_at, meeting_link: meeting_link || null, notes: notes || null, status: 'scheduled' })
    .select()
    .single()

  if (error) return new Response(error.message, { status: 500 })

  const [{ data: candidate }, { data: employer }] = await Promise.all([
    admin.from('candidate_profiles').select('full_name').eq('id', candidate_id).single(),
    admin.from('profiles').select('full_name').eq('id', employer_id).single(),
  ])

  const candidateName = candidate?.full_name ?? 'the candidate'
  const employerName = employer?.full_name ?? 'the employer'
  const dateStr = new Date(scheduled_at).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })

  await admin.from('notifications').insert([
    {
      user_id: employer_id,
      type: 'meeting_scheduled',
      message: `Your meeting with ${candidateName} is scheduled for ${dateStr}.`,
      candidate_id,
      read: false,
    },
    {
      user_id: candidate_id,
      type: 'meeting_scheduled',
      message: `A meeting has been scheduled for you on ${dateStr}.`,
      candidate_id,
      read: false,
    },
  ])

  return Response.json({ id: meeting.id })
}

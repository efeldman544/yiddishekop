import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function getZoomToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString('base64')
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    { method: 'POST', headers: { Authorization: `Basic ${credentials}` } }
  )
  const data = await res.json()
  return data.access_token
}

async function createZoomMeeting(topic: string, startTime: string): Promise<string | null> {
  try {
    const token = await getZoomToken()
    const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        type: 2,
        start_time: startTime,
        duration: 45,
        settings: { host_video: true, participant_video: true, join_before_host: true, waiting_room: false },
      }),
    })
    const data = await res.json()
    return data.join_url ?? null
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const { assignment_id, candidate_id, employer_id, scheduled_at, notes } = await req.json()
  if (!assignment_id || !candidate_id || !employer_id || !scheduled_at) {
    return new Response('Missing required fields', { status: 400 })
  }

  const admin = adminClient()

  const [{ data: candidateForTopic }, { data: employerForTopic }] = await Promise.all([
    admin.from('candidate_profiles').select('full_name').eq('id', candidate_id).single(),
    admin.from('profiles').select('full_name').eq('id', employer_id).single(),
  ])

  const topic = `Interview: ${employerForTopic?.full_name ?? 'Employer'} + ${candidateForTopic?.full_name ?? 'Candidate'}`
  const meeting_link = await createZoomMeeting(topic, new Date(scheduled_at).toISOString())

  const { data: meeting, error } = await admin
    .from('meeting_requests')
    .insert({ assignment_id, candidate_id, employer_id, scheduled_at, meeting_link, notes: notes || null, status: 'scheduled' })
    .select()
    .single()

  if (error) return new Response(error.message, { status: 500 })

  const candidateName = candidateForTopic?.full_name ?? 'the candidate'
  const employerName = employerForTopic?.full_name ?? 'the employer'
  const dateStr = new Date(scheduled_at).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })

  const { data: admins } = await admin.from('profiles').select('id').eq('role', 'admin')

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
    ...(admins ?? []).map((a: { id: string }) => ({
      user_id: a.id,
      type: 'meeting_scheduled',
      message: `Meeting confirmed: ${employerName} + ${candidateName} on ${dateStr}`,
      candidate_id,
      read: false,
    })),
  ])

  return Response.json({ id: meeting.id })
}

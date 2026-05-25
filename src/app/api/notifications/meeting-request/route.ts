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

  const { candidate_id } = await req.json()
  if (!candidate_id) return new Response('candidate_id required', { status: 400 })

  const admin = adminClient()

  const [{ data: employer }, { data: candidate }, { data: admins }] = await Promise.all([
    admin.from('profiles').select('full_name').eq('id', user.id).single(),
    admin.from('candidate_profiles').select('full_name').eq('id', candidate_id).single(),
    admin.from('profiles').select('id').eq('role', 'admin'),
  ])

  if (!admins?.length) return new Response('OK', { status: 200 })

  const employerName = employer?.full_name ?? 'An employer'
  const candidateName = candidate?.full_name ?? 'a candidate'

  await admin.from('notifications').insert(
    admins.map((a: { id: string }) => ({
      user_id: a.id,
      type: 'meeting_request',
      message: `${employerName} wants to meet ${candidateName}`,
      candidate_id,
      read: false,
    }))
  )

  return new Response('OK', { status: 200 })
}

import { createClient } from '@/lib/supabase/server'
import { createClient as adminSupabase } from '@supabase/supabase-js'
import { aiMatchNamesToCandidates } from '@/lib/aiNameMatch'

function adminClient() {
  return adminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: Request) {
  // Auth — admin only
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: string }>()
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const { videoCandidates } = await req.json()
  if (!Array.isArray(videoCandidates) || videoCandidates.length === 0) {
    return new Response('Missing videoCandidates', { status: 400 })
  }

  const db = adminClient()
  const { data: profiles } = await db.from('candidate_profiles').select('id, full_name').order('full_name')

  const results = await aiMatchNamesToCandidates(
    videoCandidates as { id: string; name: string }[],
    (profiles ?? []) as { id: string; full_name: string | null }[],
  )

  return Response.json({ results })
}

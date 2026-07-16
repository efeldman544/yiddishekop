import { createClient } from '@/lib/supabase/server'
import { createClient as adminSupabase } from '@supabase/supabase-js'
import { aiMatchNamesToCandidates } from '@/lib/aiNameMatch'

export const maxDuration = 60

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
  if (videoCandidates.length > 25) {
    return new Response('Max 25 entries per request — send in chunks', { status: 400 })
  }

  try {
    const db = adminClient()
    const { data: profiles } = await db.from('candidate_profiles').select('id, full_name').order('full_name')

    const results = await aiMatchNamesToCandidates(
      videoCandidates as { id: string; name: string }[],
      (profiles ?? []) as { id: string; full_name: string | null }[],
    )

    return Response.json({ results })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'AI matching failed'
    console.error('ai-name-match error:', msg)
    return new Response(msg, { status: 500 })
  }
}

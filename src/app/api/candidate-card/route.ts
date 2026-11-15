import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as adminSupabase } from '@supabase/supabase-js'
import { buildCard } from '@/lib/candidateCard'

export const maxDuration = 60

function adminClient() {
  return adminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/**
 * Rebuild the caller's own candidate card after they save their profile.
 *
 * This is the one place a card is built without an admin asking for it, and
 * it is reachable by anybody with a candidate account, so it is fenced:
 *
 * It rebuilds the caller and nobody else — the id comes from their session,
 * never from the request. It will not rebuild the same card twice within a
 * minute however often it is called, because each build costs money. And it
 * does nothing for a profile with nothing in it.
 *
 * The work happens after the response is sent. Saving a profile shouldn't
 * wait on a model reading a resume, and a failure here must not look like a
 * failed save — the card is simply picked up as out of date the next time an
 * admin opens Matching.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle<{ role: string }>()
  if (profile?.role !== 'candidate') return new Response('Forbidden', { status: 403 })

  if (process.env.ANTHROPIC_API_KEY) {
    const userId = user.id
    after(async () => {
      try {
        await buildCard(adminClient(), userId, 'profile', {
          // Forced, because a resume replaced under the same filename keeps
          // its address and would otherwise look unchanged.
          force: true,
          minIntervalMs: 60_000,
          requireFilledIn: true,
        })
      } catch (e) {
        console.error(`card rebuild failed for ${userId}:`, e instanceof Error ? e.message : e)
      }
    })
  }

  return Response.json({ ok: true })
}

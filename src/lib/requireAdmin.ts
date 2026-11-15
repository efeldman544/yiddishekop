import { createClient } from '@/lib/supabase/server'

/**
 * A Response to return when the caller isn't an admin, or null when they are.
 *
 * For routes that cost money or expose data on behalf of whoever calls them.
 * Being signed in is not enough for those: a candidate account is signed in.
 */
export async function refuseUnlessAdmin(): Promise<Response | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle<{ role: string }>()
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })
  return null
}

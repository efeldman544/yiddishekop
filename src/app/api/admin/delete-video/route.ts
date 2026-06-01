import { createClient } from '@/lib/supabase/server'
import { createClient as adminSupabase } from '@supabase/supabase-js'
import Mux from '@mux/mux-node'

const mux = new Mux({ tokenId: process.env.MUX_TOKEN_ID!, tokenSecret: process.env.MUX_TOKEN_SECRET! })

function db() {
  return adminSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: string }>()
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const { id, table } = await req.json() as { id: string; table: 'videos' | 'video_candidates' }
  if (!id || !table) return new Response('Missing id or table', { status: 400 })

  const client = db()

  // Get mux_asset_id before deleting
  const { data: row } = await client.from(table).select('mux_asset_id').eq('id', id).single()

  const { error } = await client.from(table).delete().eq('id', id)
  if (error) return new Response(error.message, { status: 500 })

  // Clean up Mux asset if present
  if (row?.mux_asset_id) {
    try { await mux.video.assets.delete(row.mux_asset_id) } catch {}
  }

  return new Response('OK', { status: 200 })
}

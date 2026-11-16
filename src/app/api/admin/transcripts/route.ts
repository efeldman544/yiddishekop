import Mux from '@mux/mux-node'
import { createClient as adminSupabase } from '@supabase/supabase-js'
import { refuseUnlessAdmin } from '@/lib/requireAdmin'
import { syncTranscript, videosWithoutTranscript, type SyncResult, type VideoRef } from '@/lib/muxTranscripts'

export const maxDuration = 60

// Transcripts from Mux, for the admin:
//
//   status  which videos have no transcript yet
//   sync    for a few videos, do the next thing: ask Mux for captions, or save
//           the ones that have finished
//
// The admin screen drives sync a few videos at a time. They are handled one
// after another inside a request, not all at once, because Mux limits how
// fast its API may be called.

function adminClient() {
  return adminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(req: Request) {
  const refused = await refuseUnlessAdmin()
  if (refused) return refused

  const body = await req.json().catch(() => null)
  const stage: string = body?.stage ?? 'status'
  const db = adminClient()

  try {
    if (stage === 'status') {
      const missing = await videosWithoutTranscript(db)
      return Response.json({ missing })
    }

    if (stage === 'sync') {
      if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
        return new Response('The Mux API keys are not set in the environment variables.', { status: 500 })
      }
      const items: VideoRef[] = (Array.isArray(body.items) ? body.items : [])
        .filter((i: { table?: unknown; id?: unknown }) =>
          typeof i?.id === 'string' && (i.table === 'videos' || i.table === 'video_candidates'))
        .map((i: VideoRef) => ({ table: i.table, id: i.id }))
      if (items.length === 0) return new Response('Missing items', { status: 400 })
      if (items.length > 5) return new Response('Too many items in one request', { status: 400 })

      const mux = new Mux({ tokenId: process.env.MUX_TOKEN_ID, tokenSecret: process.env.MUX_TOKEN_SECRET })
      const request = body.request === true
      const results: (VideoRef & SyncResult)[] = []
      for (const item of items) {
        let result: SyncResult
        try {
          result = await syncTranscript(mux, db, item, { request })
        } catch (e) {
          result = { status: 'failed', reason: e instanceof Error ? e.message : 'Something went wrong' }
        }
        results.push({ ...item, ...result })
      }
      return Response.json({ results })
    }

    return new Response(`Unknown stage: ${stage}`, { status: 400 })
  } catch (e) {
    console.error('transcripts failed:', e)
    return new Response(e instanceof Error ? e.message : 'Something went wrong', { status: 500 })
  }
}

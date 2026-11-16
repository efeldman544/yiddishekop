import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { signPlaybackToken } from '@/lib/muxToken'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const playbackId = searchParams.get('playbackId')
  if (!playbackId) return new Response('Missing playbackId', { status: 400 })

  const token = signPlaybackToken(playbackId)
  if (!token) return new Response('Signing keys not configured', { status: 500 })

  return NextResponse.json({ token })
}

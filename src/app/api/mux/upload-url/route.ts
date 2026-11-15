import { NextResponse } from 'next/server'
import Mux from '@mux/mux-node'
import { refuseUnlessAdmin } from '@/lib/requireAdmin'

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

export async function POST() {
  // Each call opens a billable upload on the Mux account. Only admins upload
  // video, and this used to answer anybody who was signed in.
  const refused = await refuseUnlessAdmin()
  if (refused) return refused

  const upload = await mux.video.uploads.create({
    cors_origin: '*',
    new_asset_settings: {
      playback_policy: ['signed'],
    },
  })
  return NextResponse.json({ uploadId: upload.id, url: upload.url })
}

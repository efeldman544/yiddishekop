import { NextResponse } from 'next/server'
import Mux from '@mux/mux-node'
import { refuseUnlessAdmin } from '@/lib/requireAdmin'
import { GENERATED_SUBTITLES } from '@/lib/muxTranscripts'

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

export async function POST() {
  // Each call opens a billable upload on the Mux account. Only admins upload
  // video, and this used to answer anybody who was signed in.
  const refused = await refuseUnlessAdmin()
  if (refused) return refused

  // Ask Mux to transcribe the video as part of processing it, so a transcript
  // exists without anybody making one and uploading it separately.
  //
  // If Mux turns the request down with captions on it, the upload is opened
  // without them rather than failing: a video with no transcript is a small
  // loss, and captions can still be asked for afterwards. A video that can't
  // be uploaded at all is not.
  let upload
  try {
    upload = await mux.video.uploads.create({
      cors_origin: '*',
      new_asset_settings: {
        playback_policy: ['signed'],
        inputs: [{ generated_subtitles: GENERATED_SUBTITLES }],
      },
    })
  } catch (e) {
    const status = (e as { status?: number })?.status
    if (status !== 400 && status !== 422) throw e
    console.error('Mux refused an upload with captions requested; opening one without:', e)
    upload = await mux.video.uploads.create({
      cors_origin: '*',
      new_asset_settings: { playback_policy: ['signed'] },
    })
  }
  return NextResponse.json({ uploadId: upload.id, url: upload.url })
}

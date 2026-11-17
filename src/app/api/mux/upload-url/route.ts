import { NextResponse } from 'next/server'
import Mux from '@mux/mux-node'
import { refuseUnlessAdmin } from '@/lib/requireAdmin'
import { openUpload } from '@/lib/muxOpenUpload'

export async function POST() {
  try {
    // Each call opens a billable upload on the Mux account. Only admins upload
    // video, and this used to answer anybody who was signed in.
    const refused = await refuseUnlessAdmin()
    if (refused) return refused

    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      return new Response('The Mux API keys are not set in the environment variables.', { status: 500 })
    }
    const mux = new Mux({ tokenId: process.env.MUX_TOKEN_ID, tokenSecret: process.env.MUX_TOKEN_SECRET })

    const upload = await openUpload(mux)
    if (upload.captionError) {
      // The upload is open; only the captions were turned down. Recorded so
      // the reason can be found, since nothing on screen will show it.
      console.error(`Mux upload opened ${upload.captions ? 'with' : 'WITHOUT'} captions; first refusal: ${upload.captionError}`)
    }
    return NextResponse.json({ uploadId: upload.id, url: upload.url, captions: upload.captions })
  } catch (e) {
    // Say what went wrong. A bare 500 reaches the admin as "check the Mux API
    // keys", which is a guess, and was the wrong one.
    console.error('could not open a Mux upload:', e)
    return new Response(e instanceof Error ? e.message : 'Could not open an upload', { status: 502 })
  }
}

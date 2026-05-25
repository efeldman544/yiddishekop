import { NextResponse } from 'next/server'
import Mux from '@mux/mux-node'

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

export async function GET(_: Request, { params }: { params: Promise<{ uploadId: string }> }) {
  const { uploadId } = await params
  const upload = await mux.video.uploads.retrieve(uploadId)

  if (!upload.asset_id) {
    return NextResponse.json({ status: 'waiting' })
  }

  const asset = await mux.video.assets.retrieve(upload.asset_id)
  return NextResponse.json({
    status: asset.status,
    assetId: asset.id,
    playbackId: asset.playback_ids?.[0]?.id ?? null,
  })
}

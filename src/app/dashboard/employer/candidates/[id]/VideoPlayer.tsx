'use client'

import { useState, useEffect } from 'react'
import MuxPlayer from '@mux/mux-player-react'

export default function VideoPlayer({
  muxPlaybackId,
  url,
}: {
  muxPlaybackId: string | null
  url: string | null
}) {
  const [videoLoading, setVideoLoading] = useState(true)
  const [muxToken, setMuxToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(!!muxPlaybackId)

  useEffect(() => {
    if (!muxPlaybackId) { setTokenLoading(false); return }
    fetch(`/api/mux/token?playbackId=${muxPlaybackId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setMuxToken(d?.token ?? null))
      .finally(() => setTokenLoading(false))
  }, [muxPlaybackId])

  const showSkeleton = videoLoading || tokenLoading

  return (
    <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
      {showSkeleton && (
        <div style={{ position: 'absolute', inset: 0 }} className="bg-muted rounded-lg animate-pulse" />
      )}
      <div style={{ position: 'absolute', inset: 0 }}>
        {muxPlaybackId && !tokenLoading ? (
          <MuxPlayer
            playbackId={muxPlaybackId}
            tokens={muxToken ? { playback: muxToken } : undefined}
            className="w-full h-full rounded-lg"
            onLoadedData={() => setVideoLoading(false)}
          />
        ) : !muxPlaybackId && url ? (
          <video
            src={url}
            controls
            width="100%"
            height="100%"
            className="w-full h-full rounded-lg"
            onLoadedData={() => setVideoLoading(false)}
          />
        ) : null}
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import MuxPlayer from '@mux/mux-player-react'
import { createClient } from '@/lib/supabase/client'
import { uploadVideoToMux } from '@/lib/muxUpload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export type Video = {
  id: string
  mux_playback_id: string | null
  mux_asset_id: string | null
  url: string | null
  transcript: string | null
  created_at: string
}

export default function VideoSection({
  candidateId,
  initialVideo,
}: {
  candidateId: string
  initialVideo: Video | null
}) {
  const [video, setVideo] = useState<Video | null>(initialVideo)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [videoStatus, setVideoStatus] = useState<string | null>(null)
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null)
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const [muxToken, setMuxToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const videoFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const playbackId = video?.mux_playback_id
    if (!playbackId) { setMuxToken(null); return }
    setTokenLoading(true)
    fetch(`/api/mux/token?playbackId=${playbackId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setMuxToken(d?.token ?? null))
      .finally(() => setTokenLoading(false))
  }, [video?.mux_playback_id])

  async function handleVideoUpload(file: File) {
    setUploadingVideo(true); setVideoUploadError(null); setVideoStatus('Starting…')
    try {
      const { assetId, playbackId } = await uploadVideoToMux(file, setVideoStatus)
      setVideoStatus('Saving…')
      const supabase = createClient()
      if (video?.id) {
        const { error } = await supabase.from('videos').update({ mux_playback_id: playbackId, mux_asset_id: assetId }).eq('id', video.id)
        if (error) throw new Error('DB update failed: ' + error.message)
        setVideo({ ...video, mux_playback_id: playbackId, mux_asset_id: assetId })
      } else {
        const { data, error } = await supabase.from('videos').insert({ candidate_id: candidateId, mux_playback_id: playbackId, mux_asset_id: assetId }).select('id').single()
        if (error) throw new Error('DB insert failed: ' + error.message)
        setVideo({ id: data?.id ?? '', mux_playback_id: playbackId, mux_asset_id: assetId, url: null, transcript: null, created_at: new Date().toISOString() })
      }
    } catch (e) {
      setVideoUploadError(e instanceof Error ? e.message : 'Upload failed — please try again')
    } finally {
      setUploadingVideo(false); setVideoStatus(null)
    }
  }

  const hasVideo = video?.mux_playback_id || video?.url

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Screening video</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => videoFileRef.current?.click()} disabled={uploadingVideo}>
            {videoStatus ?? (hasVideo ? 'Replace video' : 'Upload video')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {video?.mux_playback_id ? (
          <>
            <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
              <div style={{ position: 'absolute', inset: 0 }}>
                {tokenLoading ? (
                  <div className="w-full h-full rounded-lg bg-muted animate-pulse" />
                ) : (
                  <MuxPlayer
                    playbackId={video.mux_playback_id}
                    tokens={muxToken ? { playback: muxToken } : undefined}
                    className="w-full h-full rounded-lg"
                  />
                )}
              </div>
            </div>
            {video.transcript && (
              <div className="mt-4">
                <Button variant="ghost" size="sm" onClick={() => setTranscriptOpen(o => !o)} className="text-primary px-0">
                  {transcriptOpen ? 'Hide transcript' : 'Show AI transcript'}
                </Button>
                {transcriptOpen && (
                  <div className="mt-3 p-4 bg-muted rounded-lg border border-border text-sm whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                    {video.transcript}
                  </div>
                )}
              </div>
            )}
          </>
        ) : video?.url ? (
          <>
            <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
              <div style={{ position: 'absolute', inset: 0 }}>
                <video src={video.url} controls width="100%" height="100%" className="w-full h-full rounded-lg" />
              </div>
            </div>
            {video.transcript && (
              <div className="mt-4">
                <Button variant="ghost" size="sm" onClick={() => setTranscriptOpen(o => !o)} className="text-primary px-0">
                  {transcriptOpen ? 'Hide transcript' : 'Show AI transcript'}
                </Button>
                {transcriptOpen && (
                  <div className="mt-3 p-4 bg-muted rounded-lg border border-border text-sm whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                    {video.transcript}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div
            onClick={() => !uploadingVideo && videoFileRef.current?.click()}
            className={`border-2 border-dashed border-border rounded-lg px-6 py-10 text-center transition-colors ${uploadingVideo ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-ring'}`}
          >
            {videoStatus === 'uploading' ? (
              <p className="text-sm text-muted-foreground">Uploading to Mux…</p>
            ) : videoStatus === 'processing' ? (
              <p className="text-sm text-muted-foreground">Processing video, this may take a minute…</p>
            ) : (
              <>
                <p className="text-sm font-medium">Click to upload screening video</p>
                <p className="text-xs text-muted-foreground mt-1">MP4, MOV, or WebM</p>
              </>
            )}
          </div>
        )}
        {videoUploadError && <p className="mt-2 text-xs text-destructive">{videoUploadError}</p>}
        <input ref={videoFileRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/*" className="hidden"
          onChange={e => { const file = e.target.files?.[0]; if (file) handleVideoUpload(file); e.target.value = '' }} />
      </CardContent>
    </Card>
  )
}

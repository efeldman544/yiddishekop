'use client'

import { useState, useRef, useEffect } from 'react'
import MuxPlayer from '@mux/mux-player-react'
import { createClient } from '@/lib/supabase/client'
import { uploadVideoToMux } from '@/lib/muxUpload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { humanError } from '@/lib/errorMessage'
import ErrorNote from '@/components/ErrorNote'

// How many times to remount the player when it reports an error, and how long
// to wait between tries.
const PLAYER_RETRIES = 3
const PLAYER_RETRY_MS = 2500
// How often, and how many times, to look for a transcript Mux is still making.
const TRANSCRIPT_CHECK_MS = 30_000
const TRANSCRIPT_CHECKS = 20

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
  const [videoNote, setVideoNote] = useState<string | null>(null)
  const [transcriptNote, setTranscriptNote] = useState<string | null>(null)
  // The token, and which video it is for. Playback here is signed, so the
  // player must never be mounted without a token for the video it is showing.
  // It used to be: the token was fetched in an effect, which runs after the
  // first render, so every newly shown video was first handed to the player
  // with no token (or, after Replace, with the previous video's), was refused,
  // and put the player's own error on screen.
  const [token, setToken] = useState<{ playbackId: string; value: string } | null>(null)
  const [tokenFailedFor, setTokenFailedFor] = useState<string | null>(null)
  const [tokenAttempt, setTokenAttempt] = useState(0)
  const [playerTry, setPlayerTry] = useState<{ playbackId: string; n: number }>({ playbackId: '', n: 0 })
  const videoFileRef = useRef<HTMLInputElement>(null)
  // Which video has got as far as loading, so a later error isn't treated as a failed start.
  const loadedRef = useRef<string | null>(null)

  const playbackId = video?.mux_playback_id ?? null
  const tokenReady = !!playbackId && token?.playbackId === playbackId
  const tokenFailed = !!playbackId && tokenFailedFor === playbackId
  const tries = playerTry.playbackId === playbackId ? playerTry.n : 0

  useEffect(() => {
    if (!playbackId) return
    let cancelled = false
    fetch(`/api/mux/token?playbackId=${playbackId}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(d => {
        if (cancelled) return
        if (d?.token) setToken({ playbackId, value: d.token })
        else setTokenFailedFor(playbackId)
      })
      .catch(() => { if (!cancelled) setTokenFailedFor(playbackId) })
    return () => { cancelled = true }
  }, [playbackId, tokenAttempt])

  // A video with no transcript gets one from Mux. Looking is what asks for it,
  // if nobody has yet, and then this keeps checking while the page is open —
  // Mux takes a few minutes — and shows the transcript when it lands.
  const videoId = video?.id ?? null
  const needsTranscript = !!videoId && !!video?.mux_asset_id && !video?.transcript
  useEffect(() => {
    if (!videoId || !needsTranscript) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let checks = 0
    const check = () => {
      fetch('/api/admin/transcripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'sync', request: true, items: [{ table: 'videos', id: videoId }] }),
      })
        .then(r => (r.ok ? r.json() : null))
        .then(d => {
          if (cancelled) return
          const result = d?.results?.[0] as { status?: string; transcript?: string; reason?: string } | undefined
          if (result?.status === 'saved' && result.transcript) {
            const text = result.transcript
            setVideo(v => (v && v.id === videoId ? { ...v, transcript: text } : v))
            setTranscriptNote(null)
          } else if (result?.status === 'requested' || result?.status === 'pending') {
            setTranscriptNote('Mux is transcribing this video. The transcript will appear here in a few minutes.')
            if (++checks < TRANSCRIPT_CHECKS) timer = setTimeout(check, TRANSCRIPT_CHECK_MS)
          } else if (result?.status === 'failed') {
            setTranscriptNote(`No transcript: ${result.reason ?? 'Mux could not make one'}.`)
          }
        })
        .catch(() => { /* the transcript is picked up on a later visit */ })
    }
    check()
    return () => { cancelled = true; if (timer) clearTimeout(timer) }
  }, [videoId, needsTranscript])

  // A video that has only just finished processing can refuse its first
  // request, and the player doesn't try again by itself: it shows an error
  // that stays until the page is reloaded, by which time the video plays. So
  // an error remounts the player a few times before it is allowed to stand.
  //
  // Only while it has never managed to load, though. Once a video has started,
  // an error is a hiccup the player recovers from by itself, and remounting
  // would throw the admin back to the beginning of an interview they were
  // half-way through watching.
  function handlePlayerError(event?: Event) {
    if (!playbackId || tries >= PLAYER_RETRIES) return
    if (loadedRef.current === playbackId) return
    if ((event as CustomEvent<{ fatal?: boolean }> | undefined)?.detail?.fatal === false) return
    const id = playbackId
    const next = tries + 1
    setTimeout(() => setPlayerTry({ playbackId: id, n: next }), PLAYER_RETRY_MS)
  }

  async function handleVideoUpload(file: File) {
    setUploadingVideo(true); setVideoUploadError(null); setVideoNote(null); setVideoStatus('Starting…')
    try {
      const { assetId, playbackId, ready } = await uploadVideoToMux(file, setVideoStatus)
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
      if (!ready) {
        setVideoNote('Saved. Mux is still processing this video, so it will start playing here in a few minutes.')
      }
    } catch (e) {
      setVideoUploadError(e instanceof Error && e.name === 'UploadError' ? e.message : humanError(e, 'Couldn’t upload that video. Try again.'))
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
                {tokenFailed ? (
                  <div className="w-full h-full rounded-lg bg-muted flex flex-col items-center justify-center gap-2 text-center px-6">
                    <p className="text-sm text-muted-foreground">The video is saved, but the player couldn&rsquo;t be authorised.</p>
                    <Button variant="outline" size="sm"
                      onClick={() => { setTokenFailedFor(null); setTokenAttempt(a => a + 1) }}>
                      Try again
                    </Button>
                  </div>
                ) : !tokenReady ? (
                  <div className="w-full h-full rounded-lg bg-muted animate-pulse" />
                ) : (
                  <MuxPlayer
                    key={`${video.mux_playback_id}-${tries}`}
                    playbackId={video.mux_playback_id}
                    tokens={{ playback: token!.value }}
                    onError={handlePlayerError}
                    onLoadedData={() => { loadedRef.current = video.mux_playback_id }}
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
            {uploadingVideo ? (
              <p className="text-sm text-muted-foreground">{videoStatus ?? 'Working…'} Keep this page open.</p>
            ) : (
              <>
                <p className="text-sm font-medium">Click to upload screening video</p>
                <p className="text-xs text-muted-foreground mt-1">MP4, MOV, or WebM</p>
              </>
            )}
          </div>
        )}
        {videoNote && <p className="mt-2 text-xs text-muted-foreground">{videoNote}</p>}
        {transcriptNote && needsTranscript && <p className="mt-2 text-xs text-muted-foreground">{transcriptNote}</p>}
        {videoUploadError && <ErrorNote className="mt-2">{videoUploadError}</ErrorNote>}
        <input ref={videoFileRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/*" className="hidden"
          onChange={e => { const file = e.target.files?.[0]; if (file) handleVideoUpload(file); e.target.value = '' }} />
      </CardContent>
    </Card>
  )
}

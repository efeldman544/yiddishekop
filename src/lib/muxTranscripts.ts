import type Mux from '@mux/mux-node'
import type { SupabaseClient } from '@supabase/supabase-js'
import { signPlaybackToken } from '@/lib/muxToken'

// SERVER ONLY.
//
// Transcripts from Mux, instead of a file somebody has to make and upload.
//
// Mux can turn a video's speech into captions. Asking for them, waiting for
// them and saving them is one operation here — syncTranscript — and it can be
// run on any video at any time, as often as you like: it looks at what Mux
// has, and does the next thing. Nothing about where a video has got to is
// stored on our side, so there is nothing to fall out of step.

export type VideoTable = 'videos' | 'video_candidates'
export type VideoRef = { table: VideoTable; id: string }

export type SyncResult =
  | { status: 'saved'; transcript: string }
  /** Mux is still working: on the video itself, or on its captions. */
  | { status: 'pending'; what: 'video' | 'captions' }
  /** Captions were asked for just now. */
  | { status: 'requested' }
  /** No captions exist and this call wasn't asked to request any. */
  | { status: 'none' }
  /** It already has a transcript, or has no Mux video to transcribe. */
  | { status: 'skipped'; reason: 'has-transcript' | 'no-video' }
  | { status: 'failed'; reason: string }

type MuxApi = { video: { assets: Pick<Mux['video']['assets'], 'retrieve' | 'generateSubtitles'> } }

/** English. Mux transcribes one language per video; interviews here are in English. */
const LANGUAGE = 'en' as const
const TRACK_NAME = 'English (generated)'

/** What an upload asks Mux for so that captions are made without anybody asking twice. */
export const GENERATED_SUBTITLES = [{ language_code: LANGUAGE, name: TRACK_NAME }]

/** Captions in WebVTT, reduced to the words. */
export function vttToText(vtt: string): string {
  const out: string[] = []
  for (const block of vtt.replace(/\r/g, '').split(/\n{2,}/)) {
    const lines = block.split('\n').filter(l => l.trim())
    if (lines.length === 0 || /^(WEBVTT|NOTE|STYLE|REGION)/.test(lines[0])) continue
    const at = lines.findIndex(l => l.includes('-->'))
    if (at === -1) continue
    const text = lines.slice(at + 1).join(' ').replace(/<[^>]+>/g, '').trim()
    // Rolling captions repeat the previous line; keep each once.
    if (text && text !== out[out.length - 1]) out.push(text)
  }
  return out.join(' ')
}

function tidy(text: string): string {
  return text.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * The words of a finished caption track.
 *
 * Asks for the plain-text form first and falls back to the caption file,
 * which every player already relies on, so one missing format doesn't cost
 * the transcript.
 */
async function fetchTrackText(
  playbackId: string,
  signed: boolean,
  trackId: string,
  fetcher: typeof fetch,
): Promise<{ text: string } | { error: string }> {
  let query = ''
  if (signed) {
    const token = signPlaybackToken(playbackId)
    if (!token) return { error: 'the Mux signing keys are not set, so the captions can’t be read' }
    query = `?token=${token}`
  }
  const base = `https://stream.mux.com/${playbackId}/text/${trackId}`
  let lastStatus = 0
  for (const ext of ['txt', 'vtt'] as const) {
    try {
      const res = await fetcher(`${base}.${ext}${query}`, { signal: AbortSignal.timeout(15_000) })
      lastStatus = res.status
      if (!res.ok) continue
      const body = await res.text()
      const text = tidy(ext === 'vtt' ? vttToText(body) : body)
      if (text) return { text }
    } catch {
      // try the next format
    }
  }
  return { error: lastStatus ? `Mux refused the captions (HTTP ${lastStatus})` : 'the captions could not be downloaded' }
}

function describe(err: unknown): string {
  const e = err as { status?: number; message?: string } | null
  if (e?.status === 404) return 'the video no longer exists on Mux'
  if (e?.status === 401 || e?.status === 403) return 'the Mux API keys were rejected'
  if (e?.status === 429) return 'Mux is rate limiting; try again in a minute'
  const message = typeof e?.message === 'string' ? e.message.slice(0, 200) : ''
  return message || 'Mux returned an error'
}

/**
 * Do the next thing for one video's transcript.
 *
 * Already has one: nothing. Captions ready on Mux: save them. Captions being
 * made: say so. No captions: ask for them if `request` is set.
 *
 * A transcript somebody typed or uploaded is never replaced.
 */
export async function syncTranscript(
  mux: MuxApi,
  db: SupabaseClient,
  ref: VideoRef,
  opts: { request: boolean; fetcher?: typeof fetch },
): Promise<SyncResult> {
  const { data: row, error } = await db
    .from(ref.table)
    .select('id, mux_asset_id, mux_playback_id, transcript')
    .eq('id', ref.id)
    .maybeSingle<{ id: string; mux_asset_id: string | null; mux_playback_id: string | null; transcript: string | null }>()
  if (error) return { status: 'failed', reason: error.message }
  if (!row) return { status: 'failed', reason: 'the video record no longer exists' }
  if (row.transcript?.trim()) return { status: 'skipped', reason: 'has-transcript' }
  if (!row.mux_asset_id) return { status: 'skipped', reason: 'no-video' }

  let asset: Awaited<ReturnType<MuxApi['video']['assets']['retrieve']>>
  try {
    asset = await mux.video.assets.retrieve(row.mux_asset_id)
  } catch (e) {
    return { status: 'failed', reason: describe(e) }
  }
  if (asset.status === 'errored') return { status: 'failed', reason: 'Mux could not process this video' }
  if (asset.status !== 'ready') return { status: 'pending', what: 'video' }

  const tracks = asset.tracks ?? []
  const generated = tracks.filter(t => t.type === 'text' && t.text_source === 'generated_vod')
  const ready = generated.find(t => t.status === 'ready' && t.id)

  if (ready?.id) {
    const playback = asset.playback_ids?.find(p => p.id === row.mux_playback_id) ?? asset.playback_ids?.[0]
    if (!playback?.id) return { status: 'failed', reason: 'the video has no playback id' }
    const fetched = await fetchTrackText(playback.id, playback.policy !== 'public', ready.id, opts.fetcher ?? fetch)
    if ('error' in fetched) return { status: 'failed', reason: fetched.error }

    // Only into an empty transcript. If somebody saved one while this was
    // running, theirs stands.
    const { data: saved, error: writeError } = await db
      .from(ref.table)
      .update({ transcript: fetched.text })
      .eq('id', ref.id)
      .or('transcript.is.null,transcript.eq.')
      .select('id')
    if (writeError) return { status: 'failed', reason: writeError.message }
    if (!saved || saved.length === 0) return { status: 'skipped', reason: 'has-transcript' }
    return { status: 'saved', transcript: fetched.text }
  }

  if (generated.some(t => t.status === 'preparing')) return { status: 'pending', what: 'captions' }
  if (generated.some(t => t.status === 'errored')) return { status: 'failed', reason: 'Mux could not transcribe this video' }

  if (!opts.request) return { status: 'none' }

  const audio = tracks.find(t => t.type === 'audio' && t.id && t.status !== 'errored')
  if (!audio?.id) return { status: 'failed', reason: 'the video has no sound to transcribe' }
  try {
    await mux.video.assets.generateSubtitles(row.mux_asset_id, audio.id, { generated_subtitles: GENERATED_SUBTITLES })
  } catch (e) {
    return { status: 'failed', reason: describe(e) }
  }
  return { status: 'requested' }
}

/** Every video that is on Mux and has no transcript yet. */
export async function videosWithoutTranscript(db: SupabaseClient): Promise<(VideoRef & { name: string | null })[]> {
  const out: (VideoRef & { name: string | null })[] = []
  for (const table of ['videos', 'video_candidates'] as const) {
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db
        .from(table)
        .select(table === 'videos' ? 'id, transcript' : 'id, transcript, name')
        .not('mux_asset_id', 'is', null)
        .order('id')
        .range(from, from + 999)
      if (error) throw new Error(error.message)
      for (const r of (data ?? []) as unknown as { id: string; transcript: string | null; name?: string | null }[]) {
        if (!r.transcript?.trim()) out.push({ table, id: r.id, name: r.name ?? null })
      }
      if (!data || data.length < 1000) break
    }
  }
  return out
}

/**
 * Save a finished transcript for a candidate's latest video, if there is one
 * waiting on Mux. Used before a card is built. Does nothing when the video
 * already has a transcript, has no Mux video, or the Mux keys aren't set.
 */
export async function collectTranscriptFor(
  db: SupabaseClient,
  candidateId: string,
  source: 'profile' | 'video',
  mux?: MuxApi,
): Promise<void> {
  let ref: VideoRef | null = null
  if (source === 'video') {
    ref = { table: 'video_candidates', id: candidateId }
  } else {
    const { data } = await db
      .from('videos').select('id, transcript, mux_asset_id')
      .eq('candidate_id', candidateId).order('created_at', { ascending: false }).limit(1)
    const latest = data?.[0] as { id: string; transcript: string | null; mux_asset_id: string | null } | undefined
    if (latest && latest.mux_asset_id && !latest.transcript?.trim()) ref = { table: 'videos', id: latest.id }
  }
  if (!ref) return

  let client = mux
  if (!client) {
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) return
    const { default: MuxClient } = await import('@mux/mux-node')
    client = new MuxClient({ tokenId: process.env.MUX_TOKEN_ID, tokenSecret: process.env.MUX_TOKEN_SECRET })
  }
  await syncTranscript(client, db, ref, { request: true })
}

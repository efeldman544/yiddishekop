import type Mux from '@mux/mux-node'
import { GENERATED_SUBTITLES } from '@/lib/muxTranscripts'

// SERVER ONLY.

type Uploads = { video: { uploads: Pick<Mux['video']['uploads'], 'create'> } }

const reasonOf = (e: unknown): string => {
  const err = e as { status?: number; message?: string } | null
  const message = typeof err?.message === 'string' ? err.message.slice(0, 300) : 'unknown error'
  return err?.status ? `HTTP ${err.status}: ${message}` : message
}

/**
 * Open a direct upload on Mux, asking for captions if Mux will have it.
 *
 * Captions are a nice-to-have on an upload: they can be requested again later
 * for any video. So whatever goes wrong with a request that carries them —
 * any error at all, not a list of the ones somebody thought to expect — the
 * upload is retried without them. The first version of this fell back only on
 * two status codes, Mux answered with something else, and every upload on the
 * site failed with a 500.
 *
 * Only when a plain upload, the request that has always worked, is refused as
 * well does this give up, and then it says what Mux said.
 */
export async function openUpload(
  mux: Uploads,
): Promise<{ id: string; url: string; captions: boolean; captionError: string | null }> {
  const base = { cors_origin: '*', new_asset_settings: { playback_policy: ['signed' as const] } }
  let captionError: string | null = null

  // The setting has had two names. Try the current one, then the older one.
  for (const key of ['inputs', 'input'] as const) {
    try {
      const upload = await mux.video.uploads.create({
        ...base,
        new_asset_settings: { ...base.new_asset_settings, [key]: [{ generated_subtitles: GENERATED_SUBTITLES }] },
      })
      if (upload.url) return { id: upload.id, url: upload.url, captions: true, captionError }
    } catch (e) {
      captionError ??= reasonOf(e)
    }
  }

  let upload
  try {
    upload = await mux.video.uploads.create(base)
  } catch (e) {
    throw new Error(`Mux would not open an upload (${reasonOf(e)})`)
  }
  if (!upload.url) throw new Error('Mux did not return an upload address')
  return { id: upload.id, url: upload.url, captions: false, captionError }
}

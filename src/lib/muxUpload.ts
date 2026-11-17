// Shared Mux direct-upload flow with real progress + explicit errors.
//
// The old inline versions used bare fetch() with no response checks and (in
// VideoSection) no try/catch — a network/CORS failure during the PUT threw an
// unhandled rejection and the UI sat on "Uploading…" forever with no message.

/**
 * A failure whose message was written to be shown as it is. The screens that
 * call this run other errors through a filter that hides anything looking like
 * raw database output; a message from Mux can trip that filter and be replaced
 * by a generic line, which is the opposite of what's wanted here.
 */
export class UploadError extends Error {
  name = 'UploadError'
}

export async function uploadVideoToMux(
  file: File,
  onProgress?: (label: string) => void,
): Promise<{ assetId: string; playbackId: string; ready: boolean }> {
  onProgress?.('Requesting upload URL…')
  const res = await fetch('/api/mux/upload-url', { method: 'POST' })
  if (!res.ok) {
    // Pass on what the server said. This used to tell the admin to check the
    // Mux API keys whatever the cause, which sent them looking in the wrong
    // place when the keys were fine.
    const detail = (await res.text().catch(() => '')).trim()
    throw new UploadError(
      res.status === 401 || res.status === 403
        ? 'Only an admin can upload video. Sign in again and retry.'
        : `Couldn’t start the upload. ${detail || `The server returned ${res.status}.`}`,
    )
  }
  const { uploadId, url } = await res.json()
  if (!url) throw new Error('Mux did not return an upload URL')

  await putWithProgress(url, file, pct => onProgress?.(`Uploading… ${pct}%`))

  onProgress?.('Processing…')
  // Mux names the asset and its playback id within seconds of the upload
  // finishing, long before the video is playable. Remember them as soon as
  // they appear.
  let known: { assetId: string; playbackId: string } | null = null
  // Poll until the asset is playable (~5 min budget for large files)
  for (let i = 0; i < 100; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const poll = await fetch(`/api/mux/asset/${uploadId}`)
    if (!poll.ok) continue // transient poll failure — keep waiting
    const data = await poll.json()
    if (data.status === 'errored') throw new Error('Mux could not process this video')
    if (data.assetId && data.playbackId) known = { assetId: data.assetId, playbackId: data.playbackId }
    if (data.status === 'ready' && known) return { ...known, ready: true }
  }
  // Out of patience, but not out of luck: the file is safely with Mux and
  // still being processed. This used to throw, and since the record is only
  // saved after this returns, a long interview that took more than five
  // minutes to process was uploaded in full and then thrown away — the admin
  // saw an error and had to upload the whole thing again. Hand back what is
  // known so the caller can save it; it plays once Mux finishes.
  if (known) return { ...known, ready: false }
  throw new Error('Mux did not accept the video. Try uploading it again.')
}

function putWithProgress(url: string, file: File, onPct: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onPct(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload to Mux failed (HTTP ${xhr.status})`))
    xhr.onerror = () => reject(new Error('Upload to Mux failed — network error'))
    xhr.onabort = () => reject(new Error('Upload cancelled'))
    xhr.send(file)
  })
}

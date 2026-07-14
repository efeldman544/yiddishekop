// Shared Mux direct-upload flow with real progress + explicit errors.
//
// The old inline versions used bare fetch() with no response checks and (in
// VideoSection) no try/catch — a network/CORS failure during the PUT threw an
// unhandled rejection and the UI sat on "Uploading…" forever with no message.

export async function uploadVideoToMux(
  file: File,
  onProgress?: (label: string) => void,
): Promise<{ assetId: string; playbackId: string }> {
  onProgress?.('Requesting upload URL…')
  const res = await fetch('/api/mux/upload-url', { method: 'POST' })
  if (!res.ok) throw new Error(`Could not get an upload URL (HTTP ${res.status}) — check the Mux API keys`)
  const { uploadId, url } = await res.json()
  if (!url) throw new Error('Mux did not return an upload URL')

  await putWithProgress(url, file, pct => onProgress?.(`Uploading… ${pct}%`))

  onProgress?.('Processing…')
  // Poll until the asset is playable (~5 min budget for large files)
  for (let i = 0; i < 100; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const poll = await fetch(`/api/mux/asset/${uploadId}`)
    if (!poll.ok) continue // transient poll failure — keep waiting
    const data = await poll.json()
    if (data.status === 'errored') throw new Error('Mux could not process this video')
    if (data.status === 'ready' && data.playbackId) {
      return { assetId: data.assetId, playbackId: data.playbackId }
    }
  }
  throw new Error('Timed out waiting for video processing — it may still finish; refresh in a minute')
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

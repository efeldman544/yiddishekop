'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type RowStatus = 'pending' | 'uploading' | 'processing' | 'saving' | 'done' | 'error'

type Row = {
  key: string
  name: string
  videoFile: File | null
  transcriptText: string | null
  transcriptFileName: string | null
  status: RowStatus
  error: string | null
}

function cleanName(file: File): string {
  return file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[_\-]+/g, ' ')
    .trim()
}

function normalizeKey(s: string): string {
  return s.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

async function readTextFile(file: File): Promise<string> {
  return file.text()
}

export default function BulkUploadForm({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [running, setRunning] = useState(false)
  const videoRef = useRef<HTMLInputElement>(null)
  const transcriptRef = useRef<HTMLInputElement>(null)

  function updateRow(key: string, patch: Partial<Row>) {
    setRows(prev => prev.map(r => r.key === key ? { ...r, ...patch } : r))
  }

  async function handleVideos(files: FileList) {
    const arr = Array.from(files).filter(f => f.type.startsWith('video/') || f.name.endsWith('.mp4'))
    setRows(prev => {
      const next = [...prev]
      for (const f of arr) {
        const key = normalizeKey(f.name)
        const existing = next.find(r => r.key === key)
        if (existing) {
          existing.videoFile = f
        } else {
          next.push({ key, name: cleanName(f), videoFile: f, transcriptText: null, transcriptFileName: null, status: 'pending', error: null })
        }
      }
      return next
    })
  }

  async function handleTranscripts(files: FileList) {
    const arr = Array.from(files)
    const reads = await Promise.all(arr.map(async f => ({ f, text: await readTextFile(f) })))
    setRows(prev => {
      const next = [...prev]
      for (const { f, text } of reads) {
        const key = normalizeKey(f.name)
        const existing = next.find(r => r.key === key)
        if (existing) {
          existing.transcriptText = text
          existing.transcriptFileName = f.name
        } else {
          next.push({ key, name: cleanName(f), videoFile: null, transcriptText: text, transcriptFileName: f.name, status: 'pending', error: null })
        }
      }
      return next
    })
  }

  async function uploadOneCandidateToMux(videoFile: File, setStatus: (s: RowStatus) => void): Promise<{ assetId: string; playbackId: string } | null> {
    setStatus('uploading')
    const res = await fetch('/api/mux/upload-url', { method: 'POST' })
    const { uploadId, url } = await res.json()
    await fetch(url, { method: 'PUT', body: videoFile, headers: { 'Content-Type': videoFile.type || 'video/mp4' } })
    setStatus('processing')
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 4000))
      const poll = await fetch(`/api/mux/asset/${uploadId}`)
      const data = await poll.json()
      if (data.status === 'ready') return { assetId: data.assetId, playbackId: data.playbackId }
      if (data.status === 'errored') return null
    }
    return null
  }

  async function runUpload() {
    setRunning(true)
    const supabase = createClient()

    await Promise.all(
      rows.map(async row => {
        if (row.status === 'done') return
        try {
          let muxAssetId: string | null = null
          let muxPlaybackId: string | null = null

          if (row.videoFile) {
            const mux = await uploadOneCandidateToMux(
              row.videoFile,
              s => updateRow(row.key, { status: s }),
            )
            if (mux) {
              muxAssetId = mux.assetId
              muxPlaybackId = mux.playbackId
            }
          }

          updateRow(row.key, { status: 'saving' })
          const { error } = await supabase.from('video_candidates').insert({
            name: row.name.trim(),
            mux_asset_id: muxAssetId,
            mux_playback_id: muxPlaybackId,
            transcript: row.transcriptText ?? null,
          })
          if (error) throw new Error(error.message)
          updateRow(row.key, { status: 'done', error: null })
        } catch (err: any) {
          updateRow(row.key, { status: 'error', error: err.message ?? 'Failed' })
        }
      })
    )

    setRunning(false)
    const anyDone = rows.some(r => r.status === 'done')
    if (anyDone) onDone()
  }

  const STATUS_LABEL: Record<RowStatus, string> = {
    pending: '—',
    uploading: 'Uploading…',
    processing: 'Processing…',
    saving: 'Saving…',
    done: '✓ Done',
    error: '✗ Error',
  }

  const STATUS_COLOR: Record<RowStatus, string> = {
    pending: 'text-gray-400',
    uploading: 'text-indigo-600',
    processing: 'text-amber-600',
    saving: 'text-indigo-600',
    done: 'text-emerald-600 font-medium',
    error: 'text-red-500',
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>Bulk import videos</Button>
    )
  }

  const pendingCount = rows.filter(r => r.status === 'pending').length
  const doneCount = rows.filter(r => r.status === 'done').length

  return (
    <div className="space-y-4 border border-indigo-100 rounded-xl p-5 bg-indigo-50/30">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Bulk import video candidates</h3>
        <button onClick={() => { setOpen(false); setRows([]) }} className="text-xs text-gray-400 hover:text-gray-600">✕ Close</button>
      </div>

      <p className="text-xs text-gray-500">
        Select your MP4 files and transcript (.txt) files. Files with the same name will be matched automatically.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => videoRef.current?.click()}
          className="text-sm px-4 py-2 rounded-lg border border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-colors"
          disabled={running}
        >
          + Select MP4 files
        </button>
        <button
          onClick={() => transcriptRef.current?.click()}
          className="text-sm px-4 py-2 rounded-lg border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          disabled={running}
        >
          + Select transcript files (.txt)
        </button>
        <input ref={videoRef} type="file" accept="video/*,.mp4" multiple className="hidden"
          onChange={e => e.target.files && handleVideos(e.target.files)} />
        <input ref={transcriptRef} type="file" accept=".txt,text/plain" multiple className="hidden"
          onChange={e => e.target.files && handleTranscripts(e.target.files)} />
      </div>

      {rows.length > 0 && (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5 text-left">Candidate name</th>
                <th className="px-4 py-2.5 text-center">Video</th>
                <th className="px-4 py-2.5 text-center">Transcript</th>
                <th className="px-4 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(row => (
                <tr key={row.key} className="bg-white">
                  <td className="px-4 py-2.5">
                    <Input
                      value={row.name}
                      onChange={e => updateRow(row.key, { name: e.target.value })}
                      className="h-7 text-sm"
                      disabled={running || row.status === 'done'}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {row.videoFile ? (
                      <span className="text-emerald-600 text-xs">✓ {row.videoFile.name}</span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {row.transcriptFileName ? (
                      <span className="text-emerald-600 text-xs">✓ {row.transcriptFileName}</span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className={`px-4 py-2.5 text-right text-xs ${STATUS_COLOR[row.status]}`}>
                    {row.status === 'error' ? (row.error ?? 'Error') : STATUS_LABEL[row.status]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <div className="flex items-center gap-4">
          <Button
            onClick={runUpload}
            disabled={running || pendingCount === 0}
          >
            {running ? `Uploading… (${doneCount}/${rows.length} done)` : `Upload ${pendingCount} candidate${pendingCount !== 1 ? 's' : ''}`}
          </Button>
          {!running && (
            <button onClick={() => setRows([])} className="text-xs text-gray-400 hover:text-gray-600">Clear all</button>
          )}
        </div>
      )}
    </div>
  )
}

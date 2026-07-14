'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadVideoToMux } from '@/lib/muxUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type RowStatus = 'pending' | 'uploading' | 'processing' | 'saving' | 'done' | 'error'

type Row = {
  key: string
  candidateName: string
  matchedId: string | null      // candidate_profiles.id if found
  matchedName: string | null    // display name of match
  videoFile: File | null
  transcriptText: string | null
  status: RowStatus
  error: string | null
}

function groupByFolder(files: FileList): Map<string, { mp4: File | null; txt: File | null }> {
  const groups = new Map<string, { mp4: File | null; txt: File | null }>()
  for (const file of Array.from(files)) {
    const parts = (file.webkitRelativePath || file.name).split('/')
    const folderParts = parts.slice(0, -1)
    const folder = folderParts.length > 0 ? folderParts[folderParts.length - 1] : null
    if (!folder) continue
    if (!groups.has(folder)) groups.set(folder, { mp4: null, txt: null })
    const g = groups.get(folder)!
    const name = file.name.toLowerCase()
    if (name.endsWith('.mp4') || name.endsWith('.mov') || file.type.startsWith('video/')) g.mp4 = file
    else if (name.endsWith('.txt')) g.txt = file
  }
  return groups
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export default function BulkUploadForm({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [running, setRunning] = useState(false)
  const folderRef = useRef<HTMLInputElement>(null)

  function updateRow(key: string, patch: Partial<Row>) {
    setRows(prev => prev.map(r => r.key === key ? { ...r, ...patch } : r))
  }

  async function handleFolderSelect(files: FileList) {
    const groups = groupByFolder(files)
    if (groups.size === 0) return

    // Load existing candidate_profiles to match against
    const supabase = createClient()
    const { data: profiles } = await supabase
      .from('candidate_profiles')
      .select('id, full_name')
      .eq('status', 'active')

    const profileList: { id: string; name: string }[] = (profiles ?? []).map((p: any) => ({
      id: p.id,
      name: p.full_name ?? '',
    }))

    const newRows: Row[] = []
    for (const [folder, { mp4, txt }] of groups) {
      const transcriptText = txt ? await txt.text() : null

      // Try to match folder name to a candidate profile
      const folderNorm = normalize(folder)
      let matchedId: string | null = null
      let matchedName: string | null = null

      // Exact normalized match first
      const exact = profileList.find(p => normalize(p.name) === folderNorm)
      if (exact) { matchedId = exact.id; matchedName = exact.name }

      // Fallback: contains match
      if (!matchedId) {
        const partial = profileList.find(p =>
          normalize(p.name).includes(folderNorm) || folderNorm.includes(normalize(p.name))
        )
        if (partial) { matchedId = partial.id; matchedName = partial.name }
      }

      newRows.push({
        key: folder,
        candidateName: folder,
        matchedId,
        matchedName,
        videoFile: mp4,
        transcriptText,
        status: 'pending',
        error: null,
      })
    }

    setRows(newRows)
  }

  async function uploadToMux(file: File, onStatus: (s: RowStatus) => void): Promise<{ assetId: string; playbackId: string } | null> {
    try {
      return await uploadVideoToMux(file, label =>
        onStatus(label.startsWith('Processing') ? 'processing' : 'uploading'))
    } catch {
      return null // caller marks the row failed
    }
  }

  async function runUpload() {
    setRunning(true)
    const supabase = createClient()

    await Promise.all(rows.map(async row => {
      if (row.status === 'done') return
      try {
        let muxAssetId: string | null = null
        let muxPlaybackId: string | null = null

        if (row.videoFile) {
          const mux = await uploadToMux(row.videoFile, s => updateRow(row.key, { status: s }))
          if (mux) { muxAssetId = mux.assetId; muxPlaybackId = mux.playbackId }
        }

        updateRow(row.key, { status: 'saving' })

        if (row.matchedId) {
          // Save to videos table and mark as interviewed
          await supabase.from('videos').insert({
            candidate_id: row.matchedId,
            mux_asset_id: muxAssetId,
            mux_playback_id: muxPlaybackId,
            url: null,
            transcript: row.transcriptText ?? null,
            approved: true,
          })
          await supabase.from('candidate_profiles').update({
            interviewed: true,
            interviewed_at: new Date().toISOString(),
          }).eq('id', row.matchedId)
        } else {
          // No match — save to video_candidates
          await supabase.from('video_candidates').insert({
            name: row.candidateName.trim(),
            mux_asset_id: muxAssetId,
            mux_playback_id: muxPlaybackId,
            transcript: row.transcriptText ?? null,
          })
        }

        updateRow(row.key, { status: 'done', error: null })
      } catch (err: any) {
        updateRow(row.key, { status: 'error', error: err.message ?? 'Failed' })
      }
    }))

    setRunning(false)
    if (rows.some(r => r.status === 'done')) onDone()
  }

  const STATUS_LABEL: Record<RowStatus, string> = {
    pending: '—', uploading: 'Uploading…', processing: 'Processing…',
    saving: 'Saving…', done: '✓ Done', error: '✗ Error',
  }
  const STATUS_COLOR: Record<RowStatus, string> = {
    pending: 'text-gray-400', uploading: 'text-indigo-600', processing: 'text-amber-600',
    saving: 'text-indigo-600', done: 'text-emerald-600 font-medium', error: 'text-red-500',
  }

  if (!open) return <Button variant="outline" onClick={() => setOpen(true)}>Bulk import videos</Button>

  const pendingCount = rows.filter(r => r.status === 'pending').length
  const doneCount = rows.filter(r => r.status === 'done').length

  return (
    <div className="space-y-4 border border-indigo-100 rounded-xl p-5 bg-indigo-50/30">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Bulk import video interviews</h3>
        <button onClick={() => { setOpen(false); setRows([]) }} className="text-xs text-gray-400 hover:text-gray-600">✕ Close</button>
      </div>

      <p className="text-xs text-gray-500">
        Select the folder that contains your candidate subfolders. Each subfolder should be named after the candidate
        and contain the MP4 and transcript (.txt) file. Matched candidates will be updated in the main database and marked as interviewed.
      </p>

      <div>
        <button
          onClick={() => folderRef.current?.click()}
          disabled={running}
          className="text-sm px-4 py-2 rounded-lg border border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-colors disabled:opacity-50"
        >
          Select folder of candidate interviews
        </button>
        {/* webkitdirectory lets the user pick an entire folder */}
        <input
          ref={folderRef}
          type="file"
          className="hidden"
          multiple
          // @ts-expect-error — non-standard but supported in all modern browsers
          webkitdirectory=""
          onChange={e => e.target.files && handleFolderSelect(e.target.files)}
        />
      </div>

      {rows.length > 0 && (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5 text-left">Folder / Candidate</th>
                <th className="px-4 py-2.5 text-left">Matched profile</th>
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
                      value={row.candidateName}
                      onChange={e => updateRow(row.key, { candidateName: e.target.value })}
                      className="h-7 text-sm"
                      disabled={running || row.status === 'done'}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {row.matchedId ? (
                      <span className="text-emerald-600">✓ {row.matchedName}</span>
                    ) : (
                      <span className="text-amber-600">No match — will add to video library</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center text-xs">
                    {row.videoFile ? <span className="text-emerald-600">✓</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center text-xs">
                    {row.transcriptText ? <span className="text-emerald-600">✓</span> : <span className="text-gray-300">—</span>}
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
          <Button onClick={runUpload} disabled={running || pendingCount === 0}>
            {running
              ? `Uploading… (${doneCount}/${rows.length} done)`
              : `Upload ${pendingCount} candidate${pendingCount !== 1 ? 's' : ''}`}
          </Button>
          {!running && (
            <button onClick={() => setRows([])} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
          )}
        </div>
      )}
    </div>
  )
}

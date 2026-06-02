'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ── Types ────────────────────────────────────────────────────────────────────

type UnassignedVideo = {
  id: string
  mux_playback_id: string | null
  mux_asset_id: string | null
  transcript: string | null
  zoom_meeting_id: string | null
  created_at: string
}

type VideoCandidate = {
  id: string
  name: string
  current_job_title: string | null
  location: string | null
  mux_playback_id: string | null
  mux_asset_id: string | null
  transcript: string | null
  created_at: string
}

type CandidateOption = { id: string; label: string }

type RowStatus = 'pending' | 'uploading' | 'processing' | 'saving' | 'done' | 'error'

type BulkRow = {
  key: string
  candidateName: string
  matchedId: string | null
  matchedName: string | null
  videoFile: File | null
  transcriptText: string | null
  status: RowStatus
  error: string | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

const STOP_WORDS = new Set(['mr', 'mrs', 'ms', 'dr', 'prof', 'jr', 'sr', 'ii', 'iii', 'iv', 'esq'])

function nameWords(s: string): string[] {
  return s.toLowerCase().split(/[\s,.\-_()\[\]]+/).filter(w => w.length > 1 && !STOP_WORDS.has(w))
}

function cleanFolderName(raw: string): string {
  return raw
    .replace(/^\d{4}[-/]\d{2}[-/]\d{2}\s+/, '')   // leading YYYY-MM-DD
    .replace(/^\d{2}[-/]\d{2}[-/]\d{4}\s+/, '')   // leading MM-DD-YYYY
    .replace(/^\d+\s*[-–]\s*/, '')                  // leading number prefix "01 - "
    .replace(/\s*[-–]\s*(interview|recording|call|meeting|zoom).*$/i, '') // trailing " - Interview"
    .trim()
}

function groupByFolder(files: FileList): Map<string, { mp4: File | null; txt: File | null }> {
  const groups = new Map<string, { mp4: File | null; txt: File | null }>()
  for (const file of Array.from(files)) {
    const parts = (file.webkitRelativePath || file.name).split('/')
    const n = file.name.toLowerCase()
    const isVideo = n.endsWith('.mp4') || n.endsWith('.mov') || n.endsWith('.webm') || file.type.startsWith('video/')
    const isText = n.endsWith('.txt')
    if (!isVideo && !isText) continue

    let key: string
    if (parts.length >= 2) {
      // In a subfolder — use immediate parent folder name, cleaned
      key = cleanFolderName(parts[parts.length - 2])
    } else {
      // Flat folder — use filename without extension
      key = cleanFolderName(file.name.replace(/\.[^.]+$/, ''))
    }
    if (!key) continue
    if (!groups.has(key)) groups.set(key, { mp4: null, txt: null })
    const g = groups.get(key)!
    if (isVideo) g.mp4 = file
    else if (isText) g.txt = file
  }
  return groups
}

function matchCandidate(name: string, profiles: CandidateOption[]): CandidateOption | null {
  const key = normalize(name)
  const words = nameWords(name)

  // 1. Exact normalized
  let m = profiles.find(p => normalize(p.label) === key)
  if (m) return m

  // 2. All words match in any order (handles "Smith John" vs "John Smith")
  if (words.length >= 2) {
    m = profiles.find(p => {
      const pw = nameWords(p.label)
      return words.every(w => pw.some(pw2 => pw2 === w || pw2.startsWith(w) || w.startsWith(pw2)))
        && pw.every(pw2 => words.some(w => w === pw2 || w.startsWith(pw2) || pw2.startsWith(w)))
    })
    if (m) return m

    // 3. Relaxed: all input words found in profile (profile may have middle name etc.)
    m = profiles.find(p => {
      const pw = nameWords(p.label)
      return words.every(w => pw.some(pw2 => pw2.startsWith(w) || w.startsWith(pw2)))
    })
    if (m) return m
  }

  // 4. Substring fallback (only if key is long enough to avoid false positives)
  if (key.length >= 6) {
    m = profiles.find(p => {
      const pk = normalize(p.label)
      return pk.includes(key) || key.includes(pk)
    })
    if (m) return m
  }

  return null
}

// ── Main component ───────────────────────────────────────────────────────────

export default function VideosPage() {
  const [unassigned, setUnassigned] = useState<UnassignedVideo[]>([])
  const [videoCandidates, setVideoCandidates] = useState<VideoCandidate[]>([])
  const [candidateOptions, setCandidateOptions] = useState<CandidateOption[]>([])
  const [loading, setLoading] = useState(true)

  // per-row assignment selection
  const [assignSelect, setAssignSelect] = useState<Record<string, string>>({})
  const [assigning, setAssigning] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [transcriptOpen, setTranscriptOpen] = useState<string | null>(null)

  // create-card form for unassigned videos
  const [creatingCard, setCreatingCard] = useState<string | null>(null)
  const [cardName, setCardName] = useState('')

  // re-match all unmatched video_candidates
  const [rematching, setRematching] = useState(false)
  const [rematchResult, setRematchResult] = useState<string | null>(null)

  // bulk upload state
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([])
  const [bulkRunning, setBulkRunning] = useState(false)
  const videoFolderRef = useRef<HTMLInputElement>(null)
  const transcriptFolderRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const [{ data: vids }, { data: vcs }, { data: profs }] = await Promise.all([
      supabase.from('videos').select('id, mux_playback_id, mux_asset_id, transcript, zoom_meeting_id, created_at')
        .is('candidate_id', null).order('created_at', { ascending: false }),
      supabase.from('video_candidates').select('id, name, current_job_title, location, mux_playback_id, mux_asset_id, transcript, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('candidate_profiles').select('id, full_name').order('full_name'),
    ])
    setUnassigned((vids ?? []) as UnassignedVideo[])
    setVideoCandidates((vcs ?? []) as VideoCandidate[])
    setCandidateOptions(((profs ?? []) as any[]).map(p => ({ id: p.id, label: p.full_name ?? p.id })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // ── Re-match all video_candidates to profiles ───────────────────────────
  async function handleRematchAll() {
    setRematching(true)
    setRematchResult(null)
    const supabase = createClient()
    const { data: profs } = await supabase.from('candidate_profiles').select('id, full_name').order('full_name')
    const opts: CandidateOption[] = ((profs ?? []) as any[]).map(p => ({ id: p.id, label: p.full_name ?? '' }))

    let matched = 0
    const toRemove: string[] = []

    await Promise.all(videoCandidates.map(async vc => {
      const hit = matchCandidate(vc.name, opts)
      if (!hit) return
      await supabase.from('videos').insert({
        candidate_id: hit.id,
        mux_asset_id: vc.mux_asset_id,
        mux_playback_id: vc.mux_playback_id,
        transcript: vc.transcript,
        approved: true,
      })
      await supabase.from('candidate_profiles').update({
        interviewed: true, interviewed_at: new Date().toISOString(),
      }).eq('id', hit.id)
      await supabase.from('video_candidates').delete().eq('id', vc.id)
      toRemove.push(vc.id)
      matched++
    }))

    setVideoCandidates(prev => prev.filter(v => !toRemove.includes(v.id)))
    setRematchResult(`Matched ${matched} of ${videoCandidates.length} candidates.`)
    setRematching(false)
  }

  // ── Assign unassigned video to a candidate ──────────────────────────────
  async function handleAssign(videoId: string) {
    const candidateId = assignSelect[videoId]
    if (!candidateId) return
    setAssigning(videoId)
    const supabase = createClient()
    await supabase.from('videos').update({ candidate_id: candidateId }).eq('id', videoId)
    setUnassigned(prev => prev.filter(v => v.id !== videoId))
    setAssigning(null)
  }

  // ── Assign video_candidate to existing profile ──────────────────────────
  async function handleAssignVC(vcId: string) {
    const candidateId = assignSelect[vcId]
    if (!candidateId) return
    setAssigning(vcId)
    const supabase = createClient()
    const vc = videoCandidates.find(v => v.id === vcId)
    if (vc) {
      // Move video to videos table linked to the profile
      await supabase.from('videos').insert({
        candidate_id: candidateId,
        mux_asset_id: vc.mux_asset_id,
        mux_playback_id: vc.mux_playback_id,
        transcript: vc.transcript,
        approved: true,
      })
      await supabase.from('candidate_profiles').update({
        interviewed: true, interviewed_at: new Date().toISOString(),
      }).eq('id', candidateId)
    }
    await supabase.from('video_candidates').delete().eq('id', vcId)
    setVideoCandidates(prev => prev.filter(v => v.id !== vcId))
    setAssigning(null)
  }

  // ── Create new candidate card from unassigned video ─────────────────────
  async function handleCreateCard(videoId: string) {
    if (!cardName.trim()) return
    setAssigning(videoId)
    const supabase = createClient()
    const { data: vc } = await supabase.from('video_candidates').insert({
      name: cardName.trim(),
      mux_asset_id: unassigned.find(v => v.id === videoId)?.mux_asset_id ?? null,
      mux_playback_id: unassigned.find(v => v.id === videoId)?.mux_playback_id ?? null,
      transcript: unassigned.find(v => v.id === videoId)?.transcript ?? null,
    }).select().single()
    // Remove from unassigned (was moved to video_candidates)
    await supabase.from('videos').delete().eq('id', videoId)
    setUnassigned(prev => prev.filter(v => v.id !== videoId))
    if (vc) setVideoCandidates(prev => [vc as VideoCandidate, ...prev])
    setCreatingCard(null)
    setCardName('')
    setAssigning(null)
  }

  // ── Delete ──────────────────────────────────────────────────────────────
  async function handleDelete(id: string, table: 'videos' | 'video_candidates') {
    if (!confirm('Delete this video and its transcript? This cannot be undone.')) return
    setDeleting(id)
    await fetch('/api/admin/delete-video', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, table }),
    })
    if (table === 'videos') setUnassigned(prev => prev.filter(v => v.id !== id))
    else setVideoCandidates(prev => prev.filter(v => v.id !== id))
    setDeleting(null)
  }

  // ── Delete transcript only ───────────────────────────────────────────────
  async function handleDeleteTranscript(id: string, table: 'videos' | 'video_candidates') {
    if (!confirm('Remove transcript from this entry?')) return
    const supabase = createClient()
    await supabase.from(table).update({ transcript: null }).eq('id', id)
    if (table === 'videos') setUnassigned(prev => prev.map(v => v.id === id ? { ...v, transcript: null } : v))
    else setVideoCandidates(prev => prev.map(v => v.id === id ? { ...v, transcript: null } : v))
  }

  // ── Bulk upload ──────────────────────────────────────────────────────────
  async function handleVideoFolder(files: FileList) {
    const groups = groupByFolder(files)
    mergeBulkRows(Array.from(groups.entries()).map(([folder, { mp4, txt }]) => ({
      key: folder, videoFile: mp4, transcriptText: txt ? null : null, transcriptFile: txt,
    })))
  }

  async function handleTranscriptFolder(files: FileList) {
    const entries: { key: string; txt: File }[] = []
    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith('.txt')) continue
      const key = file.name.replace(/\.txt$/i, '').replace(/[_\-]+/g, ' ').trim()
      entries.push({ key, txt: file })
    }
    const reads = await Promise.all(entries.map(async e => ({ key: e.key, text: await e.txt.text(), fname: e.txt.name })))
    mergeBulkTranscripts(reads)
  }

  async function mergeBulkRows(entries: { key: string; videoFile: File | null; transcriptFile: File | null; transcriptText: string | null }[]) {
    const supabase = createClient()
    const { data: profs } = await supabase.from('candidate_profiles').select('id, full_name').order('full_name')
    const opts: CandidateOption[] = ((profs ?? []) as any[]).map(p => ({ id: p.id, label: p.full_name ?? '' }))

    const reads = await Promise.all(entries.map(async e => ({
      ...e,
      transcriptText: e.transcriptFile ? await e.transcriptFile.text() : e.transcriptText,
    })))

    setBulkRows(prev => {
      const next = [...prev]
      for (const e of reads) {
        const existing = next.find(r => normalize(r.key) === normalize(e.key))
        const match = matchCandidate(e.key, opts)
        if (existing) {
          if (e.videoFile) existing.videoFile = e.videoFile
          if (e.transcriptText) existing.transcriptText = e.transcriptText
        } else {
          next.push({
            key: e.key,
            candidateName: e.key.replace(/[_\-]+/g, ' ').trim(),
            matchedId: match?.id ?? null,
            matchedName: match?.label ?? null,
            videoFile: e.videoFile,
            transcriptText: e.transcriptText,
            status: 'pending',
            error: null,
          })
        }
      }
      return next
    })
  }

  async function mergeBulkTranscripts(entries: { key: string; text: string; fname: string }[]) {
    const supabase = createClient()
    const { data: profs } = await supabase.from('candidate_profiles').select('id, full_name').order('full_name')
    const opts: CandidateOption[] = ((profs ?? []) as any[]).map(p => ({ id: p.id, label: p.full_name ?? '' }))

    setBulkRows(prev => {
      const next = [...prev]
      for (const e of entries) {
        const existing = next.find(r => normalize(r.candidateName) === normalize(e.key))
        const match = matchCandidate(e.key, opts)
        if (existing) {
          existing.transcriptText = e.text
        } else {
          next.push({
            key: e.key,
            candidateName: e.key,
            matchedId: match?.id ?? null,
            matchedName: match?.label ?? null,
            videoFile: null,
            transcriptText: e.text,
            status: 'pending',
            error: null,
          })
        }
      }
      return next
    })
  }

  function updateBulkRow(key: string, patch: Partial<BulkRow>) {
    setBulkRows(prev => prev.map(r => r.key === key ? { ...r, ...patch } : r))
  }

  async function uploadToMux(file: File, onStatus: (s: RowStatus) => void): Promise<{ assetId: string; playbackId: string } | null> {
    onStatus('uploading')
    const res = await fetch('/api/mux/upload-url', { method: 'POST' })
    const { uploadId, url } = await res.json()
    await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'video/mp4' } })
    onStatus('processing')
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 4000))
      const poll = await fetch(`/api/mux/asset/${uploadId}`)
      const data = await poll.json()
      if (data.status === 'ready') return { assetId: data.assetId, playbackId: data.playbackId }
      if (data.status === 'errored') return null
    }
    return null
  }

  async function runBulkUpload() {
    setBulkRunning(true)
    const supabase = createClient()
    await Promise.all(bulkRows.map(async row => {
      if (row.status === 'done') return
      try {
        let muxAssetId: string | null = null
        let muxPlaybackId: string | null = null
        if (row.videoFile) {
          const mux = await uploadToMux(row.videoFile, s => updateBulkRow(row.key, { status: s }))
          if (mux) { muxAssetId = mux.assetId; muxPlaybackId = mux.playbackId }
        }
        updateBulkRow(row.key, { status: 'saving' })
        if (row.matchedId) {
          await supabase.from('videos').insert({
            candidate_id: row.matchedId,
            mux_asset_id: muxAssetId, mux_playback_id: muxPlaybackId,
            transcript: row.transcriptText ?? null, approved: true,
          })
          await supabase.from('candidate_profiles').update({
            interviewed: true, interviewed_at: new Date().toISOString(),
          }).eq('id', row.matchedId)
        } else {
          await supabase.from('video_candidates').insert({
            name: row.candidateName.trim(),
            mux_asset_id: muxAssetId, mux_playback_id: muxPlaybackId,
            transcript: row.transcriptText ?? null,
          })
        }
        updateBulkRow(row.key, { status: 'done', error: null })
      } catch (err: any) {
        updateBulkRow(row.key, { status: 'error', error: err.message ?? 'Failed' })
      }
    }))
    setBulkRunning(false)
    await load()
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const STATUS_LABEL: Record<RowStatus, string> = {
    pending: '—', uploading: 'Uploading…', processing: 'Processing…',
    saving: 'Saving…', done: '✓ Done', error: '✗ Error',
  }
  const STATUS_COLOR: Record<RowStatus, string> = {
    pending: 'text-gray-400', uploading: 'text-indigo-600', processing: 'text-amber-600',
    saving: 'text-indigo-600', done: 'text-emerald-600 font-medium', error: 'text-red-500',
  }

  if (loading) return <div className="text-sm text-gray-400 py-20 text-center">Loading…</div>

  const pendingBulk = bulkRows.filter(r => r.status === 'pending').length
  const doneBulk = bulkRows.filter(r => r.status === 'done').length

  return (
    <div className="px-8 py-8 space-y-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-950 tracking-tight">Videos &amp; Transcripts</h2>
          <p className="text-sm text-gray-400 mt-1">All interview recordings and transcripts in one place.</p>
        </div>
        <Button variant="outline" onClick={() => { setBulkOpen(o => !o); setBulkRows([]) }}>
          {bulkOpen ? 'Close bulk import' : 'Bulk import'}
        </Button>
      </div>

      {/* Bulk Import */}
      {bulkOpen && (
        <div className="border border-indigo-100 rounded-xl p-5 bg-indigo-50/30 space-y-4">
          <p className="text-sm font-semibold text-gray-900">Bulk import</p>
          <p className="text-xs text-gray-500">
            Select your <strong>videos folder</strong> — works with flat folders (video files named after candidate), subfolders per candidate, or subfolders with dates/prefixes like "2026-01-15 John Smith". Also select your <strong>transcripts folder</strong> (.txt files named by candidate). Both are matched to existing candidates automatically.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => videoFolderRef.current?.click()} disabled={bulkRunning}
              className="text-sm px-4 py-2 rounded-lg border border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">
              📁 Videos folder (subfolders)
            </button>
            <button onClick={() => transcriptFolderRef.current?.click()} disabled={bulkRunning}
              className="text-sm px-4 py-2 rounded-lg border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              📄 Transcripts folder (.txt files)
            </button>
          </div>
          {/* @ts-expect-error webkitdirectory */}
          <input ref={videoFolderRef} type="file" multiple webkitdirectory="" className="hidden"
            onChange={e => e.target.files && handleVideoFolder(e.target.files)} />
          {/* @ts-expect-error webkitdirectory */}
          <input ref={transcriptFolderRef} type="file" multiple webkitdirectory="" className="hidden"
            onChange={e => e.target.files && handleTranscriptFolder(e.target.files)} />

          {bulkRows.length > 0 && (
            <>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Candidate name</th>
                      <th className="px-4 py-2.5 text-left">Matched profile</th>
                      <th className="px-4 py-2.5 text-center">Video</th>
                      <th className="px-4 py-2.5 text-center">Transcript</th>
                      <th className="px-4 py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bulkRows.map(row => (
                      <tr key={row.key} className="bg-white">
                        <td className="px-4 py-2.5">
                          <Input value={row.candidateName}
                            onChange={e => updateBulkRow(row.key, { candidateName: e.target.value })}
                            className="h-7 text-sm" disabled={bulkRunning || row.status === 'done'} />
                        </td>
                        <td className="px-4 py-2.5 text-xs">
                          {row.matchedId
                            ? <span className="text-emerald-600">✓ {row.matchedName}</span>
                            : <span className="text-amber-600">No match → video library</span>}
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
              <div className="flex gap-4 items-center">
                <Button onClick={runBulkUpload} disabled={bulkRunning || pendingBulk === 0}>
                  {bulkRunning ? `Uploading… (${doneBulk}/${bulkRows.length})` : `Upload ${pendingBulk} candidate${pendingBulk !== 1 ? 's' : ''}`}
                </Button>
                {!bulkRunning && <button onClick={() => setBulkRows([])} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
              </div>
            </>
          )}
        </div>
      )}

      {/* Unassigned recordings */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Unassigned recordings ({unassigned.length})
        </h3>
        {unassigned.length === 0 ? (
          <p className="text-sm text-gray-400">None.</p>
        ) : unassigned.map(v => (
          <div key={v.id} className="bg-white border border-gray-100 rounded-xl px-5 py-4 space-y-3 shadow-sm">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-gray-900">
                  {new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                {v.zoom_meeting_id && <p className="text-xs text-gray-400">Zoom ID: {v.zoom_meeting_id}</p>}
              </div>
              <button onClick={() => handleDelete(v.id, 'videos')} disabled={deleting === v.id}
                className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 shrink-0">
                {deleting === v.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>

            {v.transcript && (
              <div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setTranscriptOpen(p => p === v.id ? null : v.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-800">
                    {transcriptOpen === v.id ? 'Hide transcript' : 'Show transcript'}
                  </button>
                  <button onClick={() => handleDeleteTranscript(v.id, 'videos')}
                    className="text-xs text-red-400 hover:text-red-600">Remove transcript</button>
                </div>
                {transcriptOpen === v.id && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {v.transcript}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-50">
              <Select value={assignSelect[v.id] ?? ''} onValueChange={val => setAssignSelect(p => ({ ...p, [v.id]: val }))}>
                <SelectTrigger className="w-52 h-8 text-xs">
                  <SelectValue placeholder="Assign to candidate…" />
                </SelectTrigger>
                <SelectContent>
                  {candidateOptions.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" className="h-8 text-xs" disabled={!assignSelect[v.id] || assigning === v.id}
                onClick={() => handleAssign(v.id)}>
                {assigning === v.id ? 'Assigning…' : 'Assign'}
              </Button>
              <span className="text-gray-300 text-xs">or</span>
              {creatingCard === v.id ? (
                <>
                  <Input value={cardName} onChange={e => setCardName(e.target.value)}
                    placeholder="Candidate name" className="h-8 text-xs w-44" />
                  <Button size="sm" className="h-8 text-xs" disabled={!cardName.trim() || assigning === v.id}
                    onClick={() => handleCreateCard(v.id)}>
                    {assigning === v.id ? 'Creating…' : 'Create'}
                  </Button>
                  <button onClick={() => { setCreatingCard(null); setCardName('') }}
                    className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                </>
              ) : (
                <button onClick={() => { setCreatingCard(v.id); setCardName('') }}
                  className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2">
                  Create new candidate card
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Video-only candidates */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Video-only candidates ({videoCandidates.length})
          </h3>
          {videoCandidates.length > 0 && (
            <div className="flex items-center gap-3">
              {rematchResult && <span className="text-xs text-emerald-600">{rematchResult}</span>}
              <Button size="sm" variant="outline" onClick={handleRematchAll} disabled={rematching}>
                {rematching ? 'Matching…' : 'Re-match all to profiles'}
              </Button>
            </div>
          )}
        </div>
        {videoCandidates.length === 0 ? (
          <p className="text-sm text-gray-400">None.</p>
        ) : videoCandidates.map(vc => (
          <div key={vc.id} className="bg-white border border-gray-100 rounded-xl px-5 py-4 space-y-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{vc.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {[vc.current_job_title, vc.location].filter(Boolean).join(' · ')}
                </p>
                <Link href={`/dashboard/admin/video-candidates/${vc.id}`}
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline underline-offset-2">
                  View full profile →
                </Link>
              </div>
              <button onClick={() => handleDelete(vc.id, 'video_candidates')} disabled={deleting === vc.id}
                className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 shrink-0">
                {deleting === vc.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>

            {vc.transcript && (
              <div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setTranscriptOpen(p => p === vc.id ? null : vc.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-800">
                    {transcriptOpen === vc.id ? 'Hide transcript' : 'Show transcript'}
                  </button>
                  <button onClick={() => handleDeleteTranscript(vc.id, 'video_candidates')}
                    className="text-xs text-red-400 hover:text-red-600">Remove transcript</button>
                </div>
                {transcriptOpen === vc.id && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {vc.transcript}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-50">
              <Select value={assignSelect[vc.id] ?? ''} onValueChange={val => setAssignSelect(p => ({ ...p, [vc.id]: val }))}>
                <SelectTrigger className="w-52 h-8 text-xs">
                  <SelectValue placeholder="Link to existing profile…" />
                </SelectTrigger>
                <SelectContent>
                  {candidateOptions.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" className="h-8 text-xs" disabled={!assignSelect[vc.id] || assigning === vc.id}
                onClick={() => handleAssignVC(vc.id)}>
                {assigning === vc.id ? 'Linking…' : 'Link to profile'}
              </Button>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

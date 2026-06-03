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
  let s = raw.trim()
  // Zoom YiddisheKop: "2025-07-22 18.51.09 Gilah Shull_ Interview"
  s = s.replace(/^\d{4}-\d{2}-\d{2}\s+\d{2}\.\d{2}\.\d{2}\s+/, '')
  // Generic datetime prefix
  s = s.replace(/^\d{4}[-/]\d{2}[-/]\d{2}\s+\d{2}[.:]\d{2}[.:]\d{2}\s+/, '')
  // Zoom folder: "2026-03-10  Ariella Eve" (1 or 2 spaces after date)
  s = s.replace(/^\d{4}[-/]\d{2}[-/]\d{2}\s+/, '')
  s = s.replace(/^\d{2}[-/]\d{2}[-/]\d{4}\s+/, '')
  s = s.replace(/^\d+\s*[-–]\s*/, '')
  // Zoom "Name_ Interview" / "Name_ New Meeting" — strip underscore + anything after
  s = s.replace(/\s*_.*$/, '')
  // " - Interview / Recording / Meeting" suffix
  s = s.replace(/\s*[-–]\s*(interview|recording|call|meeting|zoom)\b.*$/i, '')
  // "Name's Personal Meeting Room" / "Name's Zoom Meeting" / truncated "Name's Perso..." / "Name's Zoo..."
  s = s.replace(/\s*'s\s+(personal|zoom|perso|zoo)\b.*$/i, '')
  s = s.replace(/\s*'s\s+personal\s+meeting\s+room.*$/i, '')
  // trailing date
  s = s.replace(/\s+\d{4}[-/]\d{2}[-/]\d{2}.*$/, '')
  return s.trim()
}

// Strip VTT timestamp/cue markup, leaving just the spoken text
function parseVtt(text: string): string {
  return text
    .split('\n')
    .filter(line => {
      const t = line.trim()
      return t.length > 0
        && t !== 'WEBVTT'
        && !/^\d+$/.test(t)
        && !/^\d{2}:\d{2}:\d{2}/.test(t)
        && !/^NOTE/.test(t)
    })
    .join('\n')
    .trim()
}

// Zoom creates these non-content files inside every recording folder — skip them
const ZOOM_SKIP = /^(chat|meeting_saved_chat|playback|recording_info|attendee_audio)/i
// Zoom-generated recording filenames — means candidate name is in the FOLDER, not the file
const ZOOM_RECORDING_FILENAME = /^(zoom_?\d*|gmt\d{6,}|audio_only|video_only|gallery|speaker|closed_caption|meeting_saved|screen)/i
// Zoom-generated subfolder names — skip these when looking for candidate folder
const ZOOM_INTERNAL_DIR = /^(zoom_?\d*|gmt\d{6,}|audio_only|gallery|speaker_view|active_speaker)/i

function groupByFolder(files: FileList): Map<string, { mp4: File | null; txt: File | null }> {
  const groups = new Map<string, { mp4: File | null; txt: File | null }>()
  for (const file of Array.from(files)) {
    const relPath = file.webkitRelativePath || file.name
    const parts = relPath.split('/')
    const n = file.name.toLowerCase()
    const nameNoExt = file.name.replace(/\.[^.]+$/, '')

    // Skip Zoom auto-generated non-interview files
    if (ZOOM_SKIP.test(nameNoExt)) continue

    const isVideo = (n.endsWith('.mp4') || n.endsWith('.mov') || n.endsWith('.webm'))
                 && !n.includes('audio_only')
    const isTranscript = n.endsWith('.vtt') || n.endsWith('.txt')
    if (!isVideo && !isTranscript) continue

    let key = ''

    if (parts.length >= 2) {
      // Find nearest non-internal parent folder
      let parentIdx = parts.length - 2
      while (parentIdx > 0 && ZOOM_INTERNAL_DIR.test(parts[parentIdx])) parentIdx--
      const parentKey = parentIdx > 0 ? cleanFolderName(parts[parentIdx]) : ''

      // If the filename itself carries the candidate name (not a Zoom internal name),
      // use it — handles flat files like "YiddisheKop/2025-07-22 Name_ Interview.mp4"
      const cleanedFile = cleanFolderName(nameNoExt)
      if (!ZOOM_RECORDING_FILENAME.test(nameNoExt) && cleanedFile && cleanedFile !== parentKey) {
        key = cleanedFile
      } else {
        key = parentKey
      }
    } else {
      key = cleanFolderName(nameNoExt)
    }

    if (!key) continue
    if (!groups.has(key)) groups.set(key, { mp4: null, txt: null })
    const g = groups.get(key)!
    if (isVideo && !g.mp4) g.mp4 = file
    // prefer .vtt (Zoom native) but fall back to .txt
    else if (isTranscript && !g.txt) g.txt = file
    else if (isTranscript && n.endsWith('.vtt')) g.txt = file
  }
  return groups
}

// Jaro-Winkler similarity (0–1) — handles transpositions and spelling variants
function jaroSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (!a.length || !b.length) return 0
  const dist = Math.floor(Math.max(a.length, b.length) / 2) - 1
  const aM = new Uint8Array(a.length), bM = new Uint8Array(b.length)
  let matches = 0
  for (let i = 0; i < a.length; i++) {
    const lo = Math.max(0, i - dist), hi = Math.min(i + dist + 1, b.length)
    for (let j = lo; j < hi; j++) {
      if (bM[j] || a[i] !== b[j]) continue
      aM[i] = bM[j] = 1; matches++; break
    }
  }
  if (!matches) return 0
  let t = 0, k = 0
  for (let i = 0; i < a.length; i++) {
    if (!aM[i]) continue
    while (!bM[k]) k++
    if (a[i] !== b[k]) t++
    k++
  }
  return (matches / a.length + matches / b.length + (matches - t / 2) / matches) / 3
}

function jaroWinkler(a: string, b: string): number {
  const j = jaroSimilarity(a, b)
  let p = 0
  for (let i = 0; i < Math.min(4, a.length, b.length); i++) {
    if (a[i] === b[i]) p++; else break
  }
  return j + p * 0.1 * (1 - j)
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

    // 3. Relaxed: all input words found in profile (handles middle names)
    m = profiles.find(p => {
      const pw = nameWords(p.label)
      return words.every(w => pw.some(pw2 => pw2.startsWith(w) || w.startsWith(pw2)))
    })
    if (m) return m
  }

  // 4. Substring fallback
  if (key.length >= 6) {
    m = profiles.find(p => {
      const pk = normalize(p.label)
      return pk.includes(key) || key.includes(pk)
    })
    if (m) return m
  }

  // 5. Jaro-Winkler fuzzy: per-word similarity handles spelling variants ("Gittel"/"Gittle", "Rivkah"/"Rivka")
  let best: CandidateOption | null = null
  let bestSim = 0
  for (const p of profiles) {
    const pWords = nameWords(p.label)
    let sim = 0
    if (words.length >= 2 && pWords.length >= 2) {
      let matched = 0
      const used = new Set<number>()
      for (const w of words) {
        let topScore = 0, topIdx = -1
        pWords.forEach((pw, i) => {
          if (used.has(i)) return
          const s = jaroWinkler(w, pw)
          if (s > topScore) { topScore = s; topIdx = i }
        })
        if (topScore >= 0.82) { matched++; used.add(topIdx) }
      }
      sim = matched / Math.max(words.length, pWords.length)
    } else {
      sim = jaroWinkler(key, normalize(p.label))
    }
    if (sim > bestSim) { bestSim = sim; best = p }
  }
  return bestSim >= 0.82 ? best : null
}

// Like matchCandidate but returns the best candidate even below threshold (for suggestions)
function bestFuzzyMatch(name: string, profiles: CandidateOption[]): { match: CandidateOption | null; score: number } {
  const key = normalize(name)
  const words = nameWords(name)

  // Check exact / word-order passes first
  const exact = matchCandidate(name, profiles)
  if (exact) return { match: exact, score: 1 }

  let best: CandidateOption | null = null
  let bestSim = 0
  for (const p of profiles) {
    const pWords = nameWords(p.label)
    let sim = 0
    if (words.length >= 2 && pWords.length >= 2) {
      let matched = 0
      const used = new Set<number>()
      for (const w of words) {
        let topScore = 0, topIdx = -1
        pWords.forEach((pw, i) => {
          if (used.has(i)) return
          const s = jaroWinkler(w, pw)
          if (s > topScore) { topScore = s; topIdx = i }
        })
        if (topScore >= 0.7) { matched++; used.add(topIdx) }
      }
      sim = matched / Math.max(words.length, pWords.length)
    } else {
      sim = jaroWinkler(key, normalize(p.label))
    }
    if (sim > bestSim) { bestSim = sim; best = p }
  }
  return { match: bestSim >= 0.6 ? best : null, score: bestSim }
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
  // near-match suggestions for video candidates that didn't fully auto-match
  const [suggestions, setSuggestions] = useState<Record<string, CandidateOption>>({})
  const [confirmingSuggestion, setConfirmingSuggestion] = useState<string | null>(null)

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
    const opts: CandidateOption[] = ((profs ?? []) as any[]).map(p => ({ id: p.id, label: p.full_name ?? p.id }))
    setUnassigned((vids ?? []) as UnassignedVideo[])
    setVideoCandidates((vcs ?? []) as VideoCandidate[])
    setCandidateOptions(opts)

    // Pre-compute near-match suggestions for unmatched video candidates
    const sugg: Record<string, CandidateOption> = {}
    for (const vc of vcs ?? []) {
      if (matchCandidate(cleanFolderName(vc.name), opts)) continue // already exact match
      const { match } = bestFuzzyMatch(cleanFolderName(vc.name), opts)
      if (match) sugg[vc.id] = match
    }
    setSuggestions(sugg)
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
    const newSugg: Record<string, CandidateOption> = {}

    await Promise.all(videoCandidates.map(async vc => {
      const cleaned = cleanFolderName(vc.name)
      const hit = matchCandidate(cleaned, opts)
      if (hit) {
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
      } else {
        // Collect near-matches for manual review
        const { match } = bestFuzzyMatch(cleaned, opts)
        if (match) newSugg[vc.id] = match
      }
    }))

    setVideoCandidates(prev => prev.filter(v => !toRemove.includes(v.id)))
    setSuggestions(prev => ({ ...prev, ...newSugg }))
    const nearCount = Object.keys(newSugg).length
    setRematchResult(
      `Matched ${matched} of ${videoCandidates.length}.` +
      (nearCount > 0 ? ` ${nearCount} need review (see suggestions below).` : '')
    )
    setRematching(false)
  }

  // ── Confirm a near-match suggestion ────────────────────────────────────
  async function handleConfirmSuggestion(vcId: string) {
    const hit = suggestions[vcId]
    if (!hit) return
    setConfirmingSuggestion(vcId)
    const supabase = createClient()
    const vc = videoCandidates.find(v => v.id === vcId)
    if (vc) {
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
    }
    await supabase.from('video_candidates').delete().eq('id', vcId)
    setVideoCandidates(prev => prev.filter(v => v.id !== vcId))
    setSuggestions(prev => { const n = { ...prev }; delete n[vcId]; return n })
    setConfirmingSuggestion(null)
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
      const n = file.name.toLowerCase()
      if (!n.endsWith('.txt') && !n.endsWith('.vtt')) continue
      const key = cleanFolderName(file.name.replace(/\.[^.]+$/, ''))
      if (!key) continue
      entries.push({ key, txt: file })
    }
    const reads = await Promise.all(entries.map(async e => {
      const raw = await e.txt.text()
      const text = e.txt.name.toLowerCase().endsWith('.vtt') ? parseVtt(raw) : raw
      return { key: e.key, text, fname: e.txt.name }
    }))
    mergeBulkTranscripts(reads)
  }

  async function mergeBulkRows(entries: { key: string; videoFile: File | null; transcriptFile: File | null; transcriptText: string | null }[]) {
    const supabase = createClient()
    const { data: profs } = await supabase.from('candidate_profiles').select('id, full_name').order('full_name')
    const opts: CandidateOption[] = ((profs ?? []) as any[]).map(p => ({ id: p.id, label: p.full_name ?? '' }))

    const reads = await Promise.all(entries.map(async e => {
      if (!e.transcriptFile) return { ...e }
      const raw = await e.transcriptFile.text()
      const transcriptText = e.transcriptFile.name.toLowerCase().endsWith('.vtt') ? parseVtt(raw) : raw
      return { ...e, transcriptText }
    }))

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
    const urlRes = await fetch('/api/mux/upload-url', { method: 'POST' })
    if (!urlRes.ok) {
      const text = await urlRes.text().catch(() => '')
      throw new Error(`Upload URL failed (${urlRes.status})${text ? ': ' + text : ''}`)
    }
    const { uploadId, url } = await urlRes.json()
    const putRes = await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'video/mp4' } })
    if (!putRes.ok) throw new Error(`File upload failed (${putRes.status})`)
    onStatus('processing')
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 4000))
      const poll = await fetch(`/api/mux/asset/${uploadId}`)
      if (!poll.ok) continue
      const data = await poll.json()
      if (data.status === 'ready') return { assetId: data.assetId, playbackId: data.playbackId }
      if (data.status === 'errored') throw new Error('Mux processing failed')
    }
    throw new Error('Timed out waiting for video')
  }

  async function processOneRow(row: BulkRow, supabase: ReturnType<typeof createClient>) {
    if (row.status === 'done') return
    try {
      let muxAssetId: string | null = null
      let muxPlaybackId: string | null = null
      if (row.videoFile) {
        const mux = await uploadToMux(row.videoFile, s => updateBulkRow(row.key, { status: s }))
        muxAssetId = mux?.assetId ?? null
        muxPlaybackId = mux?.playbackId ?? null
      }
      updateBulkRow(row.key, { status: 'saving' })
      if (row.matchedId) {
        const { error: insErr } = await supabase.from('videos').insert({
          candidate_id: row.matchedId,
          mux_asset_id: muxAssetId, mux_playback_id: muxPlaybackId,
          transcript: row.transcriptText ?? null, approved: true,
        })
        if (insErr) throw new Error(insErr.message)
        await supabase.from('candidate_profiles').update({
          interviewed: true, interviewed_at: new Date().toISOString(),
        }).eq('id', row.matchedId)
      } else {
        const { error: insErr } = await supabase.from('video_candidates').insert({
          name: row.candidateName.trim(),
          mux_asset_id: muxAssetId, mux_playback_id: muxPlaybackId,
          transcript: row.transcriptText ?? null,
        })
        if (insErr) throw new Error(insErr.message)
      }
      updateBulkRow(row.key, { status: 'done', error: null })
    } catch (err: any) {
      updateBulkRow(row.key, { status: 'error', error: err.message ?? 'Failed' })
    }
  }

  async function runBulkUpload() {
    setBulkRunning(true)
    const supabase = createClient()
    const pending = bulkRows.filter(r => r.status !== 'done')

    // Process max 2 video uploads concurrently to avoid overwhelming the Mux API
    const CONCURRENCY = 2
    let idx = 0
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, pending.length) }, async () => {
        while (idx < pending.length) {
          const row = pending[idx++]
          await processOneRow(row, supabase)
        }
      })
    )
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
                {suggestions[vc.id] && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                      Possible match: <strong>{suggestions[vc.id].label}</strong>
                    </span>
                    <button
                      onClick={() => handleConfirmSuggestion(vc.id)}
                      disabled={confirmingSuggestion === vc.id}
                      className="text-xs text-emerald-600 hover:text-emerald-800 font-medium disabled:opacity-50">
                      {confirmingSuggestion === vc.id ? 'Linking…' : '✓ Confirm'}
                    </button>
                    <button
                      onClick={() => setSuggestions(p => { const n = { ...p }; delete n[vc.id]; return n })}
                      className="text-xs text-gray-400 hover:text-gray-600">
                      ✕
                    </button>
                  </div>
                )}
                <Link href={`/dashboard/admin/video-candidates/${vc.id}`}
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline underline-offset-2 block mt-1">
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

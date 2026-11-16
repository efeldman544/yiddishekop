'use client'

import { useEffect, useRef, useState } from 'react'
import { humanError } from '@/lib/errorMessage'
import ErrorNote from '@/components/ErrorNote'

// Videos with no transcript, and the button that gets Mux to make them.
//
// Mux takes a few minutes per video, so this is two passes rather than one:
// ask, then come back for the results. After asking, the strip keeps checking
// by itself while the page is open, and picks up where it left off the next
// time the button is pressed — nothing is lost by closing the tab.

type Ref = { table: 'videos' | 'video_candidates'; id: string; name?: string | null }
type Result = Ref & { status: string; reason?: string }

const CHUNK = 3
const PARALLEL = 2
const RECHECK_MS = 45_000
const MAX_RECHECKS = 20

async function post(body: object): Promise<Response> {
  return fetch('/api/admin/transcripts', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
}

export default function TranscriptsStatus({ onSaved }: { onSaved: () => void }) {
  const [missing, setMissing] = useState<Ref[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [waiting, setWaiting] = useState<Ref[]>([])
  const [tally, setTally] = useState<{ saved: number; failed: number; firstFailure: string | null } | null>(null)
  const stop = useRef(false)
  // How many times it has looked again by itself since the button was pressed.
  const [rechecks, setRechecks] = useState(0)

  useEffect(() => {
    let cancelled = false
    post({ stage: 'status' })
      .then(r => (r.ok ? r.json() : r.text().then(t => Promise.reject(new Error(t || `HTTP ${r.status}`)))))
      .then(d => { if (!cancelled) setMissing(d.missing ?? []) })
      .catch(e => { if (!cancelled) setError(humanError(e, 'Couldn’t check which videos have transcripts.')) })
    return () => { cancelled = true; stop.current = true }
  }, [])

  /** One pass over some videos. Returns the ones Mux is still working on. */
  async function pass(items: Ref[], request: boolean): Promise<Ref[]> {
    const chunks: Ref[][] = []
    for (let i = 0; i < items.length; i += CHUNK) chunks.push(items.slice(i, i + CHUNK))
    const still: Ref[] = []
    let saved = 0, failed = 0
    let firstFailure: string | null = null
    let next = 0
    setProgress({ done: 0, total: items.length })
    await Promise.all(Array.from({ length: Math.min(PARALLEL, chunks.length) }, async () => {
      while (next < chunks.length && !stop.current) {
        const chunk = chunks[next++]
        try {
          const res = await post({ stage: 'sync', request, items: chunk.map(({ table, id }) => ({ table, id })) })
          if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`))
          for (const r of ((await res.json()).results ?? []) as Result[]) {
            if (r.status === 'saved') saved++
            else if (r.status === 'requested' || r.status === 'pending') still.push({ table: r.table, id: r.id })
            else if (r.status === 'failed') { failed++; firstFailure ??= r.reason ?? null }
          }
        } catch (e) {
          failed += chunk.length
          firstFailure ??= humanError(e, 'The request failed.')
        }
        setProgress(prev => prev ? { ...prev, done: Math.min(prev.done + chunk.length, prev.total) } : prev)
      }
    }))
    setProgress(null)
    setTally(prev => ({
      saved: (prev?.saved ?? 0) + saved,
      failed: (prev?.failed ?? 0) + failed,
      firstFailure: prev?.firstFailure ?? firstFailure,
    }))
    if (saved > 0) onSaved()
    return still
  }

  async function refreshMissing() {
    try {
      const res = await post({ stage: 'status' })
      if (res.ok) setMissing((await res.json()).missing ?? [])
    } catch { /* the list refreshes on the next visit */ }
  }

  async function start() {
    if (!missing || progress) return
    stop.current = false
    setRechecks(0)
    setError(null); setTally(null)
    const still = await pass(missing, true)
    await refreshMissing()
    setWaiting(still)
  }

  // While Mux is still transcribing, look again every so often. Only collects:
  // nothing new is asked for on these rounds.
  useEffect(() => {
    if (waiting.length === 0 || progress) return
    if (rechecks >= MAX_RECHECKS) return
    const timer = setTimeout(async () => {
      if (stop.current) return
      setRechecks(n => n + 1)
      const still = await pass(waiting, false)
      await refreshMissing()
      setWaiting(still)
    }, RECHECK_MS)
    return () => clearTimeout(timer)
  }, [waiting, progress, rechecks]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error && !missing) return <ErrorNote>{error}</ErrorNote>
  if (!missing) return null
  if (missing.length === 0 && !tally) return null

  const gaveUp = waiting.length > 0 && rechecks >= MAX_RECHECKS

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-gray-900">
            {missing.length === 0
              ? 'Every video has a transcript'
              : `${missing.length} video${missing.length === 1 ? ' has' : 's have'} no transcript`}
          </p>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {progress
              ? `Working… ${progress.done} of ${progress.total}`
              : waiting.length > 0 && !gaveUp
                ? `Mux is transcribing ${waiting.length}. This page checks again every minute; you can leave and come back.`
                : gaveUp
                  ? `${waiting.length} are still being transcribed. Press the button again later to collect them.`
                  : missing.length > 0
                    ? 'Mux can transcribe them from the recording. It takes a few minutes per video.'
                    : ''}
          </p>
        </div>
        {missing.length > 0 && !progress && (
          <button type="button" onClick={start}
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
            {waiting.length > 0 || tally ? 'Check again' : `Transcribe ${missing.length === 1 ? 'it' : `all ${missing.length}`}`}
          </button>
        )}
      </div>

      {progress && progress.total > 0 && (
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-400 rounded-full transition-all duration-300"
            style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
        </div>
      )}

      {tally && (tally.saved > 0 || tally.failed > 0) && (
        <p className="text-[12px] text-gray-600">
          {tally.saved > 0 && `Saved ${tally.saved} transcript${tally.saved === 1 ? '' : 's'}. `}
          {tally.failed > 0 && `${tally.failed} couldn’t be transcribed${tally.firstFailure ? `: ${tally.firstFailure}` : ''}.`}
        </p>
      )}

      {error && <ErrorNote>{error}</ErrorNote>}
    </div>
  )
}

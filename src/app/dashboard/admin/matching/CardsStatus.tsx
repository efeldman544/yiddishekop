'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { humanError } from '@/lib/errorMessage'
import ErrorNote from '@/components/ErrorNote'

// Candidate cards: who has one, whose is out of date, and the button that
// builds them.
//
// Building costs money and, for everybody already in the system, takes a few
// minutes, so nothing here happens on its own. The strip says what is missing,
// offers an estimate that counts the real requests without sending them, and
// builds only when asked. It stays out of the way entirely when every card is
// current and every resume was readable.

type Item = { id: string; source: 'profile' | 'video' }
type Status =
  | { ready: false; total: number }
  | {
      ready: true; total: number; built: number; stale: Item[]
      unreadable: { id: string; source: 'profile' | 'video'; name: string | null; note: string | null }[]
      images: number; noResume: number; spentUsd: number
    }

const ESTIMATE_CHUNK = 5
const BUILD_CHUNK = 3
const PARALLEL = 3

const dollars = (n: number) => n < 0.01 && n > 0 ? 'under 1¢' : `$${n.toFixed(2)}`

async function post(body: object): Promise<Response> {
  return fetch('/api/admin/candidate-cards', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
}

function chunked<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

export default function CardsStatus({ onChanged }: { onChanged: () => void }) {
  const [status, setStatus] = useState<Status | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [estimate, setEstimate] = useState<{ usd: number; visual: number; failed: number } | null>(null)
  const [progress, setProgress] = useState<{ kind: 'estimate' | 'build'; done: number; total: number } | null>(null)
  const [report, setReport] = useState<{ built: number; failed: number; usd: number; firstFailure: string | null } | null>(null)
  const [showUnreadable, setShowUnreadable] = useState(false)
  const stop = useRef(false)

  async function fetchStatus(): Promise<Status> {
    const res = await post({ stage: 'status' })
    if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`))
    return res.json()
  }

  async function refresh() {
    try {
      setStatus(await fetchStatus())
    } catch (e) {
      setError(humanError(e, 'Couldn’t check the candidate cards.'))
    }
  }

  useEffect(() => {
    let cancelled = false
    fetchStatus()
      .then(s => { if (!cancelled) setStatus(s) })
      .catch(e => { if (!cancelled) setError(humanError(e, 'Couldn’t check the candidate cards.')) })
    return () => { cancelled = true }
  }, [])

  /** Run every chunk through the API, a few at a time, until done or stopped. */
  async function run<R>(
    kind: 'estimate' | 'build',
    items: Item[],
    size: number,
    extra: object,
    each: (result: R) => void,
    onRequestFailed: (count: number, message: string) => void,
  ) {
    stop.current = false
    const chunks = chunked(items, size)
    setProgress({ kind, done: 0, total: items.length })
    let next = 0
    await Promise.all(Array.from({ length: Math.min(PARALLEL, chunks.length) }, async () => {
      while (next < chunks.length && !stop.current) {
        const chunk = chunks[next++]
        try {
          const res = await post({ stage: kind, items: chunk, ...extra })
          if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`))
          for (const r of (await res.json()).results ?? []) each(r)
        } catch (e) {
          onRequestFailed(chunk.length, humanError(e, 'The request failed.'))
        }
        setProgress(prev => prev ? { ...prev, done: Math.min(prev.done + chunk.length, prev.total) } : prev)
      }
    }))
    setProgress(null)
  }

  async function runEstimate() {
    if (!status?.ready || progress) return
    setError(null); setReport(null)
    let usd = 0, visual = 0, failed = 0
    let firstFailure: string | null = null
    await run<{ status: string; usd?: number; resumeStatus?: string; message?: string }>(
      'estimate', status.stale, ESTIMATE_CHUNK, {},
      r => {
        if (r.status === 'counted') { usd += r.usd ?? 0; if (r.resumeStatus === 'image') visual++ }
        else if (r.status === 'error') { failed++; firstFailure ??= r.message ?? null }
      },
      (count, message) => { failed += count; firstFailure ??= message },
    )
    setEstimate({ usd, visual, failed })
    if (failed > 0 && firstFailure) setError(`${failed} couldn’t be counted. ${firstFailure}`)
  }

  async function runBuild() {
    if (!status?.ready || progress) return
    setError(null); setReport(null); setEstimate(null)
    let built = 0, failed = 0, usd = 0
    let firstFailure: string | null = null
    await run<{ status: string; usd?: number; message?: string }>(
      'build', status.stale, BUILD_CHUNK, {},
      r => {
        if (r.status === 'built') { built++; usd += r.usd ?? 0 }
        else if (r.status === 'error') { failed++; firstFailure ??= r.message ?? null }
      },
      (count, message) => { failed += count; firstFailure ??= message },
    )
    setReport({ built, failed, usd, firstFailure })
    await refresh()
    // Scores made from the old cards are out of date now.
    if (built > 0) onChanged()
  }

  if (error && !status) return <ErrorNote>{error}</ErrorNote>
  if (!status) return null

  if (!status.ready) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
        Candidates are being ranked on their profile fields only. To have their resumes read, run{' '}
        <code className="font-mono text-[12px]">supabase/candidate_cards.sql</code> in the Supabase SQL editor, then reload this page.
      </div>
    )
  }

  const pending = status.stale.length
  const nothingToSay = pending === 0 && status.unreadable.length === 0 && !report && !error
  if (nothingToSay) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 space-y-2.5">
      {pending > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-gray-900">
              {pending === status.total
                ? `No resumes have been read yet (${status.total} candidates)`
                : `${pending} candidate${pending === 1 ? '' : 's'} need${pending === 1 ? 's' : ''} their resume read`}
            </p>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {progress
                ? `${progress.kind === 'build' ? 'Reading resumes' : 'Counting'}… ${progress.done} of ${progress.total}. Keep this tab open.`
                : estimate
                  ? `About ${dollars(estimate.usd)} to read ${pending - estimate.failed}${estimate.visual ? `, ${estimate.visual} of them photos or scans` : ''}. The reading is counted exactly; the writing is an allowance.`
                  : 'Until then they are ranked on their profile fields alone.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {progress ? (
              <button type="button" onClick={() => { stop.current = true }}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400">
                Stop
              </button>
            ) : (
              <>
                <button type="button" onClick={runEstimate}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400">
                  Estimate cost
                </button>
                <button type="button" onClick={runBuild}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                  Read {pending === 1 ? 'it' : `all ${pending}`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {progress && progress.total > 0 && (
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-400 rounded-full transition-all duration-300"
            style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
        </div>
      )}

      {report && (
        <p className="text-[12px] text-gray-600">
          Read {report.built} resume{report.built === 1 ? '' : 's'} for {dollars(report.usd)}.
          {report.failed > 0 && ` ${report.failed} failed${report.firstFailure ? `: ${report.firstFailure}` : '.'}`}
          {' '}All cards so far have cost {dollars(status.spentUsd)}.
        </p>
      )}

      {status.unreadable.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowUnreadable(v => !v)}
            className="text-[12px] font-medium text-amber-700 hover:text-amber-900">
            {status.unreadable.length} resume{status.unreadable.length === 1 ? '' : 's'} couldn&rsquo;t be read {showUnreadable ? '▴' : '▾'}
          </button>
          {showUnreadable && (
            <ul className="mt-1.5 space-y-1">
              {status.unreadable.map(u => (
                <li key={u.id} className="text-[12px] text-gray-600">
                  <Link href={`/dashboard/admin/${u.source === 'video' ? 'video-candidates' : 'candidates'}/${u.id}?from=matching`}
                    className="font-medium text-indigo-700 hover:underline">{u.name ?? 'Unnamed'}</Link>
                  {u.note ? ` — ${u.note}` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <ErrorNote>{error}</ErrorNote>}
    </div>
  )
}

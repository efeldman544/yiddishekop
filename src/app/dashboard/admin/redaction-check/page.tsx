'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { humanError } from '@/lib/errorMessage'
import { resumeHref } from '@/lib/resumeUrl'
import ErrorNote from '@/components/ErrorNote'

// Every resume, checked the way an employer would see it: fetched redacted,
// then read back off the finished pages to see whether a phone number, an
// email or a surname is still showing. Admins only (the API checks).

type Candidate = { id: string; name: string | null }
type Result =
  | { id: string; status: 'leak' | 'surname' | 'ok'; found: string[]; pages: number; unread: boolean }
  | { id: string; status: 'refused' | 'error'; message: string }

// Each check renders and OCRs a resume on the server, a few seconds apiece.
// Two at a time keeps a run of a few hundred to a reasonable wait without
// piling requests onto the server.
const PARALLEL = 2

async function post(body: object) {
  const res = await fetch('/api/admin/redaction-check', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error((await res.text().catch(() => '')) || `HTTP ${res.status}`)
  return res.json()
}

const GROUPS: { key: Result['status']; title: string; note: string; tone: string }[] = [
  { key: 'leak', title: 'Contact details showing', note: 'An employer can read these. Open each one to see it.', tone: 'text-red-700' },
  { key: 'surname', title: 'Surname showing', note: 'Phone and email are covered, but the surname can still be read.', tone: 'text-amber-700' },
  { key: 'error', title: 'Couldn’t be checked', note: 'The check itself failed. Running it again may work.', tone: 'text-gray-700' },
  { key: 'refused', title: 'Not shown to employers', note: 'Employers get a message instead of the resume, so nothing leaks. They also can’t see these resumes.', tone: 'text-gray-700' },
  { key: 'ok', title: 'Nothing showing', note: '', tone: 'text-emerald-700' },
]

export default function RedactionCheckPage() {
  const [candidates, setCandidates] = useState<Candidate[] | null>(null)
  const [results, setResults] = useState<Record<string, Result>>({})
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const stop = useRef(false)

  useEffect(() => {
    post({ stage: 'list' })
      .then(d => setCandidates(d.candidates ?? []))
      .catch(e => setError(humanError(e, 'Couldn’t load the list of resumes.')))
    return () => { stop.current = true }
  }, [])

  async function run(ids: string[]) {
    if (running) return
    stop.current = false
    setRunning(true); setError(null)
    setResults(prev => { const next = { ...prev }; for (const id of ids) delete next[id]; return next })
    let next = 0
    await Promise.all(Array.from({ length: Math.min(PARALLEL, ids.length) }, async () => {
      while (next < ids.length && !stop.current) {
        const id = ids[next++]
        let result: Result
        try {
          result = await post({ stage: 'check', id })
        } catch (e) {
          result = { id, status: 'error', message: humanError(e, 'The check failed.') }
        }
        setResults(prev => ({ ...prev, [id]: result }))
      }
    }))
    setRunning(false)
  }

  if (!candidates) {
    return <main className="dash-page">{error ? <ErrorNote>{error}</ErrorNote> : <p className="text-sm text-gray-400">Loading…</p>}</main>
  }

  const names = new Map(candidates.map(c => [c.id, c.name]))
  const done = Object.keys(results).length
  const all = candidates.map(c => c.id)
  const failed = Object.values(results).filter(r => r.status === 'error').map(r => r.id)

  return (
    <main className="dash-page">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/admin" className="text-xs text-gray-400 hover:text-gray-600">← Candidates</Link>
          <h1 className="page-title">Redaction check</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gets each resume the way an employer would, then reads the finished pages back to see if anything that should be hidden is still showing.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {running ? (
            <button type="button" onClick={() => { stop.current = true }}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
              Stop
            </button>
          ) : (
            <>
              {failed.length > 0 && (
                <button type="button" onClick={() => run(failed)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
                  Retry {failed.length} failed
                </button>
              )}
              <button type="button" onClick={() => run(all)} disabled={all.length === 0}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                {done > 0 ? 'Check all again' : `Check all ${all.length}`}
              </button>
            </>
          )}
        </div>
      </div>

      {(running || done > 0) && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500">{running ? `Checking… ${done} of ${all.length}` : `Checked ${done} of ${all.length}`}</p>
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-400 rounded-full transition-all duration-300"
              style={{ width: `${all.length ? Math.round((done / all.length) * 100) : 0}%` }} />
          </div>
        </div>
      )}

      {error && <ErrorNote>{error}</ErrorNote>}

      {GROUPS.map(group => {
        const rows = Object.values(results).filter(r => r.status === group.key)
        if (rows.length === 0) return null
        return (
          <section key={group.key} className="rounded-xl border border-gray-200 bg-white">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className={`text-[13px] font-semibold ${group.tone}`}>{group.title} · {rows.length}</p>
              {group.note && <p className="text-[12px] text-gray-500 mt-0.5">{group.note}</p>}
            </div>
            {group.key !== 'ok' && (
              <ul className="divide-y divide-gray-100">
                {rows.map(r => (
                  <li key={r.id} className="px-4 py-2.5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link href={`/dashboard/admin/candidates/${r.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                        {names.get(r.id) || 'Unnamed candidate'}
                      </Link>
                      <p className="text-[12px] text-gray-500 mt-0.5 break-words">
                        {'message' in r
                          ? r.message
                          : r.found.length > 0
                            ? `Readable: ${r.found.join(', ')}`
                            : r.unread ? 'The pages could hardly be read back, so this result is unsure.' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      {r.status !== 'refused' && r.status !== 'error' && (
                        <a href={`${resumeHref(r.id, names.get(r.id))}?as=employer`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                          As employer
                        </a>
                      )}
                      <button type="button" disabled={running} onClick={() => run([r.id])} className="text-gray-500 hover:text-gray-800 disabled:opacity-50">
                        Recheck
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </main>
  )
}

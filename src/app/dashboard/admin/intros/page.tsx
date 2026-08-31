'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { notifyAssigned } from '@/lib/notifyAssigned'

type Request = {
  id: string
  employer_id: string
  candidate_id: string | null
  candidate_name: string | null
  candidate_ref: string | null
  status: string
  created_at: string
}

export default function IntroRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [employers, setEmployers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [assigned, setAssigned] = useState<Set<string>>(new Set())
  const [rowError, setRowError] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('introduction_requests')
        .select('id, employer_id, candidate_id, candidate_name, candidate_ref, status, created_at')
        .order('created_at', { ascending: false })

      if (err) {
        // Most likely the migration hasn't been run yet — say so plainly
        // instead of showing an empty queue that looks like "no requests".
        setError(
          /does not exist|schema cache/i.test(err.message)
            ? 'The introduction_requests table doesn’t exist yet — run supabase/introduction_requests.sql in the Supabase SQL editor.'
            : err.message
        )
        setLoading(false)
        return
      }

      const list = (data ?? []) as Request[]
      setRequests(list)

      const ids = [...new Set(list.map(r => r.employer_id))]
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from('profiles').select('id, full_name, email').in('id', ids)
        const map: Record<string, string> = {}
        for (const p of profs ?? []) map[p.id] = p.full_name ?? p.email ?? 'Unknown'
        setEmployers(map)
      }
      // An intro may already have been acted on; showing "Assign" for one that
      // is already assigned would invite a duplicate.
      const pairs = list.filter(r => r.candidate_id)
      if (pairs.length > 0) {
        const { data: existing } = await supabase
          .from('employer_candidate_assignments')
          .select('employer_id, candidate_id')
          .in('candidate_id', pairs.map(r => r.candidate_id as string))
        const have = new Set(
          (existing ?? []).map((a: { employer_id: string; candidate_id: string }) =>
            `${a.employer_id}:${a.candidate_id}`),
        )
        setAssigned(new Set(pairs.filter(r => have.has(`${r.employer_id}:${r.candidate_id}`)).map(r => r.id)))
      }

      setLoading(false)
    }
    load()
  }, [])

  function noteError(id: string, message: string) {
    setRowError(prev => ({ ...prev, [id]: message }))
  }

  async function setStatus(id: string, status: string) {
    setBusy(id)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('introduction_requests').update({ status }).eq('id', id)
    if (err) noteError(id, `Couldn't update: ${err.message}`)
    else setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setBusy(null)
  }

  async function remove(id: string) {
    if (!confirm('Delete this introduction request? This cannot be undone.')) return
    setBusy(id)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('introduction_requests').delete().eq('id', id)
    // Only drop it from the list once the database agrees it's gone —
    // removing it optimistically would hide a failure.
    if (err) noteError(id, `Couldn't delete: ${err.message}`)
    else setRequests(prev => prev.filter(r => r.id !== id))
    setBusy(null)
  }

  // The whole point of the queue is to put this candidate in front of this
  // employer, so do it here rather than sending the admin off to the candidate
  // page to repeat what the request already says.
  async function assign(r: Request) {
    if (!r.candidate_id) return
    setBusy(r.id)
    setRowError(prev => { const next = { ...prev }; delete next[r.id]; return next })
    const supabase = createClient()

    // Check first rather than relying on a unique constraint the table may not
    // have — the same pair can already have been assigned from the candidate
    // page, and a second row would be silent duplicate data.
    const { data: existing } = await supabase
      .from('employer_candidate_assignments')
      .select('id')
      .eq('employer_id', r.employer_id)
      .eq('candidate_id', r.candidate_id)
      .limit(1)

    if (!existing?.length) {
      const { error: err } = await supabase
        .from('employer_candidate_assignments')
        .insert({ employer_id: r.employer_id, candidate_id: r.candidate_id })
      if (err) {
        noteError(r.id, `Couldn't assign: ${err.message}`)
        setBusy(null)
        return
      }
    }

    setAssigned(prev => new Set(prev).add(r.id))
    await notifyAssigned(
      { candidate_id: r.candidate_id, employer_id: r.employer_id },
      msg => noteError(r.id, `Assigned, but the employer wasn't notified: ${msg}`),
    )

    // Assigning is the action this request was asking for, so it's handled.
    const { error: statusErr } = await supabase
      .from('introduction_requests').update({ status: 'actioned' }).eq('id', r.id)
    if (!statusErr) setRequests(prev => prev.map(x => x.id === r.id ? { ...x, status: 'actioned' } : x))
    setBusy(null)
  }

  const open = requests.filter(r => r.status === 'new')
  const done = requests.filter(r => r.status !== 'new')

  return (
    <main className="px-8 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-950 tracking-tight">Introduction requests</h1>
        <span className="text-sm text-gray-400">{open.length} awaiting action</span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400 py-12 text-center">Loading…</div>
      ) : requests.length === 0 && !error ? (
        <div className="text-sm text-gray-400 py-12 text-center">
          No introduction requests yet. They appear here when an employer asks to meet
          someone from the browse page.
        </div>
      ) : (
        <div className="space-y-3">
          {[...open, ...done].map(r => (
            <div
              key={r.id}
              className={`bg-white rounded-xl border shadow-sm px-5 py-4 ${r.status === 'new' ? 'border-indigo-200' : 'border-gray-100 opacity-70'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    {employers[r.employer_id] ?? 'Unknown employer'}
                    <span className="font-normal text-gray-400"> wants to meet </span>
                    {r.candidate_id ? (
                      <Link href={`/dashboard/admin/candidates/${r.candidate_id}`} className="text-indigo-700 hover:underline">
                        {r.candidate_name ?? 'a candidate'}
                      </Link>
                    ) : (
                      <span className="text-gray-900">{r.candidate_name ?? `Candidate #${r.candidate_ref ?? ''}`}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(r.created_at).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                    {r.status !== 'new' && <> · {r.status}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.status === 'new' && (
                    <>
                      {r.candidate_id && (
                        <button
                          onClick={() => assign(r)}
                          disabled={busy === r.id || assigned.has(r.id)}
                          className="text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-2.5 py-1 rounded-md transition-colors"
                        >
                          {assigned.has(r.id) ? 'Assigned' : 'Assign to employer'}
                        </button>
                      )}
                      <button
                        onClick={() => setStatus(r.id, 'actioned')}
                        disabled={busy === r.id}
                        className="text-xs font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 px-2.5 py-1 rounded-md transition-colors"
                      >
                        Mark handled
                      </button>
                      <button
                        onClick={() => setStatus(r.id, 'dismissed')}
                        disabled={busy === r.id}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => remove(r.id)}
                    disabled={busy === r.id}
                    className="text-xs text-gray-300 hover:text-red-600 transition-colors"
                    title="Delete this request"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {!r.candidate_id && r.status === 'new' && (
                <p className="mt-2 text-xs text-gray-400">
                  This is a video candidate, who isn&apos;t in the assignable candidate list —
                  handle the introduction directly.
                </p>
              )}
              {rowError[r.id] && (
                <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {rowError[r.id]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

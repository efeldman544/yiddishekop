'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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
      setLoading(false)
    }
    load()
  }, [])

  async function setStatus(id: string, status: string) {
    setBusy(id)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('introduction_requests').update({ status }).eq('id', id)
    if (!err) setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
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
                {r.status === 'new' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setStatus(r.id, 'actioned')}
                      disabled={busy === r.id}
                      className="text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded-md transition-colors"
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
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

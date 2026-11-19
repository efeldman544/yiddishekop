'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Ctrl+K (⌘K on a Mac), or the search box in the header, from any admin page:
// type part of a name, email, company or job title and jump straight to it,
// instead of going to the right list and searching there.

type Result = { kind: 'Candidate' | 'Video candidate' | 'Employer' | 'Job'; title: string; detail: string; href: string }

const PER_KIND = 5

async function search(term: string): Promise<Result[]> {
  // Characters that would break the filter syntax are dropped.
  const t = term.replace(/[,()%*\\]/g, ' ').trim()
  if (t.length < 2) return []
  const like = `%${t}%`
  const db = createClient()
  const [profiles, videos, employers, jobs] = await Promise.all([
    db.from('candidate_profiles').select('id, full_name, email, current_job_title, location')
      .or(`full_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`).limit(PER_KIND),
    db.from('video_candidates').select('id, name, current_job_title, location')
      .ilike('name', like).limit(PER_KIND),
    db.from('profiles').select('id, full_name, email').eq('role', 'employer')
      .or(`full_name.ilike.${like},email.ilike.${like}`).limit(PER_KIND),
    db.from('job_requirements').select('id, job_title, company_name, status')
      .or(`job_title.ilike.${like},company_name.ilike.${like}`).limit(PER_KIND),
  ])
  const line = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(' · ')
  return [
    ...(profiles.data ?? []).map(p => ({
      kind: 'Candidate' as const, title: p.full_name ?? p.email ?? 'Unnamed',
      detail: line(p.current_job_title, p.location), href: `/dashboard/admin/candidates/${p.id}`,
    })),
    ...(videos.data ?? []).map(v => ({
      kind: 'Video candidate' as const, title: v.name ?? 'Unnamed',
      detail: line(v.current_job_title, v.location), href: `/dashboard/admin/video-candidates/${v.id}`,
    })),
    ...(employers.data ?? []).map(e => ({
      kind: 'Employer' as const, title: e.full_name ?? e.email ?? 'Unnamed',
      detail: e.email ?? '', href: `/dashboard/admin/jobs?tab=employers&employer=${e.id}`,
    })),
    // A job opens in Matching, where its candidates are ranked.
    ...(jobs.data ?? []).map(j => ({
      kind: 'Job' as const, title: j.job_title ?? 'Untitled job',
      detail: line(j.company_name, j.status), href: `/dashboard/admin/matching?job=${j.id}`,
    })),
  ]
}

export default function QuickSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [searching, setSearching] = useState(false)
  const [active, setActive] = useState(0)
  const seq = useRef(0)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Search a moment after typing stops; only the latest answer is shown.
  useEffect(() => {
    if (!open) return
    const n = ++seq.current
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const found = await search(term)
        if (n === seq.current) { setResults(found); setActive(0) }
      } finally {
        if (n === seq.current) setSearching(false)
      }
    }, 200)
    return () => clearTimeout(t)
  }, [term, open])

  function close() { setOpen(false); setTerm(''); setResults([]) }

  function go(r: Result | undefined) {
    if (!r) return
    close()
    router.push(r.href)
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); close() }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter') { e.preventDefault(); go(results[active]) }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="dash-link-dim hidden md:flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <span>Search</span>
        <kbd className="ml-4 text-[10px] opacity-70">Ctrl K</kbd>
      </button>

      {open && (
        // data-modal: keeps page shortcuts (← → on a candidate) from firing behind it.
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/30 px-4 pt-[12vh]" data-modal
          onMouseDown={e => { if (e.target === e.currentTarget) close() }}>
          <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center gap-3 border-b border-gray-100 px-4">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input autoFocus value={term} onChange={e => setTerm(e.target.value)} onKeyDown={onInputKey}
                placeholder="Find a candidate, employer or job…"
                className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-gray-400" />
              <kbd className="text-[10px] text-gray-400">Esc</kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto py-1">
              {term.trim().length < 2 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">Type at least two letters.</p>
              ) : results.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">{searching ? 'Searching…' : 'Nothing found.'}</p>
              ) : results.map((r, i) => (
                <button key={r.href} type="button" onMouseEnter={() => setActive(i)} onClick={() => go(r)}
                  className={`flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left ${i === active ? 'bg-indigo-50' : ''}`}>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-gray-900">{r.title}</span>
                    {r.detail && <span className="block truncate text-xs text-gray-500">{r.detail}</span>}
                  </span>
                  <span className="shrink-0 text-[11px] font-medium text-gray-400">{r.kind}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

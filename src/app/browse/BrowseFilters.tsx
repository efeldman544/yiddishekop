'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { EMPLOYMENT_TYPES } from '@/lib/candidateOptions'
import { BROWSE_INDUSTRIES } from '@/lib/candidateTaxonomy'

export default function BrowseFilters() {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [q, setQ] = useState(params.get('q') ?? '')

  const industry = params.get('industry') ?? ''
  const type = params.get('type') ?? ''

  function apply(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v)
      else sp.delete(k)
    }
    startTransition(() => router.push(`/browse?${sp.toString()}`, { scroll: false }))
  }

  const hasFilters = !!(industry || type || params.get('q'))

  return (
    <div className="browse-filters">
      <form
        onSubmit={e => { e.preventDefault(); apply({ q }) }}
        className="browse-search"
      >
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search a role or skill — bookkeeper, QuickBooks, sales…"
          aria-label="Search candidates"
        />
        <button type="submit" className="lp-btn lp-btn-primary">Search</button>
      </form>

      <div className="browse-selects">
        <label>
          <span>Industry</span>
          <select value={industry} onChange={e => apply({ industry: e.target.value })}>
            <option value="">All industries</option>
            {BROWSE_INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </label>

        <label>
          <span>Availability</span>
          <select value={type} onChange={e => apply({ type: e.target.value })}>
            <option value="">Any</option>
            {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        {hasFilters && (
          <button
            type="button"
            className="browse-clear"
            onClick={() => { setQ(''); startTransition(() => router.push('/browse', { scroll: false })) }}
          >
            Clear filters
          </button>
        )}
        {isPending && <span className="browse-pending">Updating…</span>}
      </div>
    </div>
  )
}

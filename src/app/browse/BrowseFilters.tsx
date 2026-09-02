'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { EMPLOYMENT_TYPES } from '@/lib/candidateOptions'

// Industries come from the pool rather than the full category list — offering
// all 23 meant most of them returned nobody, and an empty result is
// indistinguishable from a broken filter.
//
// One dropdown, not a chip row: the chips took a full line above the grid and
// the candidates are what the page is for.

export default function BrowseFilters({ industries }: { industries: string[] }) {
  const router = useRouter()
  const params = useSearchParams()
  const pathname = usePathname()
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
    const query = sp.toString()
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname, { scroll: false }))
  }

  const hasFilters = !!(industry || type || params.get('q'))

  // A chosen industry the pool no longer contains still needs to appear in the
  // list, or the select would show "All industries" while the page is filtered.
  const options = industry && !industries.includes(industry)
    ? [industry, ...industries]
    : industries

  return (
    <div className="browse-filters">
      <div className="browse-controls">
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

        <label className="browse-select">
          <span className="sr-only">Industry</span>
          <select
            value={industry}
            onChange={e => apply({ industry: e.target.value })}
            aria-label="Industry"
          >
            <option value="">All industries</option>
            {options.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </label>

        <label className="browse-select">
          <span className="sr-only">Availability</span>
          <select value={type} onChange={e => apply({ type: e.target.value })} aria-label="Availability">
            <option value="">Any availability</option>
            {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        {hasFilters && (
          <button
            type="button"
            className="browse-clear"
            onClick={() => { setQ(''); startTransition(() => router.push(pathname, { scroll: false })) }}
          >
            Clear
          </button>
        )}
        {isPending && <span className="browse-pending">Updating…</span>}
      </div>
    </div>
  )
}

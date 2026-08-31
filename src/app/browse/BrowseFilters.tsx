'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { EMPLOYMENT_TYPES } from '@/lib/candidateOptions'

/**
 * Industries are clickable rather than a dropdown, and the list comes from the
 * pool rather than the full category list. Offering all 23 categories meant
 * most of them returned nobody, and an empty result is indistinguishable from
 * a broken filter — so only categories somebody is actually in are shown.
 */
export default function BrowseFilters({ industries }: { industries: string[] }) {
  const router = useRouter()
  const params = useSearchParams()
  // Filter the page we're actually on rather than a hardcoded route.
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

  // A selected industry that's no longer in the pool (a stale link, or the
  // search narrowed it away) still needs a chip, or there'd be no way to see
  // what's filtering the empty page you're looking at.
  const chips = industry && !industries.includes(industry)
    ? [industry, ...industries]
    : industries

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

      {chips.length > 0 && (
        <div className="browse-chips" role="group" aria-label="Filter by industry">
          <button
            type="button"
            className={`browse-chip${industry ? '' : ' is-on'}`}
            aria-pressed={!industry}
            onClick={() => apply({ industry: '' })}
          >
            All industries
          </button>
          {chips.map(i => (
            <button
              key={i}
              type="button"
              className={`browse-chip${industry === i ? ' is-on' : ''}`}
              aria-pressed={industry === i}
              onClick={() => apply({ industry: industry === i ? '' : i })}
            >
              {i}
            </button>
          ))}
        </div>
      )}

      <div className="browse-selects">
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
            onClick={() => { setQ(''); startTransition(() => router.push(pathname, { scroll: false })) }}
          >
            Clear filters
          </button>
        )}
        {isPending && <span className="browse-pending">Updating…</span>}
      </div>
    </div>
  )
}

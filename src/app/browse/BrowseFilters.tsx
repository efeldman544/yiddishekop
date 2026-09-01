'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { EMPLOYMENT_TYPES } from '@/lib/candidateOptions'

// Industries come from the pool rather than the full category list — offering
// all 23 meant most of them returned nobody, and an empty result is
// indistinguishable from a broken filter.
//
// Only the first few are shown as chips. A row of twenty chips pushed the
// candidates themselves below the fold, which is the one thing this page has
// to get right; the rest stay one click away in the dropdown.
const VISIBLE_CHIPS = 5

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

  // A chosen industry always gets a chip, even when it isn't in the top few or
  // has been filtered out of the pool — otherwise an empty page gives no clue
  // what is filtering it.
  const chips = industries.slice(0, VISIBLE_CHIPS)
  if (industry && !chips.includes(industry)) chips.unshift(industry)
  const rest = industries.filter(i => !chips.includes(i))

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
          <span className="sr-only">Availability</span>
          <select value={type} onChange={e => apply({ type: e.target.value })} aria-label="Availability">
            <option value="">Any availability</option>
            {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        {rest.length > 0 && (
          <label className="browse-select">
            <span className="sr-only">More industries</span>
            <select
              value={chips.includes(industry) ? '' : industry}
              onChange={e => apply({ industry: e.target.value })}
              aria-label="More industries"
            >
              <option value="">More industries…</option>
              {rest.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </label>
        )}
      </div>

      {chips.length > 0 && (
        <div className="browse-chips" role="group" aria-label="Filter by industry">
          <button
            type="button"
            className={`browse-chip${industry ? '' : ' is-on'}`}
            aria-pressed={!industry}
            onClick={() => apply({ industry: '' })}
          >
            All
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
      )}
    </div>
  )
}

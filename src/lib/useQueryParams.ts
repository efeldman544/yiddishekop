'use client'

import { useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export type QueryChanges = Record<string, string | string[] | null | undefined>

/**
 * A page's filters, search and tab, kept in its address.
 *
 * Held only in component state, they were lost the moment you opened a
 * candidate: Back rebuilt the page from scratch, unfiltered, on the first tab.
 * In the address they survive Back, a refresh and a bookmark, and the scroll
 * memory (keyed by the full address) lands on the right row of the right list.
 *
 * Changes replace the current history entry rather than adding one, so Back
 * still means "the page I was on before", not "undo my last filter click".
 * Next.js keeps useSearchParams in step with window.history, so this costs no
 * trip to the server.
 *
 * An empty value — '', null, [] — removes the parameter, so a page with no
 * filters has a clean address.
 */
export function useQueryParams() {
  const params = useSearchParams()
  const pathname = usePathname()
  const update = useCallback((changes: QueryChanges) => replaceQuery(changes, pathname), [pathname])
  return [params, update] as const
}

/**
 * The writing half on its own, for a page that is handed its starting values
 * by the server and only needs to keep the address up to date.
 */
export function replaceQuery(changes: QueryChanges, pathname = window.location.pathname): void {
  const next = new URLSearchParams(window.location.search)
  for (const [key, value] of Object.entries(changes)) {
    next.delete(key)
    if (value == null || value === '') continue
    if (Array.isArray(value)) value.forEach(v => next.append(key, v))
    else next.set(key, value)
  }
  const qs = next.toString()
  window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname)
}

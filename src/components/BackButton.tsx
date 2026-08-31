'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { hasInAppHistory } from '@/lib/navHistory'

/**
 * Returns to wherever you actually came from.
 *
 * A hardcoded href can't do that — it sends you to one fixed page regardless,
 * which is how opening a profile from the Videos tab used to drop you on a
 * different list. Popping history returns to the real origin, and the scroll
 * memory in the layout puts the list back where it was.
 *
 * `fallback` covers the case where there is no in-app history to pop: someone
 * opened this page from a bookmark, a pasted link, or a refresh, and back()
 * would take them off the site entirely.
 */
export default function BackButton({
  fallback,
  label = 'Back',
}: {
  fallback: string
  label?: string
}) {
  const router = useRouter()
  // Read after mount: sessionStorage doesn't exist during the server render.
  const [canPop, setCanPop] = useState(false)
  useEffect(() => { setCanPop(hasInAppHistory()) }, [])

  return (
    <button
      type="button"
      onClick={() => (canPop ? router.back() : router.push(fallback))}
      className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      {label}
    </button>
  )
}

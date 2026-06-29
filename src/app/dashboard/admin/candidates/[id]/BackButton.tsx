'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()
  // Linked from the matching portal with ?from=matching so the label reflects
  // where Back actually goes (router.back() returns to the matching job list).
  const label = useSearchParams().get('from') === 'matching' ? 'Back to matching' : 'Back to candidates'
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      {label}
    </button>
  )
}

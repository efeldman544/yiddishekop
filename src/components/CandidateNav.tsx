'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'
import SignOutButton from '@/components/SignOutButton'

export default function CandidateNav() {
  const pathname = usePathname()
  const isRoot = pathname === '/dashboard/candidate'

  return (
    <header className="dash-dark h-14 border-b px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <Link href="/" className="dash-brand">Yiddishe<span>Kop</span></Link>
        {!isRoot && (
          <Link
            href="/dashboard/candidate"
            className="flex items-center gap-1.5 dash-link-dim text-sm transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell candidatePath="" />
        <SignOutButton />
      </div>
    </header>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SignOutButton from '@/components/SignOutButton'

export default function CandidateNav() {
  const pathname = usePathname()
  const isRoot = pathname === '/dashboard/candidate'

  return (
    <header className="app-nav">
      <div className="flex items-center gap-4">
        {!isRoot && (
          <Link href="/dashboard/candidate" className="app-nav-link">
            ← Back
          </Link>
        )}
        <span className="app-nav-brand">YiddisheKop</span>
      </div>
      <SignOutButton />
    </header>
  )
}

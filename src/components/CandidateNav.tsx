'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SignOutButton from '@/components/SignOutButton'

export default function CandidateNav() {
  const pathname = usePathname()
  const isRoot = pathname === '/dashboard/candidate'

  return (
    <header className="dash-dark h-14 border-b px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-5">
        <Link href="/dashboard/candidate" className="dash-brand">Yiddishe<span>Kop</span></Link>
        {!isRoot && (
          <Link
            href="/dashboard/candidate"
            className="dash-link-dim text-sm transition-colors"
          >
            ← Dashboard
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Link href="/" className="dash-link-dim text-xs transition-colors hidden sm:block">← Main site</Link>
        <SignOutButton />
      </div>
    </header>
  )
}

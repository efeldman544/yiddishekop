'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'
import SignOutButton from '@/components/SignOutButton'

export default function EmployerNav() {
  const pathname = usePathname()
  const isRoot = pathname === '/dashboard/employer'

  return (
    <header className="dash-dark h-14 border-b px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-5">
        <Link href="/dashboard/employer" className="dash-brand">Yiddishe<span>Kop</span></Link>
        {!isRoot && (
          <Link
            href="/dashboard/employer"
            className="dash-link-dim text-sm transition-colors"
          >
            ← Dashboard
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Link href="/" className="dash-link-dim text-xs transition-colors hidden sm:block">← Main site</Link>
        <NotificationBell candidatePath="/dashboard/employer/candidates" />
        <SignOutButton />
      </div>
    </header>
  )
}

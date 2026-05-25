'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'
import SignOutButton from '@/components/SignOutButton'

export default function EmployerNav() {
  const pathname = usePathname()
  const isRoot = pathname === '/dashboard/employer'

  return (
    <header className="app-nav">
      <div className="flex items-center gap-4">
        {!isRoot && (
          <Link href="/dashboard/employer" className="app-nav-link">
            ← Back
          </Link>
        )}
        <span className="app-nav-brand">YiddisheKop</span>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell candidatePath="/dashboard/employer/candidates" />
        <SignOutButton />
      </div>
    </header>
  )
}

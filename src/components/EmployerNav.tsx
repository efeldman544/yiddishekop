'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'
import SignOutButton from '@/components/SignOutButton'

export default function EmployerNav() {
  const pathname = usePathname()
  const isRoot = pathname === '/dashboard/employer'

  return (
    <header className="h-14 bg-white border-b border-gray-100 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-5">
        <span className="font-bold text-[15px] tracking-tight text-gray-950">YiddisheKop</span>
        {!isRoot && (
          <Link
            href="/dashboard/employer"
            className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
          >
            ← Dashboard
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell candidatePath="/dashboard/employer/candidates" />
        <SignOutButton />
      </div>
    </header>
  )
}

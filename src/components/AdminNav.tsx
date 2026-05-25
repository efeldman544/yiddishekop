'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'
import SignOutButton from '@/components/SignOutButton'

export default function AdminNav() {
  const pathname = usePathname()

  function linkClass(href: string) {
    const active = pathname === href || (href !== '/dashboard/admin' && pathname.startsWith(href))
    return active ? 'app-nav-link-active' : 'app-nav-link'
  }

  return (
    <header className="app-nav">
      <div className="flex items-center gap-6">
        <span className="app-nav-brand">YiddisheKop</span>
        <nav className="flex gap-0.5">
          <Link href="/dashboard/admin" className={linkClass('/dashboard/admin')}>Candidates</Link>
          <Link href="/dashboard/admin/employers" className={linkClass('/dashboard/admin/employers')}>Employers</Link>
          <Link href="/dashboard/admin/jobs" className={linkClass('/dashboard/admin/jobs')}>Jobs</Link>
          <Link href="/dashboard/admin/matching" className={linkClass('/dashboard/admin/matching')}>Matching</Link>
          <Link href="/dashboard/admin/meetings" className={linkClass('/dashboard/admin/meetings')}>Meetings</Link>
          <Link href="/dashboard/admin/recordings" className={linkClass('/dashboard/admin/recordings')}>Recordings</Link>
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <SignOutButton />
      </div>
    </header>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAdminBadges, type AdminBadges } from '@/lib/useAdminBadges'

type NavItem = {
  label: string
  href: string
  exact: boolean
  also?: string[]
  /** For two items on one page, told apart by its ?tab=. */
  tab?: string
  notTab?: string
  /** Which count, if any, shows beside it. */
  badge?: keyof AdminBadges
  icon: React.ReactNode
}

const NAV: NavItem[] = [
  {
    label: 'Candidates',
    href: '/dashboard/admin',
    exact: true,
    // Video-interview candidates are listed under Candidates too.
    also: ['/dashboard/admin/candidates', '/dashboard/admin/video-candidates'],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Matching',
    href: '/dashboard/admin/matching',
    exact: false,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    // Questions about candidates, answered from the records.
    label: 'Assistant',
    href: '/dashboard/admin/assistant',
    exact: false,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
  },
  {
    // Its own section rather than a tab under Matching: screening calls are
    // between us and a candidate, before any employer is involved.
    label: 'Meetings',
    href: '/dashboard/admin/meetings',
    exact: false,
    badge: 'meetings',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Jobs',
    href: '/dashboard/admin/jobs',
    exact: false,
    notTab: 'employers',
    badge: 'jobs',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    // Employers live on the Jobs page, under their own tab; this goes
    // straight there instead of leaving them a tab you had to know about.
    label: 'Employers',
    href: '/dashboard/admin/jobs?tab=employers',
    exact: false,
    tab: 'employers',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    label: 'Intros',
    href: '/dashboard/admin/intros',
    exact: false,
    badge: 'intros',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.9 9.9 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    label: 'Videos',
    href: '/dashboard/admin/videos',
    exact: false,
    badge: 'videos',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.902L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const tab = useSearchParams().get('tab')
  const badges = useAdminBadges(pathname)

  function isActive(item: NavItem) {
    const path = item.href.split('?')[0]
    if (item.tab && tab !== item.tab) return false
    if (item.notTab && tab === item.notTab) return false
    if (item.also?.some(p => pathname.startsWith(p))) return true
    if (item.exact) return pathname === path
    return pathname.startsWith(path)
  }

  return (
    <aside className="dash-dark w-[220px] shrink-0 h-screen border-r flex flex-col">
      {/* Brand */}
      <div className="px-5 h-16 flex items-center border-b border-inherit shrink-0">
        <Link href="/" className="dash-brand">Yiddishe<span>Kop</span></Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = isActive(item)
          const waiting = item.badge ? badges[item.badge] : 0
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`dash-nav-link${active ? ' active' : ''} flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors`}
            >
              <span className="dash-icon">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {waiting > 0 && (
                <span className="min-w-[20px] rounded-full bg-amber-400 px-1.5 text-center text-[11px] font-semibold leading-5 text-gray-900"
                  title={`${waiting} waiting`}>
                  {waiting > 99 ? '99+' : waiting}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

    </aside>
  )
}

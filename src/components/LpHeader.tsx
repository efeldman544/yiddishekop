'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LpHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dashboardHref, setDashboardHref] = useState<string | null>(null)
  function closeMenu() { setMenuOpen(false) }

  // Mirror the main landing page: if there's a live session, show "My account"
  // linking to the dashboard instead of "Log in", so navigating to these pages
  // doesn't make a logged-in user think they've been signed out.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: string }>()
      const role = profile?.role ?? user.user_metadata?.role ?? 'candidate'
      setDashboardHref(`/dashboard/${role}`)
    })
  }, [])

  return (
    <header>
      <div className="wrap lp-nav">
        <Link href="/" className="lp-logo">Yiddishe<span>Kop</span></Link>
        <nav className={`lp-nav-links${menuOpen ? ' open' : ''}`}>
          <Link href="/why-us" onClick={closeMenu}>Why us</Link>
          <Link href="/how-it-works" onClick={closeMenu}>How it works</Link>
          <Link href="/#roles" onClick={closeMenu}>Roles</Link>
        </nav>
        <div className="lp-nav-right">
          {dashboardHref
            ? <Link href={dashboardHref} className="lp-btn lp-btn-ghost">My account</Link>
            : <Link href="/login" className="lp-btn lp-btn-ghost">Log in</Link>
          }
          <Link href="/start-hiring" className="lp-btn lp-btn-gold">Start hiring</Link>
          <button className="lp-nav-toggle" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">☰</button>
        </div>
      </div>
    </header>
  )
}

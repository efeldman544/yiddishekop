'use client'

import { useState } from 'react'
import Link from 'next/link'
import LpAuthButton from '@/components/LpAuthButton'

export default function LpHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  function closeMenu() { setMenuOpen(false) }

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
          <LpAuthButton />
          <Link href="/start-hiring" className="lp-btn lp-btn-gold">Start hiring</Link>
          <button className="lp-nav-toggle" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">☰</button>
        </div>
      </div>
    </header>
  )
}

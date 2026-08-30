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
          <Link href="/browse" onClick={closeMenu}>Browse</Link>
          <Link href="/how-it-works" onClick={closeMenu}>How it works</Link>
          <Link href="/why-us" onClick={closeMenu}>Why us</Link>
          <Link href="/for-candidates" onClick={closeMenu}>For candidates</Link>
        </nav>
        <div className="lp-nav-right">
          <LpAuthButton />
          <Link href="/browse" className="lp-btn lp-btn-gold">Browse candidates</Link>
          <button className="lp-nav-toggle" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">☰</button>
        </div>
      </div>
    </header>
  )
}

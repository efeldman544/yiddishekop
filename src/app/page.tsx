'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dashboardHref, setDashboardHref] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: string }>()
      const role = profile?.role ?? user.user_metadata?.role ?? 'candidate'
      setDashboardHref(`/dashboard/${role}`)
    })
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
        })
      },
      { threshold: 0.12 }
    )
    document.querySelectorAll('.lp .reveal').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  function closeMenu() { setMenuOpen(false) }

  return (
    <div className="lp">
      {/* ── NAV ── */}
      <header>
        <div className="wrap lp-nav">
          <div className="lp-logo">Yiddishe<span>Kop</span></div>
          <nav className={`lp-nav-links${menuOpen ? ' open' : ''}`} id="menu">
            <a href="#problem" onClick={closeMenu}>Why us</a>
            <a href="#how" onClick={closeMenu}>How it works</a>
            <a href="#roles" onClick={closeMenu}>Roles</a>
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

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="wrap reveal">
          <div className="lp-eyebrow">Pre-screened remote staff</div>
          <h1>Stop interviewing<br />the <span className="it">wrong</span> people.</h1>
          <p className="lp-lead">
            We screen and interview candidates before they ever reach your inbox. You get short video clips of the{' '}
            <strong>strongest candidates</strong> — and the final call is always yours.
          </p>
          <div className="lp-hero-cta">
            <Link href="/start-hiring" className="lp-btn lp-btn-gold lp-btn-lg">Start hiring</Link>
          </div>
          <div className="lp-hero-note">
            <span><span className="lp-dot" />Screened &amp; vetted first</span>
            <span><span className="lp-dot" />Every candidate on video</span>
            <span><span className="lp-dot" />People who understand your world</span>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="lp-band" id="problem">
        <div className="wrap">
          <div className="lp-sec-head reveal">
            <div className="lp-sec-eyebrow">The real problem</div>
            <h2>Hiring isn&apos;t hard because there aren&apos;t enough applicants.</h2>
            <p>It&apos;s hard because you can&apos;t tell, from a résumé, who&apos;s actually a good fit. So you sift, interview strangers, and hope you guessed right.</p>
          </div>
          <div className="lp-pain-grid reveal">
            <div className="lp-pain">
              <h3>Who&apos;s actually qualified?</h3>
              <p>The hardest part of hiring isn&apos;t finding applicants. It&apos;s knowing which of them is genuinely right for your work.</p>
            </div>
            <div className="lp-pain">
              <h3>Who can you trust?</h3>
              <p>A résumé tells you what someone typed. It doesn&apos;t tell you whether they&apos;ll show up, communicate, or last.</p>
            </div>
            <div className="lp-pain">
              <h3>How do you avoid a bad hire?</h3>
              <p>A wrong hire costs months and real money. Most owners would rather be confident before they commit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how">
        <div className="wrap">
          <div className="lp-sec-head reveal">
            <div className="lp-sec-eyebrow">How it works</div>
            <h2>Skip the pile. Go <span className="it">straight to the decision.</span></h2>
          </div>
          <div className="lp-steps">
            <div className="lp-step reveal">
              <div className="lp-step-head"><div className="lp-step-n">1</div><h3>Tell us the role</h3></div>
              <p>One short form. You describe the work, the hours, and what a great fit looks like for your business.</p>
            </div>
            <div className="lp-step reveal">
              <div className="lp-step-head"><div className="lp-step-n">2</div><h3>We screen &amp; record</h3></div>
              <p>We source candidates, vet them, and run first-round video interviews — so the wrong fits never reach your inbox.</p>
            </div>
            <div className="lp-step reveal">
              <div className="lp-step-head"><div className="lp-step-n">3</div><h3>You watch &amp; choose</h3></div>
              <p>You get a shortlist of the strongest candidates, each with an interview clip. Pick who you meet live — the decision is yours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SCREENING ── */}
      <section className="lp-band">
        <div className="wrap">
          <div className="lp-sec-head reveal">
            <div className="lp-sec-eyebrow">Inside the screening</div>
            <h2>What happens before a candidate reaches you.</h2>
            <p>No black box. Every person on your shortlist has already been through all of this:</p>
          </div>
          <div className="lp-screen-list reveal">
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>Sourced for your role</b> — matched against the work, hours, and skills you described, not pulled from a generic pool.</span></div>
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>Resume &amp; background review</b> — experience verified against what the role actually needs.</span></div>
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>First-round interview, recorded</b> — we ask the questions you&apos;d ask, on video, so you can see and hear how they answer.</span></div>
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>Selected with a reason</b> — every candidate on your shortlist comes with why we chose them for your role.</span></div>
          </div>
        </div>
      </section>

      {/* ── VALUE ── */}
      <section>
        <div className="wrap">
          <div className="lp-sec-head reveal">
            <div className="lp-sec-eyebrow">Why YiddisheKop</div>
            <h2>Better candidates. <span className="it">Less guesswork.</span></h2>
          </div>
          <div className="lp-vals">
            <div className="lp-val reveal">
              <div className="lp-tag">Vetted first</div>
              <h3>We do the sifting</h3>
              <p>Every candidate is screened and interviewed before they ever reach you. You spend your time on the few worth meeting — not the pile that isn&apos;t.</p>
            </div>
            <div className="lp-val reveal">
              <div className="lp-tag">On video</div>
              <h3>Judge the real person</h3>
              <p>You see and hear each candidate answer questions about your role — so you&apos;re deciding on a person, not a piece of paper.</p>
            </div>
            <div className="lp-val reveal">
              <div className="lp-tag">Confidence</div>
              <h3>Know who you&apos;re hiring</h3>
              <p>You review a shortlist chosen for your role, with the reasoning behind each pick. No guessing, no gambling on strangers.</p>
            </div>
            <div className="lp-val reveal">
              <div className="lp-tag">Understands your world</div>
              <h3>People who fit</h3>
              <p>Qualified, pre-screened remote professionals who understand how a frum business runs — the calendar, the culture, the unspoken things you&apos;d otherwise have to explain.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROOF ── */}
      <section className="lp-band">
        <div className="wrap">
          <div className="lp-sec-head reveal">
            <div className="lp-sec-eyebrow">Proof, not promises</div>
            <h2>What working with us has actually looked like.</h2>
          </div>
          <div className="lp-proof-grid">
            <div className="lp-proof reveal">
              <h3>Clients come back to hire again.</h3>
              <p>Our earliest clients returned for their next hire after seeing how the first one went.</p>
            </div>
            <div className="lp-proof reveal">
              <h3>Placements that last.</h3>
              <p>One of our placements is still in the role nearly a year later — because the fit was right from the start.</p>
            </div>
            <div className="lp-proof reveal">
              <h3>The clips do the convincing.</h3>
              <p>Clients consistently tell us the interview videos are what gave them confidence in the people they reviewed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section id="roles">
        <div className="wrap">
          <div className="lp-sec-head reveal">
            <div className="lp-sec-eyebrow">What we place</div>
            <h2>Remote roles, filled with people you&apos;d actually hire.</h2>
            <p>Full-time or part-time, working in your hours.</p>
          </div>
          <div className="lp-roles reveal">
            {['Bookkeeping', 'Accounting & finance', 'Admin & assistants', 'Sales', 'Customer support', 'Marketing', 'Operations', 'Project management'].map(role => (
              <Link key={role} href="/start-hiring" className="lp-role-chip">{role}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="lp-cta-final" id="start">
        <div className="wrap reveal">
          <div className="lp-sec-eyebrow" style={{ textAlign: 'center' }}>Start hiring</div>
          <h2>Tell us your open role.</h2>
          <p>Send us one role today. We&apos;ll come back with a shortlist of screened, video-interviewed candidates worth your time.</p>
          <Link href="/start-hiring" className="lp-btn lp-btn-gold lp-btn-lg">Start hiring</Link>
          <div className="lp-cta-contact">Prefer to talk? <a href="tel:6314943567">631 494 3567</a></div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="wrap">
          <div className="lp-foot-grid">
            <div>
              <div className="lp-logo">Yiddishe<span>Kop</span></div>
              <p className="lp-foot-tag">Pre-screened remote staff for frum businesses. Vetted, video-interviewed, and worth your time.</p>
            </div>
            <div className="lp-foot-cols">
              <div className="lp-foot-col">
                <h4>Company</h4>
                <a href="#problem">Why us</a>
                <a href="#how">How it works</a>
                <a href="#roles">Roles</a>
              </div>
              <div className="lp-foot-col">
                <h4>Portals</h4>
                <Link href="/login">Log in</Link>
                <Link href="/start-hiring">Start hiring</Link>
              </div>
              <div className="lp-foot-col">
                <h4>Contact</h4>
                <a href="tel:6314943567">631 494 3567</a>
                <a href="https://yiddishekop.net">yiddishekop.net</a>
              </div>
            </div>
          </div>
          <div className="lp-foot-bottom">
            <span>© 2026 YiddisheKop. All rights reserved.</span>
            <Link href="/privacy-policy" style={{ color: 'inherit' }}>Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

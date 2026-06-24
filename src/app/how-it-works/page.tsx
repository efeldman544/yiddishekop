import type { Metadata } from 'next'
import Link from 'next/link'
import LpHeader from '@/components/LpHeader'

export const metadata: Metadata = {
  title: 'How It Works | YiddisheKop',
  description: 'Tell us the role, we screen and record video interviews, you watch and choose. Three steps to a confident hire — no sifting, no wasted interviews.',
}

export default function HowItWorksPage() {
  return (
    <div className="lp">
      <LpHeader />

      <section style={{ padding: '80px 0 60px' }}>
        <div className="wrap">
          <div className="lp-sec-head">
            <div className="lp-sec-eyebrow">How it works</div>
            <h2>Skip the pile. Go <span className="it">straight to the decision.</span></h2>
          </div>
          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-head"><div className="lp-step-n">1</div><h3>Tell us the role</h3></div>
              <p>One short form. You describe the work, the hours, and what a great fit looks like for your business.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-head"><div className="lp-step-n">2</div><h3>We screen &amp; record</h3></div>
              <p>We source candidates, vet them, and run first-round video interviews — so the wrong fits never reach your inbox.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-head"><div className="lp-step-n">3</div><h3>You watch &amp; choose</h3></div>
              <p>You get a shortlist of the strongest candidates, each with an interview clip. Pick who you meet live — the decision is yours.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-cta-final">
        <div className="wrap">
          <div className="lp-sec-eyebrow" style={{ textAlign: 'center' }}>Ready to start?</div>
          <h2>Tell us your open role.</h2>
          <p>Send us one role today. We&apos;ll come back with a shortlist of screened, video-interviewed candidates worth your time.</p>
          <Link href="/start-hiring" className="lp-btn lp-btn-gold lp-btn-lg">Start hiring</Link>
          <div className="lp-cta-contact">Prefer to talk? <a href="tel:6314943567">631 494 3567</a></div>
        </div>
      </section>

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
                <Link href="/why-us">Why us</Link>
                <Link href="/how-it-works">How it works</Link>
                <Link href="/#roles">Roles</Link>
              </div>
              <div className="lp-foot-col">
                <h4>Portals</h4>
                <Link href="/login">Log in</Link>
                <Link href="/start-hiring">Start hiring</Link>
              </div>
              <div className="lp-foot-col">
                <h4>Contact</h4>
                <a href="tel:6314943567">631 494 3567</a>
                <a href="mailto:info@yiddishekop.app">info@yiddishekop.app</a>
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

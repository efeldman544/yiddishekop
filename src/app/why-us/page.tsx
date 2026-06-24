import type { Metadata } from 'next'
import Link from 'next/link'
import LpHeader from '@/components/LpHeader'

export const metadata: Metadata = {
  title: 'Why Us | YiddisheKop',
  description: 'Stop guessing on résumés. YiddisheKop vets, interviews, and delivers remote candidates who are actually worth your time — and actually last.',
}

export default function WhyUsPage() {
  return (
    <div className="lp">
      <LpHeader />

      <section className="lp-band" style={{ paddingTop: 80 }}>
        <div className="wrap">
          <div className="lp-sec-head">
            <div className="lp-sec-eyebrow">The real problem</div>
            <h2>Hiring isn&apos;t hard because there aren&apos;t enough applicants.</h2>
            <p>It&apos;s hard because you can&apos;t tell, from a résumé, who&apos;s actually a good fit. So you sift, interview strangers, and hope you guessed right.</p>
          </div>
          <div className="lp-pain-grid">
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

      <section className="lp-band">
        <div className="wrap">
          <div className="lp-sec-head">
            <div className="lp-sec-eyebrow">Proof, not promises</div>
            <h2>What working with us has actually looked like.</h2>
          </div>
          <div className="lp-proof-grid">
            <div className="lp-proof">
              <h3>Clients come back to hire again.</h3>
              <p>Our earliest clients returned for their next hire after seeing how the first one went.</p>
            </div>
            <div className="lp-proof">
              <h3>Placements that last.</h3>
              <p>Our placements stick. Clients tell us their hires are still going strong months later — because the fit was right from the start.</p>
            </div>
            <div className="lp-proof">
              <h3>The clips do the convincing.</h3>
              <p>Clients consistently tell us the interview videos are what gave them confidence in the people they reviewed.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-cta-final">
        <div className="wrap">
          <div className="lp-sec-eyebrow" style={{ textAlign: 'center' }}>Ready?</div>
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

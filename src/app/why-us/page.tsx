import type { Metadata } from 'next'
import Link from 'next/link'
import LpHeader from '@/components/LpHeader'
import LpFooter from '@/components/LpFooter'

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
          <h2>See who&apos;s available.</h2>
          <p>Browse the candidates we&apos;ve already screened, and tell us who you&apos;d like to meet.</p>
          <Link href="/browse" className="lp-btn lp-btn-primary lp-btn-lg">Browse candidates</Link>
          <div className="lp-cta-contact">Prefer to talk? <a href="tel:6314943567">631 494 3567</a></div>
        </div>
      </section>

      <LpFooter />
    </div>
  )
}

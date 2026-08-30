import type { Metadata } from 'next'
import Link from 'next/link'
import LpHeader from '@/components/LpHeader'
import LpFooter from '@/components/LpFooter'

export const metadata: Metadata = {
  title: 'Why Us | YiddisheKop',
  description: 'Stop guessing on résumés. YiddisheKop keeps a pool of vetted, video-interviewed remote candidates ready to meet — so you start at the shortlist instead of the job post.',
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
            <p>It&apos;s hard because you can&apos;t tell, from a résumé, who&apos;s actually a good fit — and because finding out takes weeks you don&apos;t have.</p>
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
              <h3>How long will it take?</h3>
              <p>Posting, sifting, and first-round interviews eat weeks — while the work sits there waiting for someone to do it.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '70px 0' }}>
        <div className="wrap">
          <div className="lp-sec-head">
            <div className="lp-sec-eyebrow">What we do differently</div>
            <h2>We do the work <span className="it">before</span> you need it.</h2>
            <p>Most agencies start looking the day you call. We already looked.</p>
          </div>
          <div className="lp-vals">
            <div className="lp-val">
              <div className="lp-tag">Ready now</div>
              <h3>A pool, not a search</h3>
              <p>Candidates are sourced, screened and interviewed in advance. When you arrive, there are already people to look at.</p>
            </div>
            <div className="lp-val">
              <div className="lp-tag">On video</div>
              <h3>See them before you commit</h3>
              <p>Every candidate answers real questions on camera. You judge the person, not the paperwork.</p>
            </div>
            <div className="lp-val">
              <div className="lp-tag">You choose</div>
              <h3>No one is assigned to you</h3>
              <p>You browse and pick who you want to meet. We handle the introduction and stay out of your decision.</p>
            </div>
            <div className="lp-val">
              <div className="lp-tag">Understands your world</div>
              <h3>People who fit</h3>
              <p>Remote professionals who understand how a frum business runs — the calendar, the culture, the things you&apos;d otherwise have to explain.</p>
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
          <h2>See who&apos;s available right now.</h2>
          <p>Browse the people we&apos;ve already screened and interviewed, and tell us who you&apos;d like to meet.</p>
          <Link href="/browse" className="lp-btn lp-btn-gold lp-btn-lg">Browse candidates</Link>
          <div className="lp-cta-contact">Prefer to talk? <a href="tel:6314943567">631 494 3567</a></div>
        </div>
      </section>

      <LpFooter />
    </div>
  )
}

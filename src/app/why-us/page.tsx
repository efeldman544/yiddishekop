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
            <div className="lp-sec-eyebrow">Why YiddisheKop</div>
            <h2>Hiring isn&apos;t hard because there aren&apos;t enough applicants.</h2>
            <p>It&apos;s hard because you can&apos;t tell, from a résumé, who&apos;s actually a good fit. Here&apos;s what we do about each part of that.</p>
          </div>
          <div className="lp-pain-grid">
            <div className="lp-pain">
              <h3>Who&apos;s actually qualified?</h3>
              <p>A résumé tells you what someone typed, not whether they can do the work.</p>
              <p className="lp-fix"><b>So we check first.</b> Every candidate&apos;s experience is verified against what the job actually needs, before they reach you.</p>
            </div>
            <div className="lp-pain">
              <h3>Who can you trust?</h3>
              <p>You can&apos;t tell from a page whether someone will show up, communicate, or last.</p>
              <p className="lp-fix"><b>So we interview them on video.</b> You watch them answer the questions you&apos;d ask, before you spend an hour of your own.</p>
            </div>
            <div className="lp-pain">
              <h3>How do you avoid a bad hire?</h3>
              <p>A wrong hire costs months and real money.</p>
              <p className="lp-fix"><b>So you decide from evidence.</b> You meet only the people you picked, and the final call is always yours.</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="lp-sec-head">
            <div className="lp-sec-eyebrow">What we do</div>
            <h2>The work happens <span className="it">before</span> you see anyone.</h2>
            <p>By the time a candidate appears in your list, all of this is already done.</p>
          </div>
          <div className="lp-screen-list">
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>We go and find them</b> — sourced by us, not forwarded from a job board.</span></div>
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>Experience verified</b> — checked against what the work actually needs.</span></div>
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>Interviewed on video</b> — we ask the questions you&apos;d ask, so you can see and hear the answers.</span></div>
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>Shown with a reason</b> — every candidate comes with why we picked them.</span></div>
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>You choose</b> — meet only who you want, and hire on your own judgement.</span></div>
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

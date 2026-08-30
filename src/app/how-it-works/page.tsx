import type { Metadata } from 'next'
import Link from 'next/link'
import LpHeader from '@/components/LpHeader'
import LpFooter from '@/components/LpFooter'

export const metadata: Metadata = {
  title: 'How It Works | YiddisheKop',
  description: 'Browse candidates we have already screened and video-interviewed, tell us who you want to meet, and hire. Three steps — no job post, no sifting, no waiting.',
}

export default function HowItWorksPage() {
  return (
    <div className="lp">
      <LpHeader />

      <section style={{ padding: '80px 0 60px' }}>
        <div className="wrap">
          <div className="lp-sec-head">
            <div className="lp-sec-eyebrow">How it works</div>
            <h2>Skip the search. Go <span className="it">straight to choosing.</span></h2>
            <p>The sourcing, screening and first interviews are already done. You start where hiring normally ends.</p>
          </div>
          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-head"><div className="lp-step-n">1</div><h3>Browse the pool</h3></div>
              <p>Everyone here is already screened and interviewed. Filter by role, industry, and availability to see who fits your business.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-head"><div className="lp-step-n">2</div><h3>Tell us who you like</h3></div>
              <p>Pick the people worth your time. We share their full profile and interview clip, and set up the introduction.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-head"><div className="lp-step-n">3</div><h3>Meet and hire</h3></div>
              <p>You meet the ones you chose, live. The decision is always yours — we just make sure it&apos;s an easy one.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-band" style={{ padding: '70px 0' }}>
        <div className="wrap">
          <div className="lp-sec-head">
            <div className="lp-sec-eyebrow">Before anyone reaches the pool</div>
            <h2>What every candidate has already been through.</h2>
          </div>
          <div className="lp-screen-list">
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>Sourced and screened by us</b> — we go and find them; they don&apos;t arrive from a generic job board.</span></div>
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>Résumé &amp; background review</b> — experience checked against what the work actually needs.</span></div>
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>Interviewed on video</b> — we ask the questions you&apos;d ask, recorded, so you can see and hear how they answer.</span></div>
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>Only the ones worth showing</b> — if we wouldn&apos;t put them in front of you, they&apos;re not in the pool.</span></div>
          </div>
        </div>
      </section>

      <section style={{ padding: '70px 0' }}>
        <div className="wrap">
          <div className="lp-sec-head">
            <div className="lp-sec-eyebrow">Common questions</div>
            <h2>The details.</h2>
          </div>
          <div className="lp-pain-grid">
            <div className="lp-pain">
              <h3>Can I see names and videos?</h3>
              <p>Browsing is open to everyone, with profiles anonymized. Create a free hiring account and we&apos;ll share full profiles and interview clips for the candidates you&apos;re interested in.</p>
            </div>
            <div className="lp-pain">
              <h3>What if nobody fits?</h3>
              <p>Tell us the role and we&apos;ll go source for it — the same screening and video interview, run specifically for your opening.</p>
            </div>
            <div className="lp-pain">
              <h3>Who makes the final call?</h3>
              <p>You do, always. We never assign anyone to you. You choose who to meet, and you decide who to hire.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-cta-final">
        <div className="wrap">
          <div className="lp-sec-eyebrow" style={{ textAlign: 'center' }}>Ready to start?</div>
          <h2>See who&apos;s available right now.</h2>
          <p>Browse the people we&apos;ve already screened and interviewed, and tell us who you&apos;d like to meet.</p>
          <Link href="/browse" className="lp-btn lp-btn-primary lp-btn-lg">Browse candidates</Link>
          <div className="lp-cta-contact">
            Looking for something specific? <Link href="/start-hiring">Request a role</Link> · Prefer to talk?{' '}
            <a href="tel:6314943567">631 494 3567</a>
          </div>
        </div>
      </section>

      <LpFooter />
    </div>
  )
}

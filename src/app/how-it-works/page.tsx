import type { Metadata } from 'next'
import Link from 'next/link'
import LpHeader from '@/components/LpHeader'
import LpFooter from '@/components/LpFooter'

export const metadata: Metadata = {
  title: 'How It Works | YiddisheKop',
  description: 'Browse candidates we have already screened, tell us who you want to meet, and hire. Three steps to a confident hire — no sifting, no wasted interviews.',
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
              <div className="lp-step-head"><div className="lp-step-n">1</div><h3>Browse the pool</h3></div>
              <p>Everyone here is already screened and interviewed. Filter by role, industry, and availability to see who fits your business.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-head"><div className="lp-step-n">2</div><h3>Tell us who you like</h3></div>
              <p>Pick the people worth your time. We share their full profile and interview clip, and set up the introduction.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-head"><div className="lp-step-n">3</div><h3>You watch &amp; choose</h3></div>
              <p>You meet the ones you chose, live. Pick who you hire — the decision is always yours.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-cta-final">
        <div className="wrap">
          <div className="lp-sec-eyebrow" style={{ textAlign: 'center' }}>Ready to start?</div>
          <h2>See who&apos;s available.</h2>
          <p>Browse the candidates we&apos;ve already screened, and tell us who you&apos;d like to meet.</p>
          <Link href="/browse" className="lp-btn lp-btn-primary lp-btn-lg">Browse candidates</Link>
          <div className="lp-cta-contact">
            Looking for something specific? <Link href="/start-hiring">Ask us to source it</Link> · Prefer to talk?{' '}
            <a href="tel:6314943567">631 494 3567</a>
          </div>
        </div>
      </section>

      <LpFooter />
    </div>
  )
}

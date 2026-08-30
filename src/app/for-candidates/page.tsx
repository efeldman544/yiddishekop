import type { Metadata } from 'next'
import Link from 'next/link'
import LpHeader from '@/components/LpHeader'
import LpFooter from '@/components/LpFooter'

export const metadata: Metadata = {
  title: 'For Candidates | YiddisheKop',
  description: 'Remote work with frum businesses. Create a free profile, do one video interview with us, and get put in front of employers who are hiring — no applying to dozens of jobs.',
  openGraph: {
    title: 'For Candidates | YiddisheKop',
    description: 'Create a free profile, do one interview, and get put in front of frum businesses that are hiring remote staff.',
    url: 'https://yiddishekop.app/for-candidates',
    siteName: 'YiddisheKop',
    type: 'website',
  },
}

export default function ForCandidatesPage() {
  return (
    <div className="lp">
      <LpHeader />

      {/* ── HERO ── */}
      <section className="lp-hero" style={{ paddingBottom: 70 }}>
        <div className="wrap">
          <div className="lp-eyebrow">For candidates</div>
          <h1>One interview. <span className="it">Many</span> opportunities.</h1>
          <p className="lp-lead">
            Stop applying to job after job and hearing nothing back. Do{' '}
            <strong>one interview with us</strong>, and we put you in front of frum businesses
            hiring remote staff — again and again, at no cost to you.
          </p>
          <div className="lp-hero-cta">
            <Link href="/signup?role=candidate" className="lp-btn lp-btn-gold lp-btn-lg">Create your profile</Link>
          </div>
          <div className="lp-hero-note">
            <span><span className="lp-dot" />Always free for candidates</span>
            <span><span className="lp-dot" />Remote roles, your hours</span>
            <span><span className="lp-dot" />Your details stay private</span>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-band">
        <div className="wrap">
          <div className="lp-sec-head">
            <div className="lp-sec-eyebrow">How it works</div>
            <h2>Three steps, then we do the chasing.</h2>
          </div>
          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-head"><div className="lp-step-n">1</div><h3>Create your profile</h3></div>
              <p>Tell us what you do, what you&apos;re looking for, and the hours that work for you. Upload a résumé if you have one — it takes a few minutes.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-head"><div className="lp-step-n">2</div><h3>Book one interview</h3></div>
              <p>A short video call with us. We ask the questions employers ask, and record it once so you never have to repeat a first-round interview.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-head"><div className="lp-step-n">3</div><h3>We put you forward</h3></div>
              <p>Employers browse people we&apos;ve already vetted. When one wants to meet you, we make the introduction and tell you everything about the role first.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY ── */}
      <section>
        <div className="wrap">
          <div className="lp-sec-head">
            <div className="lp-sec-eyebrow">Why it&apos;s worth it</div>
            <h2>Better than applying <span className="it">into the void.</span></h2>
          </div>
          <div className="lp-vals">
            <div className="lp-val">
              <div className="lp-tag">Interview once</div>
              <h3>Your interview keeps working</h3>
              <p>One recorded conversation gets shown to employer after employer. You don&apos;t start from scratch with every opening.</p>
            </div>
            <div className="lp-val">
              <div className="lp-tag">Private</div>
              <h3>You stay anonymous until you agree</h3>
              <p>Your name, contact details and résumé aren&apos;t public. Employers see an anonymized profile, and we ask you before sharing more.</p>
            </div>
            <div className="lp-val">
              <div className="lp-tag">Real roles</div>
              <h3>Businesses that actually hire</h3>
              <p>These are working frum businesses with real openings — not listings that have been sitting online for six months.</p>
            </div>
            <div className="lp-val">
              <div className="lp-tag">Free</div>
              <h3>You never pay us</h3>
              <p>We&apos;re paid by the businesses hiring. Creating a profile, interviewing, and getting placed costs you nothing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section className="lp-band">
        <div className="wrap">
          <div className="lp-sec-head">
            <div className="lp-sec-eyebrow">What we place</div>
            <h2>Remote roles across the work you already do.</h2>
            <p>Bookkeeping and admin, customer service and sales, design, marketing, development, and more — full-time or part-time.</p>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="lp-cta-final">
        <div className="wrap">
          <div className="lp-sec-eyebrow" style={{ textAlign: 'center' }}>Get started</div>
          <h2>Create your profile today.</h2>
          <p>
            It takes a few minutes, it&apos;s free, and it puts you in front of businesses that are
            hiring right now.
          </p>
          <Link href="/signup?role=candidate" className="lp-btn lp-btn-gold lp-btn-lg">Create your profile</Link>
          <div className="lp-cta-contact">
            Already have an account? <Link href="/login">Log in</Link> · Questions?{' '}
            <a href="tel:6314943567">631 494 3567</a>
          </div>
        </div>
      </section>

      <LpFooter />
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import LpHeader from '@/components/LpHeader'
import LpFooter from '@/components/LpFooter'
import RevealObserver from '@/components/RevealObserver'
import { poolIndustries } from '@/lib/browse'

export const metadata: Metadata = {
  title: 'YiddisheKop',
  description: 'Your next hire is already here. Browse pre-screened remote candidates from the frum community — see the strongest people on video and pick who you want to meet.',
  openGraph: {
    title: 'YiddisheKop | Pre-Screened Remote Staff for Frum Businesses',
    description: 'Your next hire is already here. Browse pre-screened remote candidates — the strongest people, on video.',
    url: 'https://yiddishekop.app',
    siteName: 'YiddisheKop',
    locale: 'en_US',
    type: 'website',
  },
}

// Cached, refreshed hourly: the roles below come from the live pool, but that
// is not worth a database round trip on every visit to the home page.
export const revalidate = 3600

export default async function LandingPage() {
  // Link only to industries somebody is actually in, so a chip here can never
  // land on an empty browse page.
  const roles = await poolIndustries()

  return (
    <div className="lp">
      <RevealObserver />

      {/* ── NAV ── */}
      <LpHeader />

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="wrap reveal">
          <div className="lp-eyebrow">Pre-screened remote staff</div>
          <h1>Your next hire is <span className="it">already</span> here.</h1>
          <p className="lp-lead">
            We&apos;ve already screened and interviewed them. Browse short video clips of the{' '}
            <strong>strongest candidates</strong> and pick who you want to meet.
          </p>
          <div className="lp-hero-cta">
            <Link href="/browse" className="lp-btn lp-btn-primary lp-btn-lg">Browse candidates</Link>
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
              <div className="lp-step-head"><div className="lp-step-n">1</div><h3>Browse the pool</h3></div>
              <p>Everyone here is already screened and interviewed. Filter by role, industry, and availability to see who fits.</p>
            </div>
            <div className="lp-step reveal">
              <div className="lp-step-head"><div className="lp-step-n">2</div><h3>Tell us who you like</h3></div>
              <p>Pick the people worth your time. We share their full profile and interview clip, and set up the introduction.</p>
            </div>
            <div className="lp-step reveal">
              <div className="lp-step-head"><div className="lp-step-n">3</div><h3>You watch &amp; choose</h3></div>
              <p>You meet the ones you chose, live. Pick who you hire — the decision is yours.</p>
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
            <p>No black box. Every person in the pool has already been through all of this:</p>
          </div>
          <div className="lp-screen-list reveal">
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>Sourced and screened by us</b> — we go and find them; they don&apos;t arrive from a generic job board.</span></div>
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>Resume &amp; background review</b> — experience verified against what the work actually needs.</span></div>
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>First-round interview, recorded</b> — we ask the questions you&apos;d ask, on video, so you can see and hear how they answer.</span></div>
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>Selected with a reason</b> — every candidate we show you comes with why we chose them.</span></div>
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
              <p>You see and hear each candidate answer real questions — so you&apos;re deciding on a person, not a piece of paper.</p>
            </div>
            <div className="lp-val reveal">
              <div className="lp-tag">Confidence</div>
              <h3>Know who you&apos;re hiring</h3>
              <p>You review candidates with the reasoning behind each pick. No guessing, no gambling on strangers.</p>
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
              <p>Our placements stick. Clients tell us their hires are still going strong months later — because the fit was right from the start.</p>
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
            {roles.map(role => (
              <Link
                key={role}
                href={`/browse?industry=${encodeURIComponent(role)}`}
                className="lp-role-chip"
              >
                {role}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="lp-cta-final" id="start">
        <div className="wrap reveal">
          <div className="lp-sec-eyebrow" style={{ textAlign: 'center' }}>Start here</div>
          <h2>See who&apos;s available.</h2>
          <p>Browse the candidates we&apos;ve already screened, and tell us who you&apos;d like to meet.</p>
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

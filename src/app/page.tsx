import type { Metadata } from 'next'
import Link from 'next/link'
import LpHeader from '@/components/LpHeader'
import LpFooter from '@/components/LpFooter'
import RevealObserver from '@/components/RevealObserver'
import { poolStats } from '@/lib/browse'
import { INDUSTRIES } from '@/lib/candidateOptions'

export const metadata: Metadata = {
  title: 'YiddisheKop',
  description: 'Your next hire is already here. Browse vetted, video-interviewed remote professionals from the frum community — screened before you ever see them, available to meet this week.',
  openGraph: {
    title: 'YiddisheKop | Browse Pre-Screened Remote Staff',
    description: 'Your next hire is already here. Browse vetted, video-interviewed remote professionals from the frum community — available to meet this week.',
    url: 'https://yiddishekop.app',
    siteName: 'YiddisheKop',
    locale: 'en_US',
    type: 'website',
  },
}

// The pool size is the pitch, so keep it fresh without hitting the DB on
// every visit.
export const revalidate = 3600

export default async function LandingPage() {
  const stats = await poolStats()

  return (
    <div className="lp">
      <RevealObserver />

      {/* ── NAV ── */}
      <LpHeader />

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="wrap reveal">
          <div className="lp-eyebrow">
            {stats.total > 0 ? `${stats.total} vetted candidates, available now` : 'Vetted remote staff, available now'}
          </div>
          <h1>Your next hire is <span className="it">already</span> here.</h1>
          <p className="lp-lead">
            We&apos;ve already sourced, screened and video-interviewed remote professionals who
            understand how a frum business runs. <strong>Browse them today</strong> — no job post,
            no waiting, no pile of résumés.
          </p>
          <div className="lp-hero-cta">
            <Link href="/browse" className="lp-btn lp-btn-gold lp-btn-lg">Browse candidates</Link>
          </div>
          <div className="lp-hero-note">
            <span><span className="lp-dot" />Screened before you see them</span>
            <span><span className="lp-dot" />Every candidate on video</span>
            <span><span className="lp-dot" />Ready to start now</span>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="lp-band" id="problem">
        <div className="wrap">
          <div className="lp-sec-head reveal">
            <div className="lp-sec-eyebrow">The real problem</div>
            <h2>Most hiring starts from zero. Yours doesn&apos;t have to.</h2>
            <p>Post a job, wait, sift a hundred résumés, interview strangers, hope you guessed right. Weeks gone before you meet anyone worth meeting.</p>
          </div>
          <div className="lp-pain-grid reveal">
            <div className="lp-pain">
              <h3>Waiting is the expensive part</h3>
              <p>The work doesn&apos;t pause while you recruit. Every week a seat sits empty is a week someone else covers it badly.</p>
            </div>
            <div className="lp-pain">
              <h3>A résumé tells you almost nothing</h3>
              <p>It tells you what someone typed. Not whether they&apos;ll show up, communicate clearly, or still be there in a year.</p>
            </div>
            <div className="lp-pain">
              <h3>You shouldn&apos;t gamble on strangers</h3>
              <p>A wrong hire costs months and real money. You should be able to see and hear someone before you commit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how">
        <div className="wrap">
          <div className="lp-sec-head reveal">
            <div className="lp-sec-eyebrow">How it works</div>
            <h2>Skip the search. Go <span className="it">straight to choosing.</span></h2>
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
              <div className="lp-step-head"><div className="lp-step-n">3</div><h3>Meet and hire</h3></div>
              <p>You meet the ones you chose, live. The decision is always yours — we just make sure it&apos;s an easy one.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SCREENING ── */}
      <section className="lp-band">
        <div className="wrap">
          <div className="lp-sec-head reveal">
            <div className="lp-sec-eyebrow">Inside the screening</div>
            <h2>Why the pool is worth browsing.</h2>
            <p>No black box. Nobody appears on this site until they&apos;ve been through all of it:</p>
          </div>
          <div className="lp-screen-list reveal">
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>Sourced and screened by us</b> — we go and find them; they don&apos;t arrive from a generic job board.</span></div>
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>Résumé &amp; background review</b> — experience checked against what the work actually needs.</span></div>
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>Interviewed on video</b> — we ask the questions you&apos;d ask, recorded, so you can see and hear how they answer.</span></div>
            <div className="lp-screen-item"><span className="lp-dot" /><span><b>Only the ones worth showing</b> — if we wouldn&apos;t put them in front of you, they&apos;re not in the pool.</span></div>
          </div>
        </div>
      </section>

      {/* ── VALUE ── */}
      <section>
        <div className="wrap">
          <div className="lp-sec-head reveal">
            <div className="lp-sec-eyebrow">Why YiddisheKop</div>
            <h2>Better candidates. <span className="it">Ready today.</span></h2>
          </div>
          <div className="lp-vals">
            <div className="lp-val reveal">
              <div className="lp-tag">No waiting</div>
              <h3>The work is already done</h3>
              <p>The sourcing, screening and first-round interviews happened before you arrived. You start at the shortlist instead of the job post.</p>
            </div>
            <div className="lp-val reveal">
              <div className="lp-tag">On video</div>
              <h3>Judge the real person</h3>
              <p>You see and hear each candidate answer real questions — so you&apos;re deciding on a person, not a piece of paper.</p>
            </div>
            <div className="lp-val reveal">
              <div className="lp-tag">You choose</div>
              <h3>Nobody is assigned to you</h3>
              <p>You pick who you want to meet from the people in front of you. We make the introduction; the decision stays yours.</p>
            </div>
            <div className="lp-val reveal">
              <div className="lp-tag">Understands your world</div>
              <h3>People who fit</h3>
              <p>Qualified remote professionals who understand how a frum business runs — the calendar, the culture, the unspoken things you&apos;d otherwise have to explain.</p>
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
            <div className="lp-sec-eyebrow">Who&apos;s in the pool</div>
            <h2>Remote professionals, across the roles you actually hire for.</h2>
            <p>Full-time or part-time, working in your hours. Pick an area to see who&apos;s available.</p>
          </div>
          <div className="lp-roles reveal">
            {INDUSTRIES.filter(r => r !== 'Other').map(role => (
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
          <h2>See who&apos;s available right now.</h2>
          <p>
            No job post, no forms to start. Browse the people we&apos;ve already screened and
            interviewed, and tell us who you&apos;d like to meet.
          </p>
          <Link href="/browse" className="lp-btn lp-btn-gold lp-btn-lg">Browse candidates</Link>
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

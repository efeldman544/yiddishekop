import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import LpHeader from '@/components/LpHeader'
import LpFooter from '@/components/LpFooter'
import { createClient } from '@/lib/supabase/server'
import { browseCandidates, poolStats } from '@/lib/browse'
import BrowseFilters from './BrowseFilters'
import RequestIntroButton from './RequestIntroButton'

export const metadata: Metadata = {
  title: 'Browse Candidates | YiddisheKop',
  description: 'Browse vetted, video-interviewed remote professionals from the frum community — bookkeepers, admins, sales, developers and more. Available now, no job post required.',
  openGraph: {
    title: 'Browse Candidates | YiddisheKop',
    description: 'Vetted, video-interviewed remote professionals — available now. Browse the pool and pick who you want to meet.',
    url: 'https://yiddishekop.app/browse',
    siteName: 'YiddisheKop',
    type: 'website',
  },
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ industry?: string; type?: string; q?: string }>
}) {
  const params = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let role: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single<{ role: string }>()
    role = profile?.role ?? null
  }
  // Names, and the ability to ask for an introduction, are for hiring accounts
  const revealNames = role === 'employer' || role === 'admin'

  // A failed lookup must not read as "nobody matched" — that would quietly
  // misrepresent an empty pool to an employer.
  let cards: Awaited<ReturnType<typeof browseCandidates>> = []
  let loadFailed = false
  try {
    cards = await browseCandidates(
      { industry: params.industry, employmentType: params.type, q: params.q },
      revealNames,
    )
  } catch (e) {
    console.error('browse load failed:', e instanceof Error ? e.message : e)
    loadFailed = true
  }
  const stats = await poolStats()

  return (
    <div className="lp">
      <LpHeader />

      <section style={{ padding: '72px 0 32px' }}>
        <div className="wrap">
          <div className="lp-sec-eyebrow">Available now</div>
          <h1 style={{
            fontFamily: 'var(--font-fraunces), Fraunces, serif', fontWeight: 600,
            fontSize: 'clamp(32px,4.2vw,52px)', letterSpacing: '-0.02em', lineHeight: 1.05,
            color: 'var(--lp-text)', marginTop: 14, marginBottom: 16,
          }}>
            Browse people who are ready to work.
          </h1>
          <p style={{ fontSize: 17.5, color: 'var(--lp-text-dim)', lineHeight: 1.6, maxWidth: 620 }}>
            {stats.total > 0
              ? <>Every one of these {stats.total} candidates has already been screened by us, and {stats.interviewed} have sat for a recorded interview. Filter to what you need, then tell us who you want to meet.</>
              : <>Every candidate here has already been screened and interviewed by us. Filter to what you need, then tell us who you want to meet.</>}
          </p>
        </div>
      </section>

      <section style={{ paddingBottom: 80 }}>
        <div className="wrap">
          <Suspense fallback={null}>
            <BrowseFilters />
          </Suspense>

          {!revealNames && (
            <div className="browse-gate">
              <div>
                <strong>You&apos;re seeing anonymized profiles.</strong>
                <p>
                  Create a free hiring account to see names, watch interview clips, and request an
                  introduction. We keep candidate details private until then.
                </p>
              </div>
              <Link href="/signup?role=employer" className="lp-btn lp-btn-primary">Create free account</Link>
            </div>
          )}

          {loadFailed ? (
            <div className="browse-empty">
              <p><strong>We couldn&apos;t load the candidate list just now.</strong></p>
              <p>
                Please refresh in a moment, or{' '}
                <Link href="/start-hiring">tell us what you&apos;re looking for</Link> and we&apos;ll
                come back to you directly.
              </p>
            </div>
          ) : (
          <>
          <p className="browse-count">
            {cards.length === 0
              ? 'No candidates match those filters yet.'
              : `Showing ${cards.length} candidate${cards.length === 1 ? '' : 's'}`}
          </p>

          {cards.length === 0 ? (
            <div className="browse-empty">
              <p>Nothing matches that combination right now.</p>
              <p>
                Clear the filters to see everyone, or{' '}
                <Link href="/start-hiring">tell us what you&apos;re looking for</Link> — we source for
                specific roles too.
              </p>
            </div>
          ) : (
            <div className="browse-grid">
              {cards.map(c => (
                <article key={c.key} className="browse-card">
                  <div className="browse-card-top">
                    <div>
                      <h3>{c.title || 'Remote professional'}</h3>
                      <p className="browse-card-id">
                        {c.name ? c.name : `Candidate #${c.ref}`}
                        {c.location && <> · {c.location}</>}
                      </p>
                    </div>
                    {c.interviewed && <span className="browse-badge">Video interviewed</span>}
                  </div>

                  <div className="browse-card-tags">
                    {c.industries.slice(0, 3).map(i => (
                      <span key={i} className="browse-tag">{i}</span>
                    ))}
                    {c.employmentType.map(t => (
                      <span key={t} className="browse-tag browse-tag-muted">{t}</span>
                    ))}
                  </div>

                  <dl className="browse-card-meta">
                    {c.yearsExperience && (
                      <div><dt>Experience</dt><dd>{c.yearsExperience}</dd></div>
                    )}
                    {c.languages && (
                      <div><dt>Languages</dt><dd>{c.languages}</dd></div>
                    )}
                    {c.usHours && (
                      <div><dt>Hours</dt><dd>Works U.S. hours</dd></div>
                    )}
                  </dl>

                  <div className="browse-card-foot">
                    {c.id ? (
                      <RequestIntroButton candidateId={c.id} candidateRef={c.ref} />
                    ) : (
                      <Link href="/signup?role=employer" className="browse-card-cta">
                        Unlock this profile
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
          </>
          )}

          <div className="browse-fallback">
            <h3>Not seeing the right person?</h3>
            <p>
              We source for specific roles too. Tell us what you need and we&apos;ll go find and
              interview candidates for it.
            </p>
            <Link href="/start-hiring" className="lp-btn lp-btn-ghost">Request a role</Link>
          </div>
        </div>
      </section>

      <LpFooter />
    </div>
  )
}

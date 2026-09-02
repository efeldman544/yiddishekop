import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import LpHeader from '@/components/LpHeader'
import LpFooter from '@/components/LpFooter'
import { createClient } from '@/lib/supabase/server'
import { browseCandidates, type BrowseCard } from '@/lib/browse'
import BrowseFilters from './BrowseFilters'
import BrowseGrid from './BrowseGrid'

export const metadata: Metadata = {
  title: 'Browse Candidates | YiddisheKop',
  description: 'Browse vetted remote professionals from the frum community — bookkeepers, admins, sales, developers and more. Available now, no job post required.',
  openGraph: {
    title: 'Browse Candidates | YiddisheKop',
    description: 'Vetted remote professionals — available now. Browse the pool and pick who you want to meet.',
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
  // Browse never shows names — an introduction is how an employer learns who
  // someone is. Hiring accounts get the ability to ask for one.
  const canRequestIntro = role === 'employer' || role === 'admin'

  // A failed lookup must not read as "nobody matched" — that would quietly
  // misrepresent an empty pool to an employer.
  let cards: BrowseCard[] = []
  let industries: string[] = []
  let truncated = false
  let loadFailed = false
  try {
    ;({ cards, truncated, industries } = await browseCandidates(
      { industry: params.industry, employmentType: params.type, q: params.q },
      canRequestIntro,
      canRequestIntro ? user?.id : null,
    ))
  } catch (e) {
    console.error('browse load failed:', e instanceof Error ? e.message : e)
    loadFailed = true
  }

  return (
    <div className="lp">
      <LpHeader />

      {/* Deliberately short. Every line here is a line of candidates pushed
          below the fold, and the candidates are the point of the page. */}
      <section style={{ padding: '40px 0 20px' }}>
        <div className="wrap lp-page-head">
          <h1 style={{
            fontFamily: 'var(--font-fraunces), Fraunces, serif', fontWeight: 600,
            fontSize: 'clamp(26px,3vw,36px)', letterSpacing: '-0.02em', lineHeight: 1.1,
            color: 'var(--lp-text)', marginBottom: 8,
          }}>
            Candidates ready to work
          </h1>
          {!canRequestIntro && (
            <p style={{ fontSize: 15.5, color: 'var(--lp-text-dim)', lineHeight: 1.5, maxWidth: 620 }}>
              <Link href="/signup?role=employer" className="browse-gate-link">
                Create a free account
              </Link>{' '}
              for resumes and interviews.
            </p>
          )}
        </div>
      </section>

      <section style={{ padding: '0 0 80px' }}>
        <div className="wrap">
          <Suspense fallback={null}>
            <BrowseFilters industries={industries} />
          </Suspense>

          {loadFailed ? (
            <div className="browse-empty">
              <p><strong>We couldn&apos;t load the candidate list just now.</strong></p>
              <p>
                Please refresh in a moment, or{' '}
                <Link href="/start-hiring">tell us what you&apos;re looking for</Link>{' '}
                and we&apos;ll come back to you directly.
              </p>
            </div>
          ) : (
          <>
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
            <>
              <Suspense fallback={null}>
                <BrowseGrid cards={cards} canSeeResume={canRequestIntro} />
              </Suspense>
              {truncated && (
                <p className="browse-truncated">
                  That&apos;s as far as this list goes. Narrow it with the filters above, or{' '}
                  <Link href="/start-hiring">tell us what you&apos;re looking for</Link> and
                  we&apos;ll shortlist for you.
                </p>
              )}
            </>
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

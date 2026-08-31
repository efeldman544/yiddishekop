'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { BrowseCard } from '@/lib/browse'
import RequestIntroButton from './RequestIntroButton'

// Everyone who matches is already on the page — this only controls how many
// are painted at once. Numbered pages would fight the filters (change a
// filter on page 3 and "page 3" means something else), and a first paint of
// several hundred cards is slow on a phone. Revealing in batches keeps the
// page fast without ever putting a candidate out of reach.
const BATCH = 48

export default function BrowseGrid({ cards }: { cards: BrowseCard[] }) {
  const pathname = usePathname()
  const params = useSearchParams()

  // Set when someone was sent to sign up from a specific candidate and has
  // come back. Without this they'd land on the list having lost the person
  // they wanted — and possibly below the reveal cutoff.
  const wanted = params.get('ref')
  const wantedIndex = wanted ? cards.findIndex(c => c.ref === wanted) : -1

  const [shown, setShown] = useState(() =>
    wantedIndex >= 0 ? Math.ceil((wantedIndex + 1) / BATCH) * BATCH : BATCH
  )
  const visible = cards.slice(0, shown)
  const remaining = cards.length - visible.length

  const wantedEl = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (wantedIndex >= 0) wantedEl.current?.scrollIntoView({ block: 'center' })
  }, [wantedIndex])

  // Where signup should send them back to: this exact list, and this card.
  function returnTo(ref: string) {
    const sp = new URLSearchParams(params.toString())
    sp.set('ref', ref)
    return `${pathname}?${sp.toString()}`
  }

  return (
    <>
      <div className="browse-grid">
        {visible.map(c => {
          const isWanted = c.ref === wanted
          return (
            <article
              key={c.key}
              ref={isWanted ? wantedEl : undefined}
              className={`browse-card${isWanted ? ' is-wanted' : ''}`}
            >
              <div className="browse-card-top">
                <div>
                  <h3>{c.title}</h3>
                  <p className="browse-card-id">
                    Candidate #{c.ref}
                    {c.location && <> · {c.location}</>}
                  </p>
                </div>
                {c.interviewed && <span className="browse-badge">Interviewed</span>}
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
                  <Link
                    href={`/signup?role=employer&next=${encodeURIComponent(returnTo(c.ref))}`}
                    className="browse-card-cta"
                  >
                    Request introduction
                  </Link>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {remaining > 0 && (
        <div className="browse-more">
          <button
            type="button"
            className="lp-btn lp-btn-ghost"
            onClick={() => setShown(s => s + BATCH)}
          >
            Show more candidates
          </button>
        </div>
      )}
    </>
  )
}

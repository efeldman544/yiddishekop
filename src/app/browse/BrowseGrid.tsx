'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import type { BrowseCard } from '@/lib/browse'
import CandidateDialog, { PersonIcon } from './CandidateDialog'
import IndustryIcon from '@/components/IndustryIcon'
import { isInterviewed } from '@/lib/candidateStatus'

// Everyone who matches is already on the page — this only controls how many
// are painted at once. Numbered pages would fight the filters (change a
// filter on page 3 and "page 3" means something else), and a first paint of
// several hundred cards is slow on a phone. Revealing in batches keeps the
// page fast without ever putting a candidate out of reach.
const BATCH = 48

export default function BrowseGrid({
  cards,
  canSeeResume,
}: {
  cards: BrowseCard[]
  canSeeResume: boolean
}) {
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
  const [open, setOpen] = useState<BrowseCard | null>(null)
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
              className={`browse-card browse-card-tap${isWanted ? ' is-wanted' : ''}`}
            >
              {/* The whole card is the target. A button rather than a link:
                  this opens a panel, it doesn't navigate anywhere. */}
              <button type="button" className="browse-card-hit" onClick={() => setOpen(c)}>
                <span className="sr-only">View {c.firstName ?? `candidate #${c.ref}`}</span>
              </button>

              <div className="browse-card-top">
                {/* No play marker here: the Interviewed badge already says a
                    clip exists, and a play symbol on a card that can't play
                    reads as a broken control. The panel handles the video. */}
                <span className="cand-avatar" aria-hidden="true">
                  {c.firstName ? c.firstName.charAt(0).toUpperCase() : <PersonIcon />}
                </span>
                <div className="browse-card-who">
                  <h3>{c.title}</h3>
                  <p className="browse-card-id">
                    {c.firstName ?? `Candidate #${c.ref}`}
                    {c.location && <> · {c.location}</>}
                  </p>
                </div>
              </div>

              {/* Two pills, one row. Three wrapped onto a second line and made
                  a grid of a dozen cards read as a wall. Availability is a
                  filter and is in the panel; it doesn't earn space here. */}
              <div className="browse-card-tags browse-card-tags-tight">
                {isInterviewed(c) && <span className="browse-badge browse-badge-strong">Interviewed</span>}
                {c.industries.slice(0, 1).map(i => (
                  <span key={i} className="browse-tag">
                    <IndustryIcon industry={i} className="browse-tag-icon" />
                    {i}
                  </span>
                ))}
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

      {open && (
        <CandidateDialog
          card={open}
          canSeeResume={canSeeResume}
          signupHref={`/signup?role=employer&next=${encodeURIComponent(returnTo(open.ref))}`}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  )
}

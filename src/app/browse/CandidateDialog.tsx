'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import type { BrowseCard } from '@/lib/browse'
import RequestIntroButton from './RequestIntroButton'
import { resumeHref } from '@/lib/resumeUrl'

// The detail an employer wants once a card has caught their eye. Keeping it
// here rather than on every card is what lets the grid stay scannable — the
// cards carry only what you'd skim, and this carries the rest.

export default function CandidateDialog({
  card,
  signupHref,
  canSeeResume,
  onClose,
}: {
  card: BrowseCard
  signupHref: string
  canSeeResume: boolean
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    // The page behind must not scroll while this is open.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return (
    <div className="cand-dialog-backdrop" onClick={onClose} role="presentation">
      <div
        className="cand-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`${card.firstName ?? 'Candidate'} — ${card.title}`}
        onClick={e => e.stopPropagation()}
      >
        <button type="button" className="cand-dialog-close" onClick={onClose} aria-label="Close">×</button>

        <div className="cand-dialog-head">
          <span className="cand-avatar cand-avatar-lg" aria-hidden="true">
            {card.firstName ? card.firstName.charAt(0).toUpperCase() : <PersonIcon />}
          </span>
          <div>
            <h2>{card.title}</h2>
            <p className="cand-dialog-who">
              {card.firstName ?? `Candidate #${card.ref}`}
              {card.location && <> · {card.location}</>}
            </p>
            {card.interviewed && <span className="browse-badge browse-badge-strong">Interviewed on video</span>}
          </div>
        </div>

        {(card.industries.length > 0 || card.employmentType.length > 0) && (
          <div className="browse-card-tags">
            {card.industries.map(i => <span key={i} className="browse-tag">{i}</span>)}
            {card.employmentType.map(t => <span key={t} className="browse-tag browse-tag-muted">{t}</span>)}
          </div>
        )}

        <dl className="cand-dialog-meta">
          {card.yearsExperience && <div><dt>Experience</dt><dd>{card.yearsExperience}</dd></div>}
          {card.languages && <div><dt>Languages</dt><dd>{card.languages}</dd></div>}
          {card.usHours && <div><dt>Hours</dt><dd>Works U.S. hours</dd></div>}
          <div><dt>Reference</dt><dd>#{card.ref}</dd></div>
        </dl>

        <div className="cand-dialog-foot">
          {card.id ? (
            <>
              <RequestIntroButton candidateId={card.id} candidateRef={card.ref} />
              {canSeeResume && (
                <a
                  href={resumeHref(card.id, card.firstName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="browse-card-cta"
                >
                  View resume
                </a>
              )}
            </>
          ) : (
            <>
              <Link href={signupHref} className="lp-btn lp-btn-primary">Request introduction</Link>
              <p className="cand-dialog-note">
                Free hiring account — see the resume and ask to meet them.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5a7.5 7.5 0 0 1 15 0" />
    </svg>
  )
}

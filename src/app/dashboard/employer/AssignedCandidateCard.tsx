'use client'

import Link from 'next/link'
import { displayTitle, displayName } from '@/lib/candidateDisplay'
import { canonicalIndustries } from '@/lib/candidateTaxonomy'
import { resumeHref } from '@/lib/resumeUrl'
import VideoPlayer from './candidates/[id]/VideoPlayer'

// Laid out like the browse cards — role first, then who they are, then the
// tags and facts in the same order — so a candidate an employer already saw on
// /browse reads the same here. The difference is what they can now do: watch
// the interview inline and open the resume, without a round trip to the
// profile page.

export type AssignedCandidate = {
  id: string
  kind: 'profile' | 'video'
  name: string | null
  title: string | null
  rolesSeeking: string | null
  location: string | null
  industries: string[]
  employmentType: string[]
  yearsExperience: string | null
  languages: string | null
  usHours: boolean | null
  resumeUrl: string | null
  muxPlaybackId: string | null
  videoUrl: string | null
  action: string | null
}

export default function AssignedCandidateCard({ c }: { c: AssignedCandidate }) {
  const title = displayTitle(c.title, c.rolesSeeking, c.industries)
  const name = displayName(c.name)
  // "Other" tells an employer nothing, and browse omits it — match that.
  const industries = canonicalIndustries(c.industries).filter(i => i !== 'Other')
  const hasVideo = !!(c.muxPlaybackId || c.videoUrl)
  const profileHref = c.kind === 'video'
    ? `/dashboard/employer/video-candidates/${c.id}`
    : `/dashboard/employer/candidates/${c.id}`

  return (
    <article className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-950 tracking-tight">{title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {name ?? 'Candidate'}
              {c.location && <> · {c.location}</>}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {hasVideo && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                Interviewed
              </span>
            )}
            {c.action === 'request_meeting' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                Meeting requested
              </span>
            )}
            {c.action === 'pass' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-medium">
                Passed
              </span>
            )}
          </div>
        </div>

        {hasVideo && (
          <VideoPlayer muxPlaybackId={c.muxPlaybackId} url={c.videoUrl} />
        )}

        {(industries.length > 0 || c.employmentType.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {industries.map(i => (
              <span key={i} className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">{i}</span>
            ))}
            {c.employmentType.map(t => (
              <span key={t} className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{t}</span>
            ))}
          </div>
        )}

        {(c.yearsExperience || c.languages || c.usHours) && (
          <dl className="flex flex-wrap gap-x-8 gap-y-2 pt-1">
            {c.yearsExperience && (
              <div>
                <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Experience</dt>
                <dd className="text-sm text-gray-700 mt-0.5">{c.yearsExperience}</dd>
              </div>
            )}
            {c.languages && (
              <div>
                <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Languages</dt>
                <dd className="text-sm text-gray-700 mt-0.5">{c.languages}</dd>
              </div>
            )}
            {c.usHours && (
              <div>
                <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Hours</dt>
                <dd className="text-sm text-gray-700 mt-0.5">Works U.S. hours</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      <div className="border-t border-gray-100 px-6 py-3 flex items-center gap-3">
        {c.resumeUrl && (
          <a
            href={resumeHref(c.id, c.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            View resume
          </a>
        )}
        <Link
          href={profileHref}
          className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-1.5 transition-colors"
        >
          View profile
        </Link>
      </div>
    </article>
  )
}

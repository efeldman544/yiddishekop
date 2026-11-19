'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// How many things are waiting on the admin in each section, for the numbers
// in the sidebar. Rechecked on every page change and once a minute, so a
// number drops as soon as the thing is dealt with.

export type AdminBadges = {
  /** Employers asking to be introduced to a candidate, not yet handled. */
  intros: number
  /** Employers asking to meet a candidate, with no meeting scheduled yet. */
  meetings: number
  /** Hiring inquiries from the Start hiring form, not yet looked at. */
  jobs: number
  /** Recordings that aren't attached to anyone. */
  videos: number
}

const EMPTY: AdminBadges = { intros: 0, meetings: 0, jobs: 0, videos: 0 }

async function count(q: PromiseLike<{ count: number | null; error: unknown }>): Promise<number> {
  // A table that isn't set up yet counts as nothing waiting, not an error.
  const { count: n, error } = await q
  return error ? 0 : n ?? 0
}

async function load(): Promise<AdminBadges> {
  const db = createClient()
  const [intros, jobs, videos, jobMeetings, directMeetings, scheduled] = await Promise.all([
    count(db.from('introduction_requests').select('id', { count: 'exact', head: true }).eq('status', 'new')),
    count(db.from('job_requirements').select('id', { count: 'exact', head: true }).eq('status', 'New')),
    count(db.from('videos').select('id', { count: 'exact', head: true }).is('candidate_id', null)),
    db.from('candidate_job_assignments').select('id').eq('action', 'request_meeting'),
    db.from('employer_candidate_assignments').select('id').eq('action', 'request_meeting'),
    db.from('meeting_requests').select('assignment_id'),
  ])
  // The same rule the Meetings page uses: a request is waiting until a
  // meeting has been scheduled for it.
  const done = new Set((scheduled.data ?? []).map((m: { assignment_id: string | null }) => m.assignment_id))
  const meetings = [...(jobMeetings.data ?? []), ...(directMeetings.data ?? [])]
    .filter((a: { id: string }) => !done.has(a.id)).length
  return { intros, jobs, videos, meetings }
}

export function useAdminBadges(pathname: string): AdminBadges {
  const [badges, setBadges] = useState<AdminBadges>(EMPTY)
  useEffect(() => {
    let live = true
    const refresh = () => { load().then(b => { if (live) setBadges(b) }).catch(() => {}) }
    const first = setTimeout(refresh, 0)
    const timer = setInterval(refresh, 60_000)
    return () => { live = false; clearTimeout(first); clearInterval(timer) }
  }, [pathname])
  return badges
}

// One definition each for "has this candidate been interviewed" and "where has
// this introduction request got to".
//
// Both used to be written out by hand on every screen, and had drifted:
// browse counted a clip as proof of an interview while the employer portal
// counted only the clip and admin counted only the flag, so the same candidate
// could be badged on one page and not another. The request statuses were worse
// — employers read "With our team", admins read the raw database value.

/**
 * Interviewed if someone marked them so, or if a clip exists — a clip is proof
 * regardless of whether anyone remembered to tick the box.
 */
export function isInterviewed(c: { interviewed?: boolean | null; hasVideo?: boolean | null }): boolean {
  return !!(c.interviewed || c.hasVideo)
}

export type IntroStatus = 'new' | 'actioned' | 'dismissed'

/** Statuses are stored lowercase here and capitalised on job_requirements. */
function normalize(status: string | null | undefined): IntroStatus {
  const s = (status ?? '').trim().toLowerCase()
  return s === 'actioned' || s === 'dismissed' ? s : 'new'
}

/** What an employer should read. They see progress, not our workflow. */
export function introStatusForEmployer(status: string | null | undefined): {
  label: string
  tone: 'pending' | 'done' | 'closed'
} {
  switch (normalize(status)) {
    case 'actioned': return { label: 'Introduced', tone: 'done' }
    case 'dismissed': return { label: 'Closed', tone: 'closed' }
    default: return { label: 'With our team', tone: 'pending' }
  }
}

/** What an admin should read — the same states, named as work. */
export function introStatusForAdmin(status: string | null | undefined): string {
  switch (normalize(status)) {
    case 'actioned': return 'Handled'
    case 'dismissed': return 'Dismissed'
    default: return 'Awaiting action'
  }
}

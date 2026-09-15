// Chrome's built-in PDF viewer ignores the `filename` in a
// `Content-Disposition: inline` response and names a saved file after the last
// URL segment instead. With a bare /api/resume/<uuid> link that means the
// candidate saves as "8f3c1a2e-....pdf". Carrying the display name as a
// trailing (decorative) path segment makes the saved name correct in every
// browser; the route ignores the segment and keys off the id.

// The saved file is named after the candidate, so it has to follow the same
// rule browse does: a first name, never the surname. Naming it after the full
// name meant an employer who opened a redacted resume learned whose it was
// from the download itself — the one thing the redaction is there to prevent.
//
// Deliberately not imported from browse.ts: that module is server-only, and
// this one is reached from client components.
export function resumeFileName(fullName: string | null | undefined): string {
  const first = String(fullName ?? '').trim().split(/\s+/)[0] ?? ''
  const cleaned = first.replace(/[^\p{L}'\-]/gu, '')
  return `${cleaned.length >= 2 ? cleaned : 'Candidate'} - Resume (redacted).pdf`
}

export function resumeHref(candidateId: string, fullName: string | null | undefined): string {
  return `/api/resume/${candidateId}/${encodeURIComponent(resumeFileName(fullName))}`
}

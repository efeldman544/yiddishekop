// Chrome's built-in PDF viewer ignores the `filename` in a
// `Content-Disposition: inline` response and names a saved file after the last
// URL segment instead. With a bare /api/resume/<uuid> link that means the
// candidate saves as "8f3c1a2e-....pdf". Carrying the display name as a
// trailing (decorative) path segment makes the saved name correct in every
// browser; the route ignores the segment and keys off the id.

export function resumeFileName(fullName: string | null | undefined): string {
  const cleaned = String(fullName ?? '').replace(/[^\w\s.\-]/g, '').trim()
  return `${cleaned || 'Resume'} - Resume (redacted).pdf`
}

export function resumeHref(candidateId: string, fullName: string | null | undefined): string {
  return `/api/resume/${candidateId}/${encodeURIComponent(resumeFileName(fullName))}`
}

'use client'

// The Candidates list hands a candidate page the list it was opened from, so
// the page can offer Previous and Next through it — working through a batch
// no longer means going back to the list for every one.
//
// Also which candidate was last looked at, so the list can pick it out when
// you return.

const SEQUENCE_KEY = 'admin:candidate-sequence'
export const LAST_OPENED_KEY = 'admin:last-candidate'

export type Source = 'profile' | 'video'
export type SequenceItem = { id: string; source?: Source }

/** Where a candidate's page is: profiles and video-interview candidates have their own. */
export function candidateHref(c: SequenceItem): string {
  return c.source === 'video' ? `/dashboard/admin/video-candidates/${c.id}` : `/dashboard/admin/candidates/${c.id}`
}

/** Called by the list as a candidate is opened: the candidates in view, in order. */
export function saveSequence(items: SequenceItem[], opened: string): void {
  try {
    // 'v:' marks a video candidate; kept short because the list can be long.
    sessionStorage.setItem(SEQUENCE_KEY, JSON.stringify(items.map(i => (i.source === 'video' ? `v:${i.id}` : i.id))))
    sessionStorage.setItem(LAST_OPENED_KEY, opened)
  } catch {
    // Storage unavailable: no Previous/Next, nothing else lost.
  }
}

/** The raw stored list, for useSyncExternalStore; parse with parseSequence. */
export function readSequenceRaw(): string | null {
  try { return sessionStorage.getItem(SEQUENCE_KEY) } catch { return null }
}

export function parseSequence(raw: string | null): SequenceItem[] {
  if (!raw) return []
  try {
    const ids = JSON.parse(raw)
    if (!Array.isArray(ids)) return []
    return ids
      .filter((x): x is string => typeof x === 'string')
      .map(x => (x.startsWith('v:') ? { id: x.slice(2), source: 'video' as const } : { id: x, source: 'profile' as const }))
  } catch {
    return []
  }
}

/** Moving to another candidate makes it the one the list picks out. */
export function noteOpened(id: string): void {
  try { sessionStorage.setItem(LAST_OPENED_KEY, id) } catch {}
}

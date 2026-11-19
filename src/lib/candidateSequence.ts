'use client'

// The Candidates list hands a candidate page the list it was opened from, so
// the page can offer Previous and Next through it — working through a batch
// no longer means going back to the list for every one.
//
// Also which candidate was last looked at, so the list can pick it out when
// you return.

const SEQUENCE_KEY = 'admin:candidate-sequence'
export const LAST_OPENED_KEY = 'admin:last-candidate'

/** Called by the list as a candidate is opened: the candidates in view, in order. */
export function saveSequence(ids: string[], opened: string): void {
  try {
    sessionStorage.setItem(SEQUENCE_KEY, JSON.stringify(ids))
    sessionStorage.setItem(LAST_OPENED_KEY, opened)
  } catch {
    // Storage unavailable: no Previous/Next, nothing else lost.
  }
}

/** The raw stored list, for useSyncExternalStore; parse with parseSequence. */
export function readSequenceRaw(): string | null {
  try { return sessionStorage.getItem(SEQUENCE_KEY) } catch { return null }
}

export function parseSequence(raw: string | null): string[] {
  if (!raw) return []
  try {
    const ids = JSON.parse(raw)
    return Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

/** Moving to another candidate makes it the one the list picks out. */
export function noteOpened(id: string): void {
  try { sessionStorage.setItem(LAST_OPENED_KEY, id) } catch {}
}

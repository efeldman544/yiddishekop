// Whether this tab has navigated at least once inside the app.
//
// A Back button that always calls router.back() sends someone straight off the
// site when they opened a detail page directly — a bookmark, a pasted link, or
// a refresh. Counting our own navigations tells the button whether there is
// anywhere in-app to go back to, so it can fall back to the list instead.

const KEY = 'nav-depth'

export function noteNavigation(): void {
  try {
    const n = Number(sessionStorage.getItem(KEY) ?? '0')
    sessionStorage.setItem(KEY, String(n + 1))
  } catch {
    // Private mode or blocked storage — the fallback href still works.
  }
}

export function hasInAppHistory(): boolean {
  try {
    return Number(sessionStorage.getItem(KEY) ?? '0') > 1
  } catch {
    return false
  }
}

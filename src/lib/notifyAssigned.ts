// Tell an employer a candidate has been assigned to them.
//
// The assignment itself is already saved by the time this runs, so a failure
// here must not undo anything — but it must not be swallowed either. Every
// caller passes an `onError` so the admin sees "assigned, but not notified"
// rather than assuming the employer was told.

type Target =
  | { candidate_id: string; job_id: string }
  | { candidate_id: string; employer_id: string }

export async function notifyAssigned(
  target: Target,
  onError: (message: string) => void,
): Promise<void> {
  try {
    const res = await fetch('/api/notifications/candidate-assigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(target),
    })
    if (!res.ok) {
      onError(await res.text().catch(() => '') || `request failed (${res.status})`)
      return
    }
    const body = await res.json().catch(() => null)
    if (body && body.notified === false) onError(body.error ?? 'the notification could not be saved')
  } catch {
    onError('network error')
  }
}

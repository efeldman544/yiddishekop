// Ask for a candidate's card to be rebuilt after an admin changes something it
// is made from. Not awaited and never surfaced: the save it follows has
// already succeeded, and a card that fails to rebuild is simply listed as out
// of date on the Matching page, where it can be built by hand.
//
// `force` is for a resume upload. A file replaced under the same name keeps
// its address, so nothing the cheap staleness check looks at has changed.
export function refreshCandidateCard(candidateId: string, opts: { force?: boolean } = {}): void {
  fetch('/api/admin/candidate-cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage: 'build', force: opts.force === true, items: [{ id: candidateId, source: 'profile' }] }),
    keepalive: true,
  }).catch(() => {})
}

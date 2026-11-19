// What a tool call is doing, in a few words, for the chat to show while it
// runs. Shared by the server and the chat page, so it holds no server code.

export function describeCall(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case 'search_candidates': return input.keyword ? `Searching candidates for “${input.keyword}”` : 'Listing candidates'
    case 'get_candidate': return 'Opening a candidate’s profile'
    case 'read_resume': return 'Reading a résumé'
    case 'read_transcript': return 'Reading an interview transcript'
    case 'list_jobs': return 'Listing jobs'
    case 'get_job': return 'Opening a job'
    default: return 'Looking something up'
  }
}

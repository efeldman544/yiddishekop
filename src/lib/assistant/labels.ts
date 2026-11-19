// What a tool call is doing, in a few words, for the chat to show while it
// runs. Shared by the server and the chat page, so it holds no server code.

/** The tools that change something, and so wait for the admin to confirm. */
export const ACTION_NAMES = [
  'set_candidate_status', 'set_interviewed', 'update_industry_tags', 'assign_to_job', 'unassign_from_job',
  'assign_to_employer', 'create_job', 'create_candidate', 'attach_resume',
]

export function describeCall(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case 'search_candidates': return input.keyword ? `Searching candidates for “${input.keyword}”` : 'Listing candidates'
    case 'get_candidate': return 'Opening a candidate’s profile'
    case 'read_resume': return 'Reading a résumé'
    case 'read_transcript': return 'Reading an interview transcript'
    case 'read_attached_file': return 'Reading the attached file'
    case 'list_jobs': return 'Listing jobs'
    case 'get_job': return 'Opening a job'
    case 'set_candidate_status': return 'Proposed a status change'
    case 'set_interviewed': return 'Proposed marking interviewed'
    case 'update_industry_tags': return 'Proposed tag changes'
    case 'assign_to_job': return 'Proposed assigning to a job'
    case 'unassign_from_job': return 'Proposed removing from a job'
    case 'assign_to_employer': return 'Proposed sharing with an employer'
    case 'create_job': return 'Proposed a new job'
    case 'create_candidate': return 'Proposed a new candidate'
    case 'attach_resume': return 'Proposed adding a résumé'
    default: return 'Looking something up'
  }
}

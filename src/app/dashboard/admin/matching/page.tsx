import { createClient } from '@/lib/supabase/server'
import MatchingClient, { type MatchJob, type MatchCandidate } from './MatchingClient'
import MeetingsClient from '../meetings/MeetingsClient'
import PipelineTabs from './PipelineTabs'

export default async function AdminMatchingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const tab = params?.tab === 'meetings' ? 'meetings' : 'pipeline'

  const supabase = await createClient()

  const [{ data: jobData }, { data: candidateData }, { data: assignmentData }] = await Promise.all([
    supabase
      .from('job_requirements')
      .select('id, job_title, employment_type, languages, description, status, company_name, employer_id')
      .in('status', ['Open', 'On Hold'])
      .order('created_at', { ascending: false }),
    supabase
      .from('candidate_profiles')
      .select('id, full_name, current_job_title, location, fields_worked_in, employment_type, languages, roles_seeking, us_hours_comfortable, status, admin_tags')
      .eq('status', 'active')
      .order('full_name'),
    supabase
      .from('candidate_job_assignments')
      .select('candidate_id, job_id'),
  ])

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] overflow-hidden">
      <PipelineTabs activeTab={tab} />
      {tab === 'meetings' ? (
        <div className="flex-1 overflow-auto px-8 py-6">
          <MeetingsClient />
        </div>
      ) : (
        <MatchingClient
          jobs={(jobData as MatchJob[]) ?? []}
          candidates={(candidateData as MatchCandidate[]) ?? []}
          initialAssignments={(assignmentData ?? []) as { candidate_id: string; job_id: string }[]}
        />
      )}
    </div>
  )
}

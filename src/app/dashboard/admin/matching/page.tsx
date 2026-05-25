import { createClient } from '@/lib/supabase/server'
import MatchingClient, { type MatchJob, type MatchCandidate } from './MatchingClient'

export default async function AdminMatchingPage() {
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
    <MatchingClient
      jobs={(jobData as MatchJob[]) ?? []}
      candidates={(candidateData as MatchCandidate[]) ?? []}
      initialAssignments={(assignmentData ?? []) as { candidate_id: string; job_id: string }[]}
    />
  )
}

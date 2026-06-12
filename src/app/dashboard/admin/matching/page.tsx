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

  const [{ data: jobData }, { data: candidateData }, { data: assignmentData }, { data: videoData }] = await Promise.all([
    supabase
      .from('job_requirements')
      .select('id, job_title, employment_type, languages, description, status, company_name, employer_id, employer_profiles(company_name)')
      .in('status', ['Open', 'On Hold'])
      .order('created_at', { ascending: false }),
    supabase
      .from('candidate_profiles')
      .select('id, full_name, current_job_title, location, fields_worked_in, employment_type, languages, roles_seeking, us_hours_comfortable, status, admin_tags, interviewed')
      .eq('status', 'active')
      .order('full_name'),
    supabase
      .from('candidate_job_assignments')
      .select('candidate_id, job_id'),
    supabase
      .from('video_candidates')
      .select('id, name, location, current_job_title, fields_worked_in, employment_type')
      .order('created_at', { ascending: false }),
  ])

  // Resolve company name: job's own field → employer profile's company → employer's full name
  const missingNameEmployerIds = (jobData ?? [])
    .filter((j: any) => !j.company_name && !j.employer_profiles?.company_name && j.employer_id)
    .map((j: any) => j.employer_id)
  const employerNameMap: Record<string, string> = {}
  if (missingNameEmployerIds.length > 0) {
    const { data: employerProfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', missingNameEmployerIds)
    for (const p of employerProfiles ?? []) {
      if (p.full_name) employerNameMap[p.id] = p.full_name
    }
  }

  const jobs: MatchJob[] = (jobData ?? []).map((j: any) => ({
    id: j.id,
    job_title: j.job_title,
    employment_type: j.employment_type,
    languages: j.languages,
    description: j.description,
    status: j.status,
    employer_id: j.employer_id,
    company_name:
      j.company_name
      || j.employer_profiles?.company_name
      || (j.employer_id ? employerNameMap[j.employer_id] : null)
      || null,
  }))

  const regularCandidates: MatchCandidate[] = (candidateData ?? []).map((c: any) => ({
    ...c,
    source: 'profile' as const,
  }))

  const videoCandidates: MatchCandidate[] = (videoData ?? []).map((v: any) => ({
    id: v.id,
    full_name: v.name,
    current_job_title: v.current_job_title,
    location: v.location,
    fields_worked_in: v.fields_worked_in ?? [],
    employment_type: v.employment_type ?? [],
    languages: null,
    roles_seeking: null,
    us_hours_comfortable: null,
    status: 'active',
    admin_tags: [],
    interviewed: true,
    source: 'video' as const,
  }))

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] overflow-hidden">
      <PipelineTabs activeTab={tab} />
      {tab === 'meetings' ? (
        <div className="flex-1 overflow-auto px-8 py-6">
          <MeetingsClient />
        </div>
      ) : (
        <MatchingClient
          jobs={jobs}
          candidates={[...regularCandidates, ...videoCandidates]}
          initialAssignments={(assignmentData ?? []) as { candidate_id: string; job_id: string }[]}
        />
      )}
    </div>
  )
}


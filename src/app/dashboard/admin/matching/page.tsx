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
      // No employer_profiles(...) embed here: that join resolved through the
      // old employer_id → employer_profiles FK; the FK now points at profiles,
      // so the embed errors and the whole query returns nothing. Company names
      // are batch-fetched below instead.
      .select('id, job_title, employment_type, languages, description, status, company_name, employer_id')
      .in('status', ['New', 'Open', 'On Hold'])
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
  const employerIds = [...new Set((jobData ?? []).map((j: any) => j.employer_id).filter(Boolean))] as string[]
  const companyMap: Record<string, string> = {}
  const employerNameMap: Record<string, string> = {}
  if (employerIds.length > 0) {
    const [{ data: employerProfiles }, { data: employerAccounts }] = await Promise.all([
      supabase.from('employer_profiles').select('id, company_name').in('id', employerIds),
      supabase.from('profiles').select('id, full_name').in('id', employerIds),
    ])
    for (const e of employerProfiles ?? []) {
      if (e.company_name) companyMap[e.id] = e.company_name
    }
    for (const p of employerAccounts ?? []) {
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
      || (j.employer_id ? companyMap[j.employer_id] : null)
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


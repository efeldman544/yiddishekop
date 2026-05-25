import { createClient } from '@/lib/supabase/server'
import JobsClient, { type Job, type EmployerOption, employerLabel } from './JobsClient'

export default async function AdminJobsPage() {
  const supabase = await createClient()

  const [{ data: jobData }, { data: empData }, { data: profileData }] = await Promise.all([
    supabase.from('job_requirements').select('*').order('created_at', { ascending: false }),
    supabase.from('employer_profiles').select('id, company_name'),
    supabase.from('profiles').select('id, full_name').eq('role', 'employer'),
  ])

  const empMap: Record<string, EmployerOption> = {}
  for (const p of profileData ?? []) empMap[p.id] = { id: p.id, company_name: null, full_name: p.full_name }
  for (const ep of empData ?? []) {
    if (empMap[ep.id]) empMap[ep.id].company_name = ep.company_name
    else empMap[ep.id] = { id: ep.id, company_name: ep.company_name, full_name: null }
  }

  const initialEmployers = Object.values(empMap).sort((a, b) => employerLabel(a).localeCompare(employerLabel(b)))
  const initialJobs = (jobData as Job[]) ?? []

  return <JobsClient initialJobs={initialJobs} initialEmployers={initialEmployers} />
}

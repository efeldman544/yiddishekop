import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { CandidateProfile } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import VideoPlayer from './VideoPlayer'
import CandidateActions from './CandidateActions'

type Video = {
  id: string
  mux_playback_id: string | null
  url: string | null
  candidate_id: string
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  )
}

export default async function EmployerCandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // A candidate reaches this employer either via one of their jobs
  // (candidate_job_assignments) or via a direct admin assignment
  // (employer_candidate_assignments). Accept both; job-based wins when present.
  const [{ data: matches }, { data: directMatches }, { data: candidate }, { data: videos }] = await Promise.all([
    supabase
      .from('candidate_job_assignments')
      .select('id, action, proposed_times, job_requirements!inner(employer_id)')
      .eq('job_requirements.employer_id', user.id)
      .eq('candidate_id', id)
      .limit(1),
    supabase
      .from('employer_candidate_assignments')
      .select('id, action, proposed_times')
      .eq('employer_id', user.id)
      .eq('candidate_id', id)
      .limit(1),
    supabase.from('candidate_profiles').select('*').eq('id', id).single<CandidateProfile>(),
    supabase.from('videos').select('*').eq('candidate_id', id).order('created_at', { ascending: false }).limit(1),
  ])

  const jobMatch = matches?.[0]
  const directMatch = directMatches?.[0]
  const match = jobMatch ?? directMatch
  if (!match) notFound()
  const assignmentTable = jobMatch ? 'candidate_job_assignments' : 'employer_candidate_assignments'

  // Look up by candidate+employer (not assignment_id) so scheduled meetings
  // resolve for both assignment kinds
  const { data: meetingData } = await supabase
    .from('meeting_requests')
    .select('scheduled_at, meeting_link, notes')
    .eq('candidate_id', id)
    .eq('employer_id', user.id)
    .maybeSingle()

  if (!candidate) notFound()

  const video = videos?.[0] as Video | undefined
  const meeting = meetingData as { scheduled_at: string; meeting_link: string | null; notes: string | null } | null

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">

      <Card className="mb-6">
        <CardContent className="pt-5">
          <h1 className="text-2xl font-bold tracking-tight">{candidate.full_name ?? 'Unnamed'}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {[candidate.current_job_title, candidate.location].filter(Boolean).join(' · ')}
          </p>
          <div className="flex flex-wrap gap-1 mt-3">
            {candidate.fields_worked_in?.map(f => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}
            {candidate.employment_type?.map(e => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">

          <Card>
            <CardHeader><CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Background</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Education" value={candidate.education_level} />
                <Field label="Experience" value={candidate.years_experience} />
                <Field label="Languages" value={candidate.languages} />
                <Field label="Tools & Software" value={candidate.tools_software} />
                <Field label="Roles Seeking" value={candidate.roles_seeking} />
                <Field label="U.S. Hours" value={candidate.us_hours_comfortable === true ? 'Yes' : candidate.us_hours_comfortable === false ? 'No' : null} />
                <Field label="Remote Experience" value={candidate.remote_experience === true ? 'Yes' : candidate.remote_experience === false ? 'No' : null} />
              </dl>
            </CardContent>
          </Card>

          {candidate.resume_url && (
            <Card>
              <CardHeader><CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Resume</CardTitle></CardHeader>
              <CardContent>
                <a href={`/api/resume/${candidate.id}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-indigo-600 underline underline-offset-4 font-medium">
                  View resume →
                </a>
              </CardContent>
            </Card>
          )}

          {(video?.mux_playback_id || video?.url) && (
            <Card>
              <CardHeader><CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Screening video</CardTitle></CardHeader>
              <CardContent>
                <VideoPlayer muxPlaybackId={video.mux_playback_id} url={video.url} />
              </CardContent>
            </Card>
          )}

        </div>

        <div className="space-y-5">
          <CandidateActions
            candidateId={id}
            assignmentId={match.id}
            assignmentTable={assignmentTable}
            initialAction={(match.action ?? null) as 'request_meeting' | 'pass' | null}
            initialProposedTimes={(match.proposed_times ?? []) as string[]}
            meeting={meeting}
          />
        </div>
      </div>

    </main>
  )
}

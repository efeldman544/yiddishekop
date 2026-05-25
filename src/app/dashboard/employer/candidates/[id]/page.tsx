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
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  )
}

export default async function EmployerCandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myJobs } = await supabase.from('job_requirements').select('id').eq('employer_id', user.id)
  const jobIds = (myJobs ?? []).map((j: { id: string }) => j.id)
  if (jobIds.length === 0) notFound()

  const { data: match } = await supabase
    .from('candidate_job_assignments')
    .select('id, action, proposed_times')
    .in('job_id', jobIds)
    .eq('candidate_id', id)
    .maybeSingle()
  if (!match) notFound()

  const [{ data: candidate }, { data: videos }, { data: meetingData }] = await Promise.all([
    supabase.from('candidate_profiles').select('*').eq('id', id).single<CandidateProfile>(),
    supabase.from('videos').select('*').eq('candidate_id', id).order('created_at', { ascending: false }).limit(1),
    supabase.from('meeting_requests').select('scheduled_at, meeting_link, notes').eq('assignment_id', match.id).maybeSingle(),
  ])

  if (!candidate) notFound()

  const video = videos?.[0] as Video | undefined
  const meeting = meetingData as { scheduled_at: string; meeting_link: string | null; notes: string | null } | null

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="max-w-3xl space-y-5">

        <Card>
          <CardContent className="pt-5">
            <h2 className="text-xl font-semibold tracking-tight">{candidate.full_name ?? 'Unnamed'}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {[candidate.current_job_title, candidate.location].filter(Boolean).join(' · ')}
            </p>
            <div className="flex flex-wrap gap-1 mt-3">
              {candidate.fields_worked_in?.map(f => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}
              {candidate.employment_type?.map(e => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Background</CardTitle></CardHeader>
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
            <CardHeader><CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Resume</CardTitle></CardHeader>
            <CardContent>
              <a href={`/api/resume/${candidate.id}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary underline underline-offset-4 font-medium">
                View resume →
              </a>
            </CardContent>
          </Card>
        )}

        {(video?.mux_playback_id || video?.url) && (
          <Card>
            <CardHeader><CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Screening video</CardTitle></CardHeader>
            <CardContent>
              <VideoPlayer muxPlaybackId={video.mux_playback_id} url={video.url} />
            </CardContent>
          </Card>
        )}

        <CandidateActions
          candidateId={id}
          assignmentId={match.id}
          initialAction={(match.action ?? null) as 'request_meeting' | 'pass' | null}
          initialProposedTimes={(match.proposed_times ?? []) as string[]}
          meeting={meeting}
        />

      </div>
    </main>
  )
}

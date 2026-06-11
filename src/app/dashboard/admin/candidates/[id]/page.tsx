import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { CandidateProfile } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import VideoSection, { type Video } from './VideoSection'
import AdminControls, { type Employer } from './AdminControls'
import BackButton from './BackButton'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  )
}

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: cp }, { data: videos }, { data: employerList }, { data: assignments }] = await Promise.all([
    supabase.from('candidate_profiles').select('*').eq('id', id).single<CandidateProfile>(),
    supabase.from('videos').select('*').eq('candidate_id', id).order('created_at', { ascending: false }).limit(1),
    supabase.from('profiles').select('id, full_name, email').eq('role', 'employer').order('full_name'),
    supabase.from('employer_candidate_assignments').select('employer_id, action').eq('candidate_id', id),
  ])

  if (!cp) notFound()

  const video = (videos?.[0] ?? null) as Video | null
  const employers = (employerList ?? []) as Employer[]
  const asgn = (assignments ?? []) as { employer_id: string; action: string | null }[]
  const initialAssignedIds = asgn.map(a => a.employer_id)
  const initialEmployerActions = Object.fromEntries(asgn.map(a => [a.employer_id, a.action]))

  return (
    <main className="px-8 py-8 space-y-6">

      <BackButton />

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{cp.full_name ?? 'Unnamed'}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {[cp.current_job_title, cp.location].filter(Boolean).join(' · ')}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {cp.fields_worked_in?.map(f => (
                  <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                ))}
              </div>
            </div>
            <Badge variant="outline" className="capitalize">{cp.status ?? 'active'}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">

          <Card>
            <CardHeader><CardTitle className="text-sm">Contact</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                <Field label="Email" value={cp.email} />
                <Field label="Phone" value={cp.phone} />
                <Field label="WhatsApp" value={cp.whatsapp} />
                <Field label="Location" value={cp.location} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Background</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                <Field label="Education" value={cp.education_level} />
                <Field label="Experience" value={cp.years_experience} />
                <Field label="Languages" value={cp.languages} />
                <Field label="Tools & Software" value={cp.tools_software} />
                <Field label="Roles Seeking" value={cp.roles_seeking} />
                <Field label="Employment Type" value={cp.employment_type?.join(', ')} />
                <Field label="Desired Salary" value={cp.desired_salary ? `${cp.desired_salary}${cp.currency ? ` ${cp.currency}` : ''}` : null} />
                <Field label="U.S. Hours" value={cp.us_hours_comfortable === true ? 'Yes' : cp.us_hours_comfortable === false ? 'No' : null} />
                <Field label="Remote Experience" value={cp.remote_experience === true ? 'Yes' : cp.remote_experience === false ? 'No' : null} />
              </dl>
            </CardContent>
          </Card>

          {cp.resume_url && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Resume</CardTitle></CardHeader>
              <CardContent>
                <a href={cp.resume_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary underline underline-offset-4 font-medium">
                  View resume →
                </a>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-sm">Screening call</CardTitle></CardHeader>
            <CardContent>
              {cp.screening_booked ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700 border-green-200">Booked</Badge>
                  {cp.screening_booked_at && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(cp.screening_booked_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ) : (
                <Badge variant="secondary">Not booked</Badge>
              )}
            </CardContent>
          </Card>

          <VideoSection candidateId={id} initialVideo={video} />

        </div>

        <AdminControls
          candidateId={id}
          initialStatus={cp.status ?? 'active'}
          initialTags={cp.admin_tags ?? []}
          employers={employers}
          initialAssignedIds={initialAssignedIds}
          initialEmployerActions={initialEmployerActions}
        />
      </div>

    </main>
  )
}

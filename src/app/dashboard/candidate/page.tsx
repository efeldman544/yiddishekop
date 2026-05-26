import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { CandidateProfile } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  active:   { label: 'Active — open to opportunities',  variant: 'default' },
  inactive: { label: 'Inactive — not looking right now', variant: 'secondary' },
  placed:   { label: 'Placed',                           variant: 'outline' },
}

function StepItem({
  number, title, description, done, locked, href, linkLabel,
}: {
  number: number; title: string; description: string
  done: boolean; locked: boolean; href: string; linkLabel: string
}) {
  return (
    <div className={`flex items-center gap-4 px-4 py-3.5 rounded-lg border transition-colors ${
      done ? 'bg-emerald-50/60 border-emerald-200' : locked ? 'bg-muted/50 border-border opacity-50' : 'bg-white border-gray-200'
    }`}>
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
        done ? 'bg-emerald-500 text-white' : locked ? 'bg-muted text-muted-foreground' : 'bg-indigo-600 text-white'
      }`}>
        {done ? '✓' : number}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold ${done ? 'text-emerald-800' : 'text-foreground'}`}>{title}</p>
        <p className={`text-[12px] mt-0.5 ${done ? 'text-emerald-600' : 'text-muted-foreground'}`}>
          {done ? 'Completed' : description}
        </p>
      </div>
      {!locked && (
        <Link href={href} className={`shrink-0 text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors ${
          done ? 'text-emerald-700 hover:text-emerald-900' : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}>
          {done ? 'Edit' : linkLabel}
        </Link>
      )}
    </div>
  )
}

export default async function CandidateDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: cp }, { data: upcomingMeeting }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single<{ full_name: string | null }>(),
    supabase.from('candidate_profiles').select('*').eq('id', user.id).single<CandidateProfile>(),
    supabase.from('meeting_requests').select('scheduled_at, meeting_link, notes').eq('candidate_id', user.id).eq('status', 'scheduled').gte('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).limit(1).maybeSingle(),
  ])

  const step1Done = !!(cp?.full_name && cp?.phone && cp?.location && cp?.current_job_title && cp?.fields_worked_in?.length && cp?.employment_type?.length)
  const step2Done = !!cp?.screening_booked
  const status = cp?.status || 'active'
  const statusStyle = STATUS_LABELS[status] ?? STATUS_LABELS['active']

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-950 tracking-tight">
            {profile?.full_name ? `Welcome, ${profile.full_name}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">Track your application and manage your profile.</p>
        </div>
        {cp && (
          <Link href="/dashboard/candidate/profile"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
            Edit profile →
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Getting started</p>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <StepItem number={1} title="Complete your profile"
            description="Add your details so we can match you with the right opportunities."
            done={step1Done} locked={false} href="/dashboard/candidate/profile" linkLabel="Get started" />
          <StepItem number={2} title="Book your screening call"
            description="Schedule a short call with our team to discuss your job search."
            done={step2Done} locked={!step1Done} href="/dashboard/candidate/booking" linkLabel="Book now" />
        </CardContent>
      </Card>

      {upcomingMeeting && (
        <Card className="border-indigo-100 bg-indigo-50/50">
          <CardHeader>
            <p className="text-[11px] font-semibold text-indigo-700 uppercase tracking-widest">Upcoming meeting</p>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <p className="text-sm font-medium text-gray-900">
              {new Date(upcomingMeeting.scheduled_at).toLocaleString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
              })}
            </p>
            {upcomingMeeting.meeting_link && (
              <a
                href={upcomingMeeting.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-indigo-700 underline underline-offset-4 font-medium"
              >
                Join meeting
              </a>
            )}
            {upcomingMeeting.notes && (
              <p className="text-xs text-indigo-700">{upcomingMeeting.notes}</p>
            )}
          </CardContent>
        </Card>
      )}

      {cp && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Badge variant={statusStyle.variant}>{statusStyle.label}</Badge>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {cp.location && (<><dt className="text-muted-foreground">Location</dt><dd>{cp.location}</dd></>)}
              {cp.current_job_title && (<><dt className="text-muted-foreground">Current title</dt><dd>{cp.current_job_title}</dd></>)}
              {cp.years_experience && (<><dt className="text-muted-foreground">Experience</dt><dd>{cp.years_experience}</dd></>)}
              {cp.fields_worked_in?.length > 0 && (<><dt className="text-muted-foreground">Fields</dt><dd>{cp.fields_worked_in.join(', ')}</dd></>)}
              {cp.employment_type?.length > 0 && (<><dt className="text-muted-foreground">Employment</dt><dd>{cp.employment_type.join(', ')}</dd></>)}
              {cp.desired_salary && (<><dt className="text-muted-foreground">Desired salary</dt><dd>{cp.desired_salary}{cp.currency ? ` ${cp.currency}` : ''}</dd></>)}
              {cp.us_hours_comfortable !== null && cp.us_hours_comfortable !== undefined && (<><dt className="text-muted-foreground">U.S. hours</dt><dd>{cp.us_hours_comfortable ? 'Yes' : 'No'}</dd></>)}
              {cp.remote_experience !== null && cp.remote_experience !== undefined && (<><dt className="text-muted-foreground">Remote experience</dt><dd>{cp.remote_experience ? 'Yes' : 'No'}</dd></>)}
              {cp.resume_url && (<><dt className="text-muted-foreground">Resume</dt><dd><a href={cp.resume_url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">View resume</a></dd></>)}
            </dl>
          </CardContent>
        </Card>
      )}
    </main>
  )
}

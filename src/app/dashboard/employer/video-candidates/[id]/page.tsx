import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import VideoPlayer from '@/app/dashboard/employer/candidates/[id]/VideoPlayer'
import Link from 'next/link'

export default async function EmployerVideoCandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Employers may only view video candidates assigned to one of their jobs
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  if (profile?.role !== 'admin') {
    const { data: myJobs } = await supabase
      .from('job_requirements')
      .select('id')
      .eq('employer_id', user.id)
    const jobIds = (myJobs ?? []).map((j: { id: string }) => j.id)
    const { data: assignment } = jobIds.length > 0
      ? await supabase
          .from('candidate_job_assignments')
          .select('id')
          .in('job_id', jobIds)
          .eq('candidate_id', id)
          .maybeSingle()
      : { data: null }
    if (!assignment) notFound()
  }

  const { data } = await supabase
    .from('video_candidates')
    .select('id, name, location, current_job_title, fields_worked_in, employment_type, mux_playback_id')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const c = data as {
    id: string; name: string; location: string | null; current_job_title: string | null
    fields_worked_in: string[]; employment_type: string[]; mux_playback_id: string | null
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <Link href="/dashboard/employer" className="text-sm text-gray-400 hover:text-gray-700">← Back</Link>

      <Card>
        <CardContent className="pt-5">
          <h1 className="text-2xl font-bold tracking-tight">{c.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{[c.current_job_title, c.location].filter(Boolean).join(' · ')}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {c.fields_worked_in?.map(f => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}
            {c.employment_type?.map(e => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}
          </div>
        </CardContent>
      </Card>

      {c.mux_playback_id ? (
        <Card>
          <CardHeader><CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Interview</CardTitle></CardHeader>
          <CardContent>
            <VideoPlayer muxPlaybackId={c.mux_playback_id} url={null} />
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-gray-400 text-center py-12">Video not yet available.</p>
      )}
    </main>
  )
}

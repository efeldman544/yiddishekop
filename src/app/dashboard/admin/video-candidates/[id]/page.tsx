import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import VideoPlayer from '@/app/dashboard/employer/candidates/[id]/VideoPlayer'
import Link from 'next/link'

export default async function AdminVideoCandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('video_candidates')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const c = data as {
    id: string; name: string; location: string | null; current_job_title: string | null
    fields_worked_in: string[]; employment_type: string[]; mux_playback_id: string | null
    transcript: string | null; notes: string | null; created_at: string
  }

  return (
    <div className="px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin/video-candidates" className="text-sm text-gray-400 hover:text-gray-700">← Video Interviews</Link>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-950 tracking-tight">{c.name}</h2>
        <p className="text-sm text-gray-400 mt-0.5">{[c.current_job_title, c.location].filter(Boolean).join(' · ')}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {c.fields_worked_in?.map(f => (
            <span key={f} className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">{f}</span>
          ))}
          {c.employment_type?.map(e => (
            <span key={e} className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{e}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {c.mux_playback_id && (
          <Card>
            <CardHeader><CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Video interview</CardTitle></CardHeader>
            <CardContent>
              <VideoPlayer muxPlaybackId={c.mux_playback_id} url={null} />
            </CardContent>
          </Card>
        )}

        {c.transcript && (
          <Card>
            <CardHeader><CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Transcript</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{c.transcript}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {c.notes && (
        <Card>
          <CardHeader><CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Admin notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

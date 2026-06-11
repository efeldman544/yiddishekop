'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import VideoUploadForm from './VideoUploadForm'
import BulkUploadForm from './BulkUploadForm'

type VideoCandidate = {
  id: string
  name: string
  location: string | null
  current_job_title: string | null
  fields_worked_in: string[]
  employment_type: string[]
  mux_playback_id: string | null
  created_at: string
}

export default function VideoCandidatesPage() {
  const [candidates, setCandidates] = useState<VideoCandidate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('video_candidates')
        .select('id, name, location, current_job_title, fields_worked_in, employment_type, mux_playback_id, created_at')
        .order('created_at', { ascending: false })
      setCandidates((data ?? []) as VideoCandidate[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-sm text-gray-400 py-12 text-center">Loading…</div>

  return (
    <div className="px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-950 tracking-tight">Video Interviews</h2>
          <p className="text-sm text-gray-400 mt-1">Candidates who interviewed but aren&apos;t in the main database.</p>
        </div>
        <div className="flex gap-2">
          <BulkUploadForm onDone={() => {
            const supabase = createClient()
            supabase.from('video_candidates')
              .select('id, name, location, current_job_title, fields_worked_in, employment_type, mux_playback_id, created_at')
              .order('created_at', { ascending: false })
              .then(({ data }) => setCandidates((data ?? []) as VideoCandidate[]))
          }} />
          <VideoUploadForm onAdded={c => setCandidates(prev => [c, ...prev])} />
        </div>
      </div>

      {candidates.length === 0 ? (
        <p className="text-sm text-gray-400 py-12 text-center">No video candidates yet. Add one above.</p>
      ) : (
        <div className="space-y-2">
          {candidates.map(c => (
            <div key={c.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm select-none">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[c.current_job_title, c.location].filter(Boolean).join(' · ')}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {c.fields_worked_in?.map(f => (
                      <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">{f}</span>
                    ))}
                    {c.mux_playback_id && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">Video ✓</span>
                    )}
                  </div>
                </div>
              </div>
              <Link
                href={`/dashboard/admin/video-candidates/${c.id}`}
                className="text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors shrink-0"
              >
                View →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

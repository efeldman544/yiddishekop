'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type CandidateSummary = {
  id: string
  full_name: string | null
  location: string | null
  current_job_title: string | null
  fields_worked_in: string[]
  employment_type: string[]
  resume_url: string | null
  action?: string | null
}

type VideoCandidate = {
  id: string
  name: string
  location: string | null
  current_job_title: string | null
  fields_worked_in: string[]
  mux_playback_id: string | null
}

export default function EmployerDashboard() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<CandidateSummary[]>([])
  const [videoCandidates, setVideoCandidates] = useState<VideoCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [employerName, setEmployerName] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: profile }, { data: myJobs }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single<{ full_name: string | null }>(),
        supabase.from('job_requirements').select('id').eq('employer_id', user.id),
      ])

      setEmployerName(profile?.full_name ?? null)
      const jobIds = (myJobs ?? []).map((j: { id: string }) => j.id)

      // Candidates reach an employer two ways: via a job (candidate_job_assignments
      // → their job) or assigned directly by an admin on the candidate page
      // (employer_candidate_assignments). Show both.
      const [{ data: assignments }, { data: directAssignments }] = await Promise.all([
        jobIds.length > 0
          ? supabase.from('candidate_job_assignments').select('id, candidate_id, action').in('job_id', jobIds)
          : Promise.resolve({ data: [] as { id: string; candidate_id: string; action: string | null }[] }),
        supabase.from('employer_candidate_assignments').select('id, candidate_id, action').eq('employer_id', user.id),
      ])

      const actionMap: Record<string, { action: string | null; assignmentId: string }> = {}
      for (const a of assignments ?? []) {
        if (!(a.candidate_id in actionMap)) actionMap[a.candidate_id] = { action: a.action, assignmentId: a.id }
      }
      for (const a of directAssignments ?? []) {
        if (!(a.candidate_id in actionMap)) actionMap[a.candidate_id] = { action: a.action ?? null, assignmentId: a.id }
      }

      const candidateIds = Object.keys(actionMap)
      if (candidateIds.length === 0) { setLoading(false); return }

      const { data: profiles } = await supabase
        .from('candidate_profiles')
        .select('id, full_name, location, current_job_title, fields_worked_in, employment_type, resume_url')
        .in('id', candidateIds)

      setCandidates((profiles ?? []).map((p: CandidateSummary) => ({
        ...p, action: actionMap[p.id]?.action ?? null,
      })))

      const { data: videoData } = await supabase
        .from('video_candidates')
        .select('id, name, location, current_job_title, fields_worked_in, mux_playback_id')
        .in('id', candidateIds)
        .order('created_at', { ascending: false })
      setVideoCandidates((videoData ?? []) as VideoCandidate[])

      setLoading(false)
    }
    load()
  }, [router])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('employer-assignment-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'candidate_job_assignments' }, (payload) => {
        const row = payload.new as { id: string; candidate_id: string; action: string | null }
        setCandidates(prev => prev.map(c => c.id === row.candidate_id ? { ...c, action: row.action } : c))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'employer_candidate_assignments' }, (payload) => {
        const row = payload.new as { id: string; candidate_id: string; action: string | null }
        setCandidates(prev => prev.map(c => c.id === row.candidate_id ? { ...c, action: row.action } : c))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading) {
    return <div className="state-center"><p className="state-text">Loading...</p></div>
  }

  return (
    <main className="px-6 py-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-950 tracking-tight">
            {employerName ? `Welcome, ${employerName}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {(() => {
              const pending = candidates.filter(c => !c.action).length
              if (candidates.length === 0) return 'No candidates matched to your roles yet.'
              if (pending === 0) return 'All candidates reviewed.'
              return `${pending} candidate${pending !== 1 ? 's' : ''} awaiting review.`
            })()}
          </p>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-900 font-semibold">No candidates yet</p>
          <p className="text-sm text-gray-400 mt-1">Candidates matched to your roles will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Candidates</p>
          {candidates.map(c => (
            <div key={c.id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5">
                <div className="flex items-start gap-5">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base select-none">
                    {c.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <p className="text-lg font-bold text-gray-950 tracking-tight">{c.full_name ?? 'Unnamed'}</p>
                      {c.action === 'request_meeting' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">Meeting requested</span>
                      )}
                      {c.action === 'pass' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-medium">Passed</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      {[c.current_job_title, c.location].filter(Boolean).join(' · ')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.fields_worked_in?.map(f => (
                        <span key={f} className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">{f}</span>
                      ))}
                      {c.employment_type?.map(e => (
                        <span key={e} className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{e}</span>
                      ))}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/employer/candidates/${c.id}`}
                    className="shrink-0 text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    View profile →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {videoCandidates.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Video interviews</p>
          {videoCandidates.map(c => (
            <div key={c.id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5">
                <div className="flex items-start gap-5">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-base select-none">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <p className="text-lg font-bold text-gray-950 tracking-tight">{c.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-medium">Video interview</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      {[c.current_job_title, c.location].filter(Boolean).join(' · ')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.fields_worked_in?.map(f => (
                        <span key={f} className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">{f}</span>
                      ))}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/employer/video-candidates/${c.id}`}
                    className="shrink-0 text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    Watch →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AssignedCandidateCard, { type AssignedCandidate } from './AssignedCandidateCard'

type ProfileRow = {
  id: string
  full_name: string | null
  location: string | null
  current_job_title: string | null
  roles_seeking: string | null
  fields_worked_in: string[] | null
  employment_type: string[] | null
  years_experience: string | null
  languages: string | null
  us_hours_comfortable: boolean | null
  resume_url: string | null
}

type IntroRequest = {
  id: string
  candidate_ref: string | null
  status: string
  created_at: string
}

type VideoRow = {
  id: string
  name: string
  location: string | null
  current_job_title: string | null
  fields_worked_in: string[] | null
  employment_type: string[] | null
  mux_playback_id: string | null
}

export default function EmployerDashboard() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<AssignedCandidate[]>([])
  const [introRequests, setIntroRequests] = useState<IntroRequest[]>([])
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

      // Introductions this employer asked for on /browse. Tolerated if the
      // migration hasn't been run yet — the rest of the dashboard still loads.
      const { data: intros, error: introError } = await supabase
        .from('introduction_requests')
        .select('id, candidate_ref, status, created_at')
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false })
      if (introError) console.error('intro requests load failed:', introError.message)
      setIntroRequests((intros ?? []) as IntroRequest[])

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


      // The interview clip is the thing an employer most wants to see, so it's
      // fetched with the list rather than hidden behind the profile page.
      const [{ data: profiles }, { data: videoData }, { data: clips }] = await Promise.all([
        supabase
          .from('candidate_profiles')
          .select('id, full_name, location, current_job_title, roles_seeking, fields_worked_in, employment_type, years_experience, languages, us_hours_comfortable, resume_url')
          .in('id', candidateIds),
        supabase
          .from('video_candidates')
          .select('id, name, location, current_job_title, fields_worked_in, employment_type, mux_playback_id')
          .in('id', candidateIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('videos')
          .select('candidate_id, mux_playback_id, url, created_at')
          .in('candidate_id', candidateIds)
          .order('created_at', { ascending: false }),
      ])

      // Newest clip per candidate; the query is already newest-first.
      const clipFor: Record<string, { mux_playback_id: string | null; url: string | null }> = {}
      for (const v of (clips ?? []) as { candidate_id: string; mux_playback_id: string | null; url: string | null }[]) {
        if (!(v.candidate_id in clipFor)) clipFor[v.candidate_id] = v
      }

      const fromProfiles: AssignedCandidate[] = ((profiles ?? []) as ProfileRow[]).map(p => ({
        id: p.id,
        kind: 'profile' as const,
        name: p.full_name,
        title: p.current_job_title,
        rolesSeeking: p.roles_seeking,
        location: p.location,
        industries: p.fields_worked_in ?? [],
        employmentType: p.employment_type ?? [],
        yearsExperience: p.years_experience,
        languages: p.languages,
        usHours: p.us_hours_comfortable,
        resumeUrl: p.resume_url,
        muxPlaybackId: clipFor[p.id]?.mux_playback_id ?? null,
        videoUrl: clipFor[p.id]?.url ?? null,
        action: actionMap[p.id]?.action ?? null,
      }))

      const fromVideos: AssignedCandidate[] = ((videoData ?? []) as VideoRow[]).map(v => ({
        id: v.id,
        kind: 'video' as const,
        name: v.name,
        title: v.current_job_title,
        rolesSeeking: null,
        location: v.location,
        industries: v.fields_worked_in ?? [],
        employmentType: v.employment_type ?? [],
        yearsExperience: null,
        languages: null,
        usHours: null,
        resumeUrl: null,
        muxPlaybackId: v.mux_playback_id,
        videoUrl: null,
        action: actionMap[v.id]?.action ?? null,
      }))

      setCandidates([...fromProfiles, ...fromVideos])
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
              if (candidates.length === 0) {
                return introRequests.length > 0
                  ? `${introRequests.length} introduction${introRequests.length !== 1 ? 's' : ''} requested.`
                  : 'No candidates matched to your roles yet.'
              }
              if (pending === 0) return 'All candidates reviewed.'
              return `${pending} candidate${pending !== 1 ? 's' : ''} awaiting review.`
            })()}
          </p>
        </div>
      </div>


      {introRequests.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Introductions you requested</p>
          {introRequests.map(r => {
            const label = r.status === 'actioned' ? 'Introduced'
              : r.status === 'dismissed' ? 'Closed'
              : 'With our team'
            const tone = r.status === 'actioned'
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : r.status === 'dismissed'
                ? 'bg-gray-100 text-gray-500 border-gray-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            return (
              <div key={r.id} className="bg-white border border-gray-100 rounded-xl shadow-sm px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-950">
                    Candidate #{r.candidate_ref ?? '—'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Requested {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${tone}`}>
                  {label}
                </span>
              </div>
            )
          })}
          <p className="text-xs text-gray-400">
            We reach out to the candidate and come back to you with the introduction.
          </p>
        </div>
      )}

      {candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-900 font-semibold">No candidates yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Candidates we share with you will appear here.
          </p>
          <Link
            href="/browse"
            className="mt-5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-2 transition-colors"
          >
            Browse candidates
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Candidates</p>
          {candidates.map(c => (
            <AssignedCandidateCard key={`${c.kind}-${c.id}`} c={c} />
          ))}
        </div>
      )}

    </main>
  )
}

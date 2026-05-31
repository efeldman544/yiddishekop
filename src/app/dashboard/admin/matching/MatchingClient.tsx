'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export type MatchJob = {
  id: string
  job_title: string
  employment_type: string | null
  languages: string | null
  description: string | null
  status: string
  company_name: string | null
  employer_id: string | null
}

export type MatchCandidate = {
  id: string
  full_name: string | null
  current_job_title: string | null
  location: string | null
  fields_worked_in: string[]
  employment_type: string[]
  languages: string | null
  roles_seeking: string | null
  us_hours_comfortable: boolean | null
  status: string
  admin_tags: string[]
  interviewed: boolean | null
  source: 'profile' | 'video'
}

type AiResult = {
  score: number
  summary: string
  strengths: string[]
  concerns: string[]
}

type Badge = { label: string; style: string }
type ScoredCandidate = MatchCandidate & { ruleScore: number; badges: Badge[] }

const JOB_STATUS_BADGE: Record<string, string> = {
  'Open':    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'On Hold': 'bg-amber-50 text-amber-700 border border-amber-200',
}

function ruleScore(candidate: MatchCandidate, job: MatchJob): { ruleScore: number; badges: Badge[] } {
  let score = 0
  const badges: Badge[] = []

  if (job.employment_type && candidate.employment_type?.includes(job.employment_type)) {
    score += 30
    badges.push({ label: job.employment_type, style: 'bg-emerald-50 text-emerald-700 border border-emerald-200' })
  }
  if (job.languages && candidate.languages) {
    const jobLangs = job.languages.toLowerCase().split(/[\s,;/]+/).filter(l => l.length > 1)
    const candLangs = candidate.languages.toLowerCase()
    const matched = jobLangs.filter(l => candLangs.includes(l))
    if (matched.length > 0) {
      score += Math.min(matched.length * 15, 30)
      badges.push({ label: 'Languages', style: 'bg-blue-50 text-blue-700 border border-blue-200' })
    }
  }
  const jobTitleWords = job.job_title.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const rolesSeeking = (candidate.roles_seeking ?? '').toLowerCase()
  const fieldsText = (candidate.fields_worked_in ?? []).join(' ').toLowerCase()
  if (jobTitleWords.some(w => rolesSeeking.includes(w))) {
    score += 25
    badges.push({ label: 'Role match', style: 'bg-violet-50 text-violet-700 border border-violet-200' })
  } else if (jobTitleWords.some(w => fieldsText.includes(w))) {
    score += 15
    badges.push({ label: 'Field match', style: 'bg-violet-50 text-violet-700 border border-violet-200' })
  }
  if (candidate.us_hours_comfortable && job.description?.toLowerCase().includes('us')) {
    score += 10
    badges.push({ label: 'US hours', style: 'bg-amber-50 text-amber-700 border border-amber-200' })
  }
  if (candidate.interviewed) {
    score += 10
    badges.push({ label: 'Interviewed', style: 'bg-emerald-50 text-emerald-700 border border-emerald-200' })
  }
  return { ruleScore: score, badges }
}

function ScoreBar({ pct, ai }: { pct: number; ai: boolean }) {
  const color = pct >= 70 ? 'bg-emerald-400' : pct >= 40 ? 'bg-amber-400' : 'bg-gray-300'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[160px]">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-gray-400 tabular-nums">
        {pct}% {ai ? 'AI match' : 'match'}
      </span>
    </div>
  )
}

export default function MatchingClient({
  jobs,
  candidates,
  initialAssignments,
}: {
  jobs: MatchJob[]
  candidates: MatchCandidate[]
  initialAssignments: { candidate_id: string; job_id: string }[]
}) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(jobs[0]?.id ?? null)
  const [assignments, setAssignments] = useState(initialAssignments)
  const [toggling, setToggling] = useState<string | null>(null)
  const [aiScores, setAiScores] = useState<Record<string, AiResult>>({})
  const [aiRunning, setAiRunning] = useState(false)
  const [aiProgress, setAiProgress] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)

  const selectedJob = jobs.find(j => j.id === selectedJobId) ?? null

  const scoredCandidates = useMemo<ScoredCandidate[]>(() => {
    if (!selectedJob) return []
    return candidates.map(c => ({ ...c, ...ruleScore(c, selectedJob) }))
  }, [selectedJob, candidates])

  // Sort: AI score first if available, else rule score
  const sortedCandidates = useMemo(() => {
    return [...scoredCandidates].sort((a, b) => {
      const aScore = aiScores[a.id]?.score ?? a.ruleScore
      const bScore = aiScores[b.id]?.score ?? b.ruleScore
      return bScore - aScore
    })
  }, [scoredCandidates, aiScores])

  const hasAiForJob = scoredCandidates.some(c => aiScores[c.id])

  async function runAiMatching() {
    if (!selectedJobId || aiRunning) return
    setAiRunning(true)
    setAiProgress(0)
    const candidateIds = scoredCandidates.filter(c => c.source === 'profile').map(c => c.id)
    const videoCandidateIds = scoredCandidates.filter(c => c.source === 'video').map(c => c.id)
    try {
      const res = await fetch('/api/admin/ai-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: selectedJobId, candidateIds, videoCandidateIds }),
      })
      if (res.ok) {
        const { results } = await res.json()
        const map: Record<string, AiResult> = {}
        for (const r of results) map[r.candidateId] = r
        setAiScores(prev => ({ ...prev, ...map }))
      }
    } finally {
      setAiRunning(false)
      setAiProgress(100)
    }
  }

  function isAssigned(candidateId: string) {
    return assignments.some(a => a.candidate_id === candidateId && a.job_id === selectedJobId)
  }

  async function toggleAssign(candidateId: string) {
    if (!selectedJobId) return
    const key = `${candidateId}-${selectedJobId}`
    setToggling(key)
    const supabase = createClient()
    if (isAssigned(candidateId)) {
      await supabase.from('candidate_job_assignments').delete()
        .eq('candidate_id', candidateId).eq('job_id', selectedJobId)
      setAssignments(prev => prev.filter(a => !(a.candidate_id === candidateId && a.job_id === selectedJobId)))
    } else {
      await supabase.from('candidate_job_assignments').insert({ candidate_id: candidateId, job_id: selectedJobId })
      setAssignments(prev => [...prev, { candidate_id: candidateId, job_id: selectedJobId }])
    }
    setToggling(null)
  }

  const assignedCount = (jobId: string) => assignments.filter(a => a.job_id === jobId).length

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* Left — job list */}
      <div className="w-72 shrink-0 border-r border-gray-150 overflow-y-auto bg-gray-50/60">
        <div className="px-4 pt-5 pb-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Open Jobs</p>
        </div>
        <div className="space-y-0.5 px-2 pb-4">
          {jobs.map(job => {
            const active = selectedJobId === job.id
            const count = assignedCount(job.id)
            return (
              <button key={job.id} type="button" onClick={() => setSelectedJobId(job.id)}
                className={`w-full text-left px-3 py-3 rounded-lg transition-all ${active ? 'bg-white shadow-sm border border-gray-200' : 'hover:bg-white/70'}`}
              >
                <p className={`text-[13px] font-semibold leading-snug ${active ? 'text-gray-950' : 'text-gray-700'}`}>{job.job_title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">{job.company_name ?? 'Unknown company'}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${JOB_STATUS_BADGE[job.status] ?? 'bg-gray-100 text-gray-500'}`}>{job.status}</span>
                  {count > 0 && <span className="text-[10px] text-gray-400">{count} assigned</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right — candidates */}
      <div className="flex-1 overflow-y-auto">
        {!selectedJob ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">Select a job to see matches</div>
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">

            {/* Job header */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-950 tracking-tight">{selectedJob.job_title}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{selectedJob.company_name ?? 'Unknown company'}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedJob.employment_type && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{selectedJob.employment_type}</span>
                    )}
                    {selectedJob.languages && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{selectedJob.languages}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${JOB_STATUS_BADGE[selectedJob.status] ?? ''}`}>{selectedJob.status}</span>
                  <Button size="sm" onClick={runAiMatching} disabled={aiRunning}>
                    {aiRunning ? 'Analyzing…' : hasAiForJob ? 'Re-run AI' : '✦ AI Analysis'}
                  </Button>
                </div>
              </div>
              {selectedJob.description && (
                <p className="text-xs text-gray-500 mt-3 leading-relaxed line-clamp-2">{selectedJob.description}</p>
              )}
            </div>

            {/* Progress bar */}
            {aiRunning && (
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-violet-400 rounded-full animate-pulse w-full" />
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                {sortedCandidates.length} active candidate{sortedCandidates.length !== 1 ? 's' : ''}
                {hasAiForJob ? ' — sorted by AI score' : ' — sorted by rule match'}
              </p>
              <p className="text-[11px] text-gray-400">{assignedCount(selectedJob.id)} assigned</p>
            </div>

            {sortedCandidates.length === 0 ? (
              <div className="text-sm text-gray-400 py-12 text-center">No active candidates yet.</div>
            ) : (
              <div className="space-y-2.5">
                {sortedCandidates.map(c => {
                  const assigned = isAssigned(c.id)
                  const key = `${c.id}-${selectedJobId}`
                  const ai = aiScores[c.id] ?? null
                  const displayScore = ai ? ai.score : Math.min(Math.round((c.ruleScore / 85) * 100), 100)
                  const isExpanded = expanded === c.id

                  return (
                    <div key={c.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${assigned ? 'border-emerald-200' : 'border-gray-200'}`}>
                      <div className="px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {c.source === 'video' ? (
                                <Link href={`/dashboard/admin/video-candidates/${c.id}`}
                                  className="text-[15px] font-bold text-gray-950 hover:text-gray-600 transition-colors">
                                  {c.full_name ?? 'Unnamed'}
                                </Link>
                              ) : (
                                <Link href={`/dashboard/admin/candidates/${c.id}`}
                                  className="text-[15px] font-bold text-gray-950 hover:text-gray-600 transition-colors">
                                  {c.full_name ?? 'Unnamed'}
                                </Link>
                              )}
                              {c.source === 'video' && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-purple-50 text-purple-700 border-purple-200">Video only</span>
                              )}
                              {assigned && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">Assigned</span>
                              )}
                              {ai && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-violet-50 text-violet-700 border-violet-200">AI scored</span>
                              )}
                              {c.admin_tags?.map(tag => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">{tag}</span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{[c.current_job_title, c.location].filter(Boolean).join(' · ')}</p>

                            {/* Rule badges */}
                            {c.badges.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {c.badges.map(b => (
                                  <span key={b.label} className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${b.style}`}>{b.label}</span>
                                ))}
                                {c.fields_worked_in?.map(f => (
                                  <span key={f} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{f}</span>
                                ))}
                              </div>
                            )}

                            <div className="mt-3">
                              <ScoreBar pct={displayScore} ai={!!ai} />
                            </div>

                            {/* AI summary */}
                            {ai && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-600 leading-relaxed">{ai.summary}</p>
                                {(ai.strengths.length > 0 || ai.concerns.length > 0) && (
                                  <button type="button" onClick={() => setExpanded(isExpanded ? null : c.id)}
                                    className="text-[11px] text-violet-600 hover:text-violet-800 mt-1 transition-colors">
                                    {isExpanded ? 'Hide details' : 'Show strengths & concerns'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          <Button size="sm" variant={assigned ? 'default' : 'outline'}
                            disabled={toggling === key} onClick={() => toggleAssign(c.id)} className="shrink-0">
                            {toggling === key ? '…' : assigned ? 'Assigned ✓' : 'Assign'}
                          </Button>
                        </div>
                      </div>

                      {/* Expanded AI details */}
                      {isExpanded && ai && (
                        <div className="border-t border-gray-100 bg-[#fafafa] px-5 py-3 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1.5">Strengths</p>
                            <ul className="space-y-1">
                              {ai.strengths.map((s, i) => (
                                <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-emerald-500 mt-px">✓</span>{s}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-1.5">Concerns</p>
                            <ul className="space-y-1">
                              {ai.concerns.map((s, i) => (
                                <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-amber-500 mt-px">!</span>{s}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

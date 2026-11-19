'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { notifyAssigned } from '@/lib/notifyAssigned'
import { humanError } from '@/lib/errorMessage'
import ErrorNote from '@/components/ErrorNote'
import CardsStatus from './CardsStatus'

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
  triageOnly?: boolean
}

type Badge = { label: string; style: string }

// The last ranking seen for each job, kept in this browser so opening a job
// shows it at once. The scores themselves are stored on the server and only
// re-made when the job or a candidate changes; what used to make every visit
// slow was the page hiding the list until the server had confirmed that
// nothing had. Now the saved ranking is shown straight away and that check
// happens quietly behind it, changing the list only if something did change.
const SCORE_CACHE_PREFIX = 'match-scores:v1:'
const SCORE_CACHE_MAX_JOBS = 20
type CachedRanking = { scores: Record<string, AiResult>; order: string[]; savedAt: number }

function readRanking(jobId: string): CachedRanking | null {
  try {
    const raw = localStorage.getItem(SCORE_CACHE_PREFIX + jobId)
    return raw ? (JSON.parse(raw) as CachedRanking) : null
  } catch {
    return null
  }
}

function writeRanking(jobId: string, scores: Record<string, AiResult>, order: string[]) {
  try {
    localStorage.setItem(SCORE_CACHE_PREFIX + jobId, JSON.stringify({ scores, order, savedAt: Date.now() }))
    // Keep only the most recently viewed jobs.
    const saved: { key: string; at: number }[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(SCORE_CACHE_PREFIX)) continue
      try { saved.push({ key, at: (JSON.parse(localStorage.getItem(key) ?? '{}') as CachedRanking).savedAt ?? 0 }) } catch { saved.push({ key, at: 0 }) }
    }
    saved.sort((a, b) => b.at - a.at).slice(SCORE_CACHE_MAX_JOBS).forEach(x => localStorage.removeItem(x.key))
  } catch {
    // Full or blocked: the page still works, it just checks before showing.
  }
}

const JOB_STATUS_BADGE: Record<string, string> = {
  'New':     'bg-amber-50 text-amber-700 border border-amber-200',
  'Open':    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'On Hold': 'bg-amber-50 text-amber-700 border border-amber-200',
}

/**
 * Plain facts about a candidate against a job, shown as chips.
 *
 * These used to be the output of a points system that also produced the
 * ranking shown before any AI ran. The ranking is gone — every candidate is
 * scored from their card now — and so are the chips that came from guessing:
 * "Role match" fired on any shared word over three letters, and "US hours" on
 * any description containing the letters "us", which is most of them. What is
 * left is what can simply be read off the two records.
 */
function factBadges(candidate: MatchCandidate, job: MatchJob): Badge[] {
  const badges: Badge[] = []
  if (job.employment_type && candidate.employment_type?.includes(job.employment_type)) {
    badges.push({ label: job.employment_type, style: 'bg-emerald-50 text-emerald-700 border border-emerald-200' })
  }
  if (job.languages && candidate.languages) {
    const jobLangs = job.languages.toLowerCase().split(/[\s,;/]+/).filter(l => l.length > 1)
    const candLangs = candidate.languages.toLowerCase()
    if (jobLangs.some(l => candLangs.includes(l))) {
      badges.push({ label: 'Languages', style: 'bg-indigo-50 text-indigo-700 border border-indigo-200' })
    }
  }
  if (candidate.interviewed) {
    badges.push({ label: 'Interviewed', style: 'bg-emerald-50 text-emerald-700 border border-emerald-200' })
  }
  return badges
}

function ScoreBar({ pct }: { pct: number }) {
  const color = pct >= 70 ? 'bg-emerald-400' : pct >= 40 ? 'bg-amber-400' : 'bg-gray-300'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[160px]">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-gray-400 tabular-nums">{pct}% match</span>
    </div>
  )
}

// One request scores this many candidates in a single model call.
const CHUNK = 25
// How many of those requests are in flight at once.
const PARALLEL = 4
const TOP_N = 10

async function postJson(url: string, body: object): Promise<Response> {
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

/** Run `work` over `items`, `width` at a time. */
async function pooled<T>(items: T[], width: number, work: (item: T) => Promise<void>) {
  let next = 0
  await Promise.all(Array.from({ length: Math.min(width, items.length) }, async () => {
    while (next < items.length) await work(items[next++])
  }))
}

export default function MatchingClient({
  jobs,
  candidates,
  initialAssignments,
  directAssignments = [],
}: {
  jobs: MatchJob[]
  candidates: MatchCandidate[]
  initialAssignments: { candidate_id: string; job_id: string }[]
  // Direct candidate→employer assignments (made on the admin candidate page),
  // shown here so both assignment systems are visible in one place
  directAssignments?: { employer_id: string; candidate_id: string }[]
}) {
  // Selected job is mirrored in the URL (?job=<id>) so navigating into a
  // candidate and pressing Back returns you to the same job, not jobs[0].
  const searchParams = useSearchParams()
  const [selectedJobId, setSelectedJobId] = useState<string | null>(() => {
    const fromUrl = searchParams.get('job')
    if (fromUrl && jobs.some(j => j.id === fromUrl)) return fromUrl
    return jobs[0]?.id ?? null
  })
  const [assignments, setAssignments] = useState(initialAssignments)
  const [toggling, setToggling] = useState<string | null>(null)
  // AI scores keyed by job then candidate — scores from one job must not bleed into another
  const [aiScoresByJob, setAiScoresByJob] = useState<Record<string, Record<string, AiResult>>>({})
  // Which job is being scored, and how far along it is.
  const [scoring, setScoring] = useState<{ jobId: string; done: number; total: number } | null>(null)
  // A job whose saved ranking is on screen while the server confirms it.
  const [checking, setChecking] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set())
  const [batch, setBatch] = useState<{ done: number; total: number } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const loadedJobs = useRef<Set<string>>(new Set())
  // Frozen sort order — set after a scoring run so individual Analyze clicks don't reshuffle the list
  const [frozenOrder, setFrozenOrder] = useState<Record<string, string[]>>({})

  const selectedJob = jobs.find(j => j.id === selectedJobId) ?? null
  const aiScores = useMemo(
    () => (selectedJobId ? aiScoresByJob[selectedJobId] : null) ?? {},
    [selectedJobId, aiScoresByJob],
  )
  const aiRunning = scoring !== null
  const [showAssignedOnly, setShowAssignedOnly] = useState(false)

  // Candidates directly assigned to the selected job's employer (via the admin
  // candidate page) — surfaced here so both assignment paths are visible
  const employerId = selectedJob?.employer_id ?? null
  const directForEmployer = new Set(
    employerId ? directAssignments.filter(d => d.employer_id === employerId).map(d => d.candidate_id) : [],
  )

  function mergeJobScores(jobId: string, scores: Record<string, AiResult>) {
    setAiScoresByJob(prev => ({ ...prev, [jobId]: { ...prev[jobId], ...scores } }))
  }

  function freezeOrder(jobId: string, scores: Record<string, AiResult>) {
    const order = Object.entries(scores).sort((a, b) => b[1].score - a[1].score).map(([id]) => id)
    setFrozenOrder(prev => ({ ...prev, [jobId]: order }))
  }

  /**
   * Bring a job's scores up to date.
   *
   * Asks the server which stored scores are still current — made from this
   * version of the job and this version of each candidate's card — and scores
   * only the candidates left over. Opening a job nothing has changed on costs
   * nothing; editing its description re-scores it; a candidate whose card was
   * rebuilt is re-scored alone.
   *
   * `rescore` throws away the quick scores and makes them again. A full
   * write-up that is still current is kept: it was made from more evidence
   * than the quick pass sees, and replacing it with a bare number would be a
   * step backwards.
   */
  async function loadAndScore(jobId: string, opts: { rescore?: boolean } = {}) {
    if (scoring || checking) return
    setAiError(null)

    // Show the last ranking for this job at once, if there is one, and check
    // it in the background. Only a re-score, or a job never seen in this
    // browser, waits on the server before showing anything.
    const saved = opts.rescore ? null : readRanking(jobId)
    const background = !!saved && Object.keys(saved.scores).length > 0
    if (background) {
      setAiScoresByJob(prev => ({ ...prev, [jobId]: saved!.scores }))
      setFrozenOrder(prev => ({ ...prev, [jobId]: saved!.order }))
      setChecking(jobId)
    } else {
      setScoring({ jobId, done: 0, total: 0 })
    }

    let scores: Record<string, AiResult> = {}
    try {
      const res = await postJson('/api/admin/ai-match', { jobId, stage: 'load' })
      if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`))
      const loaded: Record<string, AiResult> = (await res.json()).scores ?? {}
      for (const [id, s] of Object.entries(loaded)) {
        if (opts.rescore && s.triageOnly) continue
        scores[id] = s
      }
      // Replace rather than merge: a score the server no longer vouches for
      // must leave the screen, not linger beside the fresh ones.
      setAiScoresByJob(prev => ({ ...prev, [jobId]: scores }))

      const todo = candidates.filter(c => !scores[c.id]).map(c => ({ id: c.id, source: c.source }))
      setChecking(null)
      if (todo.length > 0) {
        setScoring({ jobId, done: 0, total: todo.length })
        const chunks: typeof todo[] = []
        for (let i = 0; i < todo.length; i += CHUNK) chunks.push(todo.slice(i, i + CHUNK))

        let failed = 0
        let lastFailure: unknown = null
        await pooled(chunks, PARALLEL, async chunk => {
          try {
            const r = await postJson('/api/admin/ai-match', { jobId, stage: 'score', candidates: chunk })
            if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`))
            const json = await r.json()
            const map: Record<string, AiResult> = {}
            for (const x of json.results ?? []) {
              map[x.candidateId] = { score: x.score, summary: '', strengths: [], concerns: [], triageOnly: true }
            }
            scores = { ...scores, ...map }
            mergeJobScores(jobId, map)
            failed += (json.unscored ?? []).length
          } catch (e) {
            // One failed batch costs those candidates, not the run. They stay
            // unscored and are picked up by the next attempt.
            failed += chunk.length
            lastFailure = e
          }
          setScoring(prev => prev && prev.jobId === jobId ? { ...prev, done: Math.min(prev.done + chunk.length, prev.total) } : prev)
        })

        if (failed > 0) {
          const why = lastFailure ? ` ${humanError(lastFailure, '')}`.trimEnd() : ''
          setAiError(`${failed} candidate${failed === 1 ? '' : 's'} couldn’t be scored.${why} Use “Score remaining” to try them again.`)
        }
      }
    } catch (e) {
      // Not retried automatically: this effect runs again when scoring ends,
      // so forgetting the job here would loop on a failure that persists. The
      // button in the header is the retry.
      setAiError(humanError(e, 'Couldn’t load the scores for this job.'))
    } finally {
      setChecking(null)
      // A failed check leaves the saved ranking on screen rather than wiping it.
      if (!(background && Object.keys(scores).length === 0)) freezeOrder(jobId, scores)
      setScoring(null)
    }
  }

  // Whatever ranking is on screen is what the next visit shows first —
  // including full write-ups added one at a time with Analyze.
  useEffect(() => {
    if (!selectedJobId || scoring || checking) return
    const scores = aiScoresByJob[selectedJobId]
    if (!scores || Object.keys(scores).length === 0) return
    writeRanking(selectedJobId, scores, frozenOrder[selectedJobId] ?? [])
  }, [selectedJobId, aiScoresByJob, frozenOrder, scoring, checking])

  // On job select: bring its scores up to date, once per visit.
  useEffect(() => {
    if (!selectedJobId || loadedJobs.current.has(selectedJobId) || scoring || checking) return
    loadedJobs.current.add(selectedJobId)
    loadAndScore(selectedJobId)
  }, [selectedJobId, scoring, checking]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cards were rebuilt, so scores made from the old ones are out of date for
  // every job, not only the one on screen.
  function onCardsChanged() {
    loadedJobs.current.clear()
    if (selectedJobId) {
      loadedJobs.current.add(selectedJobId)
      loadAndScore(selectedJobId)
    }
  }

  // Keep ?job=<id> in the URL in sync with the selected job (via replaceState so
  // it doesn't add history entries or re-run the server fetch). Pressing Back
  // from a candidate page then restores this exact job.
  useEffect(() => {
    if (!selectedJobId) return
    const sp = new URLSearchParams(window.location.search)
    if (sp.get('job') === selectedJobId) return
    sp.set('job', selectedJobId)
    window.history.replaceState(null, '', `${window.location.pathname}?${sp.toString()}`)
  }, [selectedJobId])

  // Scored candidates in the frozen order, then the ones without a score yet.
  // Nothing is ranked on a guess: a candidate either has a score or is shown
  // as waiting for one.
  const sortedCandidates = useMemo(() => {
    const order = selectedJobId ? frozenOrder[selectedJobId] : undefined
    const rank = new Map((order ?? []).map((id, i) => [id, i]))
    const scored = candidates.filter(c => aiScores[c.id])
    const unscored = candidates.filter(c => !aiScores[c.id])
    scored.sort((a, b) => {
      const ra = rank.get(a.id), rb = rank.get(b.id)
      if (ra !== undefined && rb !== undefined) return ra - rb
      if (ra !== undefined) return -1
      if (rb !== undefined) return 1
      return aiScores[b.id].score - aiScores[a.id].score
    })
    return [...scored, ...unscored]
  }, [candidates, aiScores, frozenOrder, selectedJobId])

  const scoredCount = candidates.filter(c => aiScores[c.id]).length
  const unscoredCount = candidates.length - scoredCount
  const hasAiForJob = scoredCount > 0

  /**
   * The full write-up for one candidate: whole resume, whole transcript.
   *
   * Their card is brought up to date first. That is what gets a photographed
   * resume read at all, and it is skipped — two small queries, no model call —
   * when the card is already current. If it can't be built the analysis still
   * runs on what there is.
   */
  async function analyzeSingle(candidateId: string, source: 'profile' | 'video', opts: { quiet?: boolean } = {}) {
    if (!selectedJobId) return
    const jobId = selectedJobId
    setAnalyzing(prev => new Set(prev).add(candidateId))
    try {
      await postJson('/api/admin/candidate-cards', { stage: 'build', items: [{ id: candidateId, source }] }).catch(() => null)
      const res = await postJson('/api/admin/ai-match', { jobId, candidateId, source, stage: 'deep_single' })
      if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`))
      const json = await res.json()
      mergeJobScores(jobId, {
        [candidateId]: {
          score: json.score,
          summary: json.summary ?? '',
          strengths: Array.isArray(json.strengths) ? json.strengths : [],
          concerns: Array.isArray(json.concerns) ? json.concerns : [],
        },
      })
      if (!opts.quiet) setExpanded(candidateId)
      return true
    } catch (e) {
      if (!opts.quiet) setAiError(humanError(e, 'Couldn’t analyse this candidate. Try again.'))
      return false
    } finally {
      setAnalyzing(prev => { const next = new Set(prev); next.delete(candidateId); return next })
    }
  }

  // The top of the list that hasn't had a full write-up yet.
  const topToAnalyze = sortedCandidates.slice(0, TOP_N).filter(c => aiScores[c.id]?.triageOnly)

  async function analyzeTop() {
    if (batch || topToAnalyze.length === 0) return
    const targets = topToAnalyze
    setAiError(null)
    setBatch({ done: 0, total: targets.length })
    let failed = 0
    await pooled(targets, 2, async c => {
      const ok = await analyzeSingle(c.id, c.source, { quiet: true })
      if (!ok) failed++
      setBatch(prev => prev ? { ...prev, done: prev.done + 1 } : prev)
    })
    setBatch(null)
    if (failed > 0) setAiError(`${failed} of ${targets.length} couldn’t be analysed. Try those again one at a time.`)
  }

  function isAssigned(candidateId: string) {
    return assignments.some(a => a.candidate_id === candidateId && a.job_id === selectedJobId)
  }

  async function toggleAssign(candidateId: string) {
    if (!selectedJobId) return
    const key = `${candidateId}-${selectedJobId}`
    setToggling(key)
    const supabase = createClient()
    // Only update UI state after the DB write succeeds — an optimistic flip
    // that swallows the error shows "Assigned ✓" that silently vanishes on reload
    if (isAssigned(candidateId)) {
      const { error } = await supabase.from('candidate_job_assignments').delete()
        .eq('candidate_id', candidateId).eq('job_id', selectedJobId)
      if (error) {
        setAiError(humanError(error, 'Couldn\u2019t remove the assignment.'))
      } else {
        setAssignments(prev => prev.filter(a => !(a.candidate_id === candidateId && a.job_id === selectedJobId)))
      }
    } else {
      const { error } = await supabase.from('candidate_job_assignments').insert({ candidate_id: candidateId, job_id: selectedJobId })
      if (error) {
        setAiError(humanError(error, 'Couldn\u2019t assign this candidate.'))
      } else {
        setAssignments(prev => [...prev, { candidate_id: candidateId, job_id: selectedJobId }])
        // Assigning here used to tell the employer nothing — the candidate
        // simply appeared in their portal with no prompt to look.
        notifyAssigned(
          { candidate_id: candidateId, job_id: selectedJobId },
          msg => setAiError(`Assigned. ${humanError(msg, 'The employer wasn\u2019t notified.')}`),
        )
      }
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

            <CardsStatus onChanged={onCardsChanged} />

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
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">{selectedJob.languages}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${JOB_STATUS_BADGE[selectedJob.status] ?? ''}`}>{selectedJob.status}</span>
                  {topToAnalyze.length > 0 && !aiRunning && (
                    <Button size="sm" variant="outline" onClick={analyzeTop} disabled={batch !== null}
                      className="text-violet-600 border-violet-200 hover:bg-violet-50">
                      {batch ? `Analyzing ${batch.done} of ${batch.total}…` : `Analyze top ${TOP_N}`}
                    </Button>
                  )}
                  <Button size="sm" disabled={aiRunning || checking !== null || batch !== null}
                    onClick={() => selectedJobId && loadAndScore(selectedJobId, { rescore: unscoredCount === 0 })}>
                    {aiRunning ? 'Scoring…' : unscoredCount > 0 ? `Score remaining (${unscoredCount})` : 'Re-score'}
                  </Button>
                </div>
              </div>
              {selectedJob.description && (
                <p className="text-xs text-gray-500 mt-3 leading-relaxed line-clamp-2">{selectedJob.description}</p>
              )}
            </div>

            {/* Progress bar / error */}
            {scoring && scoring.total > 0 && (
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-violet-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((scoring.done / scoring.total) * 100)}%` }} />
              </div>
            )}
            {aiError && !aiRunning && (
              <ErrorNote>{aiError}</ErrorNote>
            )}

            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                {sortedCandidates.length} active candidate{sortedCandidates.length !== 1 ? 's' : ''}
                {scoring && scoring.total > 0
                  ? ` · scoring ${scoring.done} of ${scoring.total}`
                  : checking === selectedJobId ? ' · checking for changes…'
                  : unscoredCount > 0 && hasAiForJob ? ` · ${unscoredCount} not scored yet` : hasAiForJob ? ' · AI scored' : ''}
              </p>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setShowAssignedOnly(false)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${!showAssignedOnly ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                  All
                </button>
                <button type="button" onClick={() => setShowAssignedOnly(true)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${showAssignedOnly ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                  Assigned ({sortedCandidates.filter(c => isAssigned(c.id) || directForEmployer.has(c.id)).length})
                </button>
              </div>
            </div>

            {(() => {
              // Until scores exist for this job there is no order worth
              // showing — hold on the scoring state and go straight to the
              // ranked list instead of flashing an unranked one.
              if (aiRunning && !hasAiForJob) {
                return (
                  <div className="py-16 text-center space-y-2">
                    <p className="text-sm text-gray-500">
                      {scoring && scoring.total > 0
                        ? `Ranking candidates… ${scoring.done} of ${scoring.total}`
                        : 'Checking which scores are up to date…'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {scoring && scoring.total > 0
                        ? 'Only new or changed candidates are scored; the rest come from the last run.'
                        : 'A few seconds. After this, the ranking shows instantly on later visits.'}
                    </p>
                  </div>
                )
              }
              const visibleCandidates = showAssignedOnly
                ? sortedCandidates.filter(c => isAssigned(c.id) || directForEmployer.has(c.id))
                : sortedCandidates
              return visibleCandidates.length === 0 ? (
              <div className="text-sm text-gray-400 py-12 text-center">
                {showAssignedOnly ? 'No candidates assigned to this job yet.' : 'No active candidates yet.'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {visibleCandidates.map(c => {
                  const assigned = isAssigned(c.id)
                  const key = `${c.id}-${selectedJobId}`
                  const ai = aiScores[c.id] ?? null
                  const badges = selectedJob ? factBadges(c, selectedJob) : []
                  const isExpanded = expanded === c.id

                  return (
                    <div key={c.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${assigned ? 'border-emerald-200' : 'border-gray-200'}`}>
                      <div className="px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {c.source === 'video' ? (
                                <Link href={`/dashboard/admin/video-candidates/${c.id}?from=matching`}
                                  className="text-[15px] font-bold text-gray-950 hover:text-gray-600 transition-colors">
                                  {c.full_name ?? 'Unnamed'}
                                </Link>
                              ) : (
                                <Link href={`/dashboard/admin/candidates/${c.id}?from=matching`}
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
                              {directForEmployer.has(c.id) && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-cyan-50 text-cyan-700 border-cyan-200">Assigned to employer</span>
                              )}
                              {ai && !ai.triageOnly && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-violet-50 text-violet-700 border-violet-200">Analyzed</span>
                              )}
                              {c.admin_tags?.map(tag => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">{tag}</span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{[c.current_job_title, c.location].filter(Boolean).join(' · ')}</p>

                            {(badges.length > 0 || (c.fields_worked_in?.length ?? 0) > 0) && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {badges.map(b => (
                                  <span key={b.label} className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${b.style}`}>{b.label}</span>
                                ))}
                                {c.fields_worked_in?.map(f => (
                                  <span key={f} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{f}</span>
                                ))}
                              </div>
                            )}

                            <div className="mt-3">
                              {ai
                                ? <ScoreBar pct={ai.score} />
                                : <span className="text-[11px] text-gray-400">{aiRunning ? 'Scoring…' : 'Not scored yet'}</span>}
                            </div>

                            {/* AI summary */}
                            {ai && ai.summary && (
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

                          <div className="flex flex-col gap-1.5 shrink-0">
                            {ai?.triageOnly && (
                              <Button size="sm" variant="outline"
                                disabled={analyzing.has(c.id)}
                                onClick={() => analyzeSingle(c.id, c.source)}
                                className="text-violet-600 border-violet-200 hover:bg-violet-50">
                                {analyzing.has(c.id) ? 'Analyzing…' : 'Analyze'}
                              </Button>
                            )}
                            <Button size="sm" variant={assigned ? 'default' : 'outline'}
                              disabled={toggling === key} onClick={() => toggleAssign(c.id)}>
                              {toggling === key ? '…' : assigned ? 'Assigned ✓' : 'Assign'}
                            </Button>
                          </div>
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
            )})()}
          </div>
        )}
      </div>
    </div>
  )
}

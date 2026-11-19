'use client'

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import AddCandidatesPanel from './AddCandidatesPanel'
import { INDUSTRIES as SHARED_INDUSTRIES } from '@/lib/candidateOptions'
import { isProfileFilledIn } from '@/lib/profileFilledIn'
import { humanError } from '@/lib/errorMessage'
import ErrorNote from '@/components/ErrorNote'
import { useQueryParams } from '@/lib/useQueryParams'
import { LAST_OPENED_KEY, candidateHref, saveSequence } from '@/lib/candidateSequence'
import { CandidateListSkeleton, CandidateRowsSkeleton } from '@/components/PageSkeleton'

type Candidate = {
  id: string
  full_name: string | null
  email: string | null
  location: string | null
  current_job_title: string | null
  // Part of what makes a profile count as filled in, so the badge needs it.
  roles_seeking: string | null
  fields_worked_in: string[]
  employment_type: string[]
  years_experience: string | null
  status: string | null
  admin_tags: string[]
  interviewed: boolean | null
  interviewed_at: string | null
  /** 'video' for someone known only from a video interview (video_candidates). */
  source?: 'profile' | 'video'
}

type VideoRow = {
  id: string; name: string | null; location: string | null; current_job_title: string | null
  fields_worked_in: string[] | null; employment_type: string[] | null
}

/** A video-interview candidate, in the shape the list shows. They have no
    account, profile or status — the interview is all there is. */
function fromVideo(v: VideoRow): Candidate {
  return {
    id: v.id, full_name: v.name, email: null, location: v.location, current_job_title: v.current_job_title,
    roles_seeking: null, fields_worked_in: v.fields_worked_in ?? [], employment_type: v.employment_type ?? [],
    years_experience: null, status: null, admin_tags: [], interviewed: true, interviewed_at: null, source: 'video',
  }
}

type JobOption = {
  id: string
  job_title: string
  status: string
  employer_label: string
}

const INDUSTRIES: readonly string[] = SHARED_INDUSTRIES

// Candidates filled out `fields_worked_in` under earlier, differently-worded category
// lists before the current set was adopted. `legacyAliases` maps each current category
// to the older stored values it should also match — populated from the AI-derived
// mapping fetched in loadIndustryAliases() so it covers whatever is actually in the DB.
function industriesWithLegacyAliases(selected: string[], legacyAliases: Record<string, string[]>): string[] {
  const expanded = new Set<string>()
  for (const ind of selected) {
    expanded.add(ind)
    for (const alias of legacyAliases[ind] ?? []) expanded.add(alias)
  }
  return Array.from(expanded)
}

function IndustryFilter({ industries, toggleIndustry, clearIndustries }: {
  industries: string[]
  toggleIndustry: (v: string) => void
  clearIndustries: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Sorted: selected first, then rest alphabetically
  const sorted = [...industries, ...INDUSTRIES.filter(i => !industries.includes(i))]

  return (
    <div ref={ref} className="relative flex items-center gap-1.5">
      <span className="text-[11px] font-medium text-gray-400 shrink-0">Industry</span>

      {/* One-line strip — overflow hidden, selected chips shown first */}
      <div className="flex gap-1.5 overflow-hidden" style={{ maxWidth: 520 }}>
        {sorted.map(ind => (
          <button key={ind} type="button" onClick={() => toggleIndustry(ind)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              industries.includes(ind)
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
            }`}>
            {ind}
          </button>
        ))}
      </div>

      {/* More button */}
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
          open
            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
            : 'border-transparent text-indigo-500 hover:text-indigo-700 hover:bg-white hover:shadow-sm hover:border-gray-200'
        }`}>
        {industries.length > 0 ? `+${industries.length} selected` : 'More'}
      </button>

      {industries.length > 0 && (
        <button type="button" onClick={clearIndustries} className="shrink-0 text-xs text-red-400 hover:text-red-600 transition-colors">
          Clear
        </button>
      )}

      {/* Dropdown popover */}
      {open && (
        <div className="absolute top-full left-0 mt-2 z-30 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-[480px]">
          <div className="flex flex-wrap gap-1.5">
            {INDUSTRIES.map(ind => (
              <button key={ind} type="button" onClick={() => toggleIndustry(ind)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  industries.includes(ind)
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
                }`}>
                {ind}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 'pending' first: it's the one that needs doing something about. A profile
// starts here and stays off browse until it's approved.
const STATUS_OPTIONS = ['pending', 'active', 'inactive', 'placed']

// A candidate gets a row the moment they create an account, so the admin can
// see they exist. That row is empty until they reach the profile form, and
// the database holds it back from browse until it isn't — then lists them
// without being asked. So 'pending' here means one thing: nothing filled in
// yet. Those people need chasing, not approving.
const EMPLOYMENT_OPTIONS = ['Full Time', 'Part Time']

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700 border border-amber-200',
  active:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  inactive: 'bg-gray-100 text-gray-500 border border-gray-200',
  placed:   'bg-indigo-50 text-indigo-600 border border-indigo-200',
}

const JOB_STATUS_COLORS: Record<string, string> = {
  'Open':    'text-emerald-700',
  'Filled':  'text-indigo-600',
  'On Hold': 'text-amber-600',
  'Closed':  'text-gray-400',
}

// What the list last showed for each set of filters, so coming Back from a
// candidate redraws it at once — at the same length, which is what lets the
// scroll memory put you on the same row — and then refreshes it quietly.
// Module scope: it lasts while the admin moves around the site, and a
// refresh starts clean.
type Snapshot = {
  candidates: Candidate[]
  jobAssignments: Record<string, string[]>
  jobActions: Record<string, Record<string, string | null>>
  assignmentIds: Record<string, Record<string, string>>
}
const listCache = new Map<string, Snapshot>()
let jobsCache: JobOption[] | null = null
let aliasCache: Record<string, string[]> | null = null


// useSearchParams needs a Suspense boundary above it, or the build refuses to
// prerender the page.
export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<CandidateListSkeleton />}>
      <AdminDashboard />
    </Suspense>
  )
}

function AdminDashboard() {
  // Filters live in the address (see useQueryParams). The search box keeps its
  // own copy so typing isn't held up by the address; it is written there a
  // moment after typing stops.
  const [params, setParams] = useQueryParams()
  const q = params.get('q') ?? ''
  const industriesParam = params.getAll('industry')
  const industriesKey = industriesParam.join('|')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const industries = useMemo(() => industriesParam, [industriesKey])
  const status = params.get('status') ?? ''
  const employment = params.get('type') ?? ''
  const interviewedParam = params.get('interviewed')
  const interviewedFilter: 'all' | 'yes' | 'no' = interviewedParam === 'yes' || interviewedParam === 'no' ? interviewedParam : 'all'
  // Profiles and video-interview candidates used to live on separate pages;
  // both are here now, and this narrows to one kind.
  const sourceParam = params.get('source')
  const sourceFilter: 'all' | 'profile' | 'video' = sourceParam === 'profile' || sourceParam === 'video' ? sourceParam : 'all'
  const listKey = [q.trim(), industriesKey, status, employment, interviewedFilter, sourceFilter].join('\u0000')

  const cached = listCache.get(listKey)
  const [candidates, setCandidates] = useState<Candidate[]>(cached?.candidates ?? [])
  // `loading` is only for having nothing to show yet. A list on screen stays
  // on screen while the next one loads, so the page doesn't blank and jump on
  // every keystroke or filter click.
  const [loading, setLoading] = useState(!cached)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState(q)
  const [legacyIndustryAliases, setLegacyIndustryAliases] = useState<Record<string, string[]>>(aliasCache ?? {})
  // The candidate you just came back from, picked out until it fades.
  const [lastOpened, setLastOpened] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const id = sessionStorage.getItem(LAST_OPENED_KEY)
      sessionStorage.removeItem(LAST_OPENED_KEY)
      return id
    } catch { return null }
  })
  const [togglingInterviewed, setTogglingInterviewed] = useState<string | null>(null)
  const [approving, setApproving] = useState<string | null>(null)
  // Approving and assigning used to fail into a browser alert, which is both
  // the ugliest thing on the site and the one place the raw database text was
  // quoted at you word for word.
  const [actionError, setActionError] = useState<string | null>(null)

  const [jobs, setJobs] = useState<JobOption[]>(jobsCache ?? [])
  // jobAssignments[candidateId] = array of assigned jobIds
  const [jobAssignments, setJobAssignments] = useState<Record<string, string[]>>(cached?.jobAssignments ?? {})
  const [jobActions, setJobActions] = useState<Record<string, Record<string, string | null>>>(cached?.jobActions ?? {})
  const [assignmentIds, setAssignmentIds] = useState<Record<string, Record<string, string>>>(cached?.assignmentIds ?? {})
  const [expandedAssign, setExpandedAssign] = useState<string | null>(null)
  const [togglingAssign, setTogglingAssign] = useState<string | null>(null)
  const [savingAdminAction, setSavingAdminAction] = useState<string | null>(null)

  // Load jobs once
  useEffect(() => {
    async function loadJobs() {
      const supabase = createClient()
      const { data } = await supabase
        .from('job_requirements')
        // No employer_profiles(...) embed: it resolved through the old
        // employer_id → employer_profiles FK, which now points at profiles
        .select('id, job_title, status, employer_id')
        .in('status', ['Open', 'On Hold'])
        .order('created_at', { ascending: false })

      const profileIds = (data ?? []).map((j: any) => j.employer_id).filter(Boolean)
      const companyMap: Record<string, string> = {}
      const profileMap: Record<string, string> = {}
      if (profileIds.length > 0) {
        const [{ data: eps }, { data: profiles }] = await Promise.all([
          supabase.from('employer_profiles').select('id, company_name').in('id', profileIds),
          supabase.from('profiles').select('id, full_name').in('id', profileIds),
        ])
        for (const e of eps ?? []) { if (e.company_name) companyMap[e.id] = e.company_name }
        for (const p of profiles ?? []) profileMap[p.id] = p.full_name ?? ''
      }

      setJobs(jobsCache = (data ?? []).map((j: any) => ({
        id: j.id,
        job_title: j.job_title,
        status: j.status,
        employer_label: companyMap[j.employer_id] || profileMap[j.employer_id] || 'Unknown',
      })))
    }
    loadJobs()
  }, [])

  // Build a current-category → legacy-value alias map (AI-derived from whatever is
  // actually stored in the DB) so industry filtering also surfaces candidates who
  // filled out their profile under an older version of the category list.
  useEffect(() => {
    async function loadIndustryAliases() {
      try {
        const res = await fetch('/api/admin/industry-alias-map')
        if (!res.ok) return
        const { aliasMap } = await res.json() as { aliasMap: Record<string, string | null> }
        const reverse: Record<string, string[]> = {}
        for (const [legacyValue, current] of Object.entries(aliasMap)) {
          if (!current) continue
          ;(reverse[current] ??= []).push(legacyValue)
        }
        setLegacyIndustryAliases(aliasCache = reverse)
      } catch {
        // Non-critical — filtering just falls back to exact matches only.
      }
    }
    loadIndustryAliases()
  }, [])

  // A candidate profile starts as 'pending' and browse only lists 'active',
  // so until this is clicked nobody outside the admin sees them. That is what
  // makes "every profile is checked by us before it appears" true.
  async function approveCandidate(candidateId: string) {
    setApproving(candidateId)
    setActionError(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('candidate_profiles').update({ status: 'active' }).eq('id', candidateId)
    // supabase-js resolves with an error rather than throwing, so without this
    // a failed approval would look exactly like a successful one.
    if (error) {
      console.error('approval failed:', error.message)
      setActionError(humanError(error, 'Couldn\u2019t approve this candidate.'))
    } else {
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: 'active' } : c))
    }
    setApproving(null)
  }

  async function toggleInterviewed(candidateId: string, current: boolean | null) {
    setTogglingInterviewed(candidateId)
    const newVal = !current
    const supabase = createClient()
    await supabase.from('candidate_profiles').update({
      interviewed: newVal,
      interviewed_at: newVal ? new Date().toISOString() : null,
    }).eq('id', candidateId)
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, interviewed: newVal } : c))
    setTogglingInterviewed(null)
  }

  // Responses can come back out of order when filters change quickly; only
  // the latest request is allowed to update the list.
  const requestSeq = useRef(0)
  const fetchCandidates = useCallback(async () => {
    const seq = ++requestSeq.current
    // Characters that would break the filter syntax are dropped from the search.
    const term = q.trim().replace(/[,()%*\\]/g, ' ').trim()
    setRefreshing(true)
    try {
      const supabase = createClient()

      let query = supabase
        .from('candidate_profiles')
        .select('id, full_name, email, location, current_job_title, roles_seeking, fields_worked_in, employment_type, years_experience, status, admin_tags, interviewed, interviewed_at')
        .order('full_name', { ascending: true })

    if (term) {
      query = query.or(
        `full_name.ilike.%${term}%,location.ilike.%${term}%,current_job_title.ilike.%${term}%`
      )
    }
    if (industries.length > 0) query = query.overlaps('fields_worked_in', industriesWithLegacyAliases(industries, legacyIndustryAliases))
    if (status) query = query.eq('status', status)
    if (employment) query = query.overlaps('employment_type', [employment])
    if (interviewedFilter === 'yes') query = query.eq('interviewed', true)
    if (interviewedFilter === 'no') query = query.or('interviewed.is.null,interviewed.eq.false')

    // Video-interview candidates: interviewed by definition, and with no
    // status, so a status filter or "not interviewed" leaves them out.
    const wantProfiles = sourceFilter !== 'video'
    const wantVideos = sourceFilter !== 'profile' && !status && interviewedFilter !== 'no'
    let videoQuery = supabase
      .from('video_candidates')
      .select('id, name, location, current_job_title, fields_worked_in, employment_type')
    if (term) videoQuery = videoQuery.or(`name.ilike.%${term}%,location.ilike.%${term}%,current_job_title.ilike.%${term}%`)
    if (industries.length > 0) videoQuery = videoQuery.overlaps('fields_worked_in', industriesWithLegacyAliases(industries, legacyIndustryAliases))
    if (employment) videoQuery = videoQuery.overlaps('employment_type', [employment])

    const [profileRes, videoRes] = await Promise.all([
      wantProfiles ? query : Promise.resolve({ data: [], error: null }),
      wantVideos ? videoQuery : Promise.resolve({ data: [], error: null }),
    ])
    if (profileRes.error) throw new Error(profileRes.error.message)
    // A video list that won't load shouldn't take the profiles down with it.
    if (videoRes.error) console.error('video candidates failed to load:', videoRes.error.message)
    if (seq !== requestSeq.current) return
    const list: Candidate[] = [
      ...((profileRes.data as Candidate[]) ?? []).map(c => ({ ...c, source: 'profile' as const })),
      ...((videoRes.error ? [] : (videoRes.data as VideoRow[]) ?? [])).map(fromVideo),
    ]
    // Sort ignoring leading non-letter characters (e.g. "(evelyn ...)"),
    // so names in parentheses don't jump to the top of the list
    const sortKey = (name: string | null) => (name ?? '').replace(/^[^a-zA-Z֐-׿]+/, '').toLowerCase()
    list.sort((a, b) => sortKey(a.full_name).localeCompare(sortKey(b.full_name)))

    let asgn: { id: string; candidate_id: string; job_id: string; action: string | null }[] = []
    if (list.length > 0) {
      const { data: rows } = await supabase
        .from('candidate_job_assignments')
        .select('id, candidate_id, job_id, action')
        .in('candidate_id', list.map(c => c.id))
      asgn = rows ?? []
    }
    if (seq !== requestSeq.current) return
    {
      const map: Record<string, string[]> = {}
      const actMap: Record<string, Record<string, string | null>> = {}
      const idMap: Record<string, Record<string, string>> = {}
      for (const row of asgn) {
        if (!map[row.candidate_id]) map[row.candidate_id] = []
        map[row.candidate_id].push(row.job_id)
        if (!actMap[row.candidate_id]) actMap[row.candidate_id] = {}
        actMap[row.candidate_id][row.job_id] = row.action
        if (!idMap[row.candidate_id]) idMap[row.candidate_id] = {}
        idMap[row.candidate_id][row.job_id] = row.id
      }
      // Set together, so a row never shows another list's assignments.
      setCandidates(list)
      setJobAssignments(map)
      setJobActions(actMap)
      setAssignmentIds(idMap)
    }
    } catch (err) {
      console.error('Failed to load candidates:', err)
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [q, industries, status, employment, interviewedFilter, sourceFilter, legacyIndustryAliases])

  // On the next tick, so a burst of filter changes makes one request.
  useEffect(() => {
    const t = setTimeout(fetchCandidates, 0)
    return () => clearTimeout(t)
  }, [fetchCandidates])

  // Typing goes into the address a moment after it stops.
  useEffect(() => {
    if (search === q) return
    const t = setTimeout(() => setParams({ q: search.trim() ? search : null }), 300)
    return () => clearTimeout(t)
  }, [search, q, setParams])

  // Whatever is on screen — including approvals and assignments made here —
  // is what Back will show next time.
  useEffect(() => {
    if (loading) return
    listCache.set(listKey, { candidates, jobAssignments, jobActions, assignmentIds })
  }, [listKey, loading, candidates, jobAssignments, jobActions, assignmentIds])

  useEffect(() => {
    if (!lastOpened) return
    // Previous / Next on the candidate page can leave you somewhere else in
    // the list than where you opened it; bring that one into view, once the
    // scroll memory has put the list back.
    const show = setTimeout(() => {
      const row = document.getElementById(`candidate-${lastOpened}`)
      const box = document.getElementById('admin-scroll')
      if (!row || !box) return
      const r = row.getBoundingClientRect(), b = box.getBoundingClientRect()
      if (r.top < b.top || r.bottom > b.bottom) row.scrollIntoView({ block: 'center' })
    }, 150)
    const fade = setTimeout(() => setLastOpened(null), 2500)
    return () => { clearTimeout(show); clearTimeout(fade) }
  }, [lastOpened])

  // Keep assignment actions in sync with DB changes made by employers
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-assignment-sync')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'candidate_job_assignments' },
        (payload) => {
          const row = payload.new as { id: string; candidate_id: string; job_id: string; action: string | null }
          setJobActions(prev => ({
            ...prev,
            [row.candidate_id]: { ...(prev[row.candidate_id] ?? {}), [row.job_id]: row.action },
          }))
          setAssignmentIds(prev => ({
            ...prev,
            [row.candidate_id]: { ...(prev[row.candidate_id] ?? {}), [row.job_id]: row.id },
          }))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  function toggleIndustry(val: string) {
    setParams({ industry: industries.includes(val) ? industries.filter(i => i !== val) : [...industries, val] })
  }


  async function toggleJobAssignment(candidateId: string, jobId: string) {
    const key = `${candidateId}-${jobId}`
    setTogglingAssign(key)
    setActionError(null)
    const supabase = createClient()
    const isAssigned = (jobAssignments[candidateId] ?? []).includes(jobId)

    if (isAssigned) {
      const { error: deleteErr } = await supabase
        .from('candidate_job_assignments')
        .delete()
        .eq('candidate_id', candidateId)
        .eq('job_id', jobId)
      if (deleteErr) {
        setActionError(humanError(deleteErr, 'Couldn’t remove the assignment.'))
        setTogglingAssign(null)
        return
      }
      setJobAssignments(prev => ({
        ...prev,
        [candidateId]: (prev[candidateId] ?? []).filter(id => id !== jobId),
      }))
    } else {
      const { error: insertErr } = await supabase
        .from('candidate_job_assignments')
        .insert({ candidate_id: candidateId, job_id: jobId })
      if (insertErr) {
        setActionError(humanError(insertErr, 'Couldn\u2019t assign this candidate.'))
        setTogglingAssign(null)
        return
      }
      setJobAssignments(prev => ({
        ...prev,
        [candidateId]: [...(prev[candidateId] ?? []), jobId],
      }))
      fetch('/api/notifications/candidate-assigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidateId, job_id: jobId }),
      })
    }

    setTogglingAssign(null)
  }

  async function handleAdminAction(candidateId: string, jobId: string, newAction: 'request_meeting' | 'pass') {
    const asgId = assignmentIds[candidateId]?.[jobId]
    if (!asgId) return
    const current = jobActions[candidateId]?.[jobId] ?? null
    const next = current === newAction ? null : newAction
    setSavingAdminAction(`${candidateId}-${jobId}`)
    const supabase = createClient()
    await supabase.from('candidate_job_assignments').update({ action: next }).eq('id', asgId)
    setJobActions(prev => ({
      ...prev,
      [candidateId]: { ...(prev[candidateId] ?? {}), [jobId]: next },
    }))
    setSavingAdminAction(null)
  }

  return (
    <main className="dash-page">

        <div className="flex items-center justify-between">
          <h1 className="page-title">Candidates</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {loading ? '' : (() => {
                const videos = candidates.filter(c => c.source === 'video').length
                const profiles = candidates.length - videos
                return videos === 0 ? `${profiles} total` : profiles === 0 ? `${videos} video` : `${profiles} profiles · ${videos} video`
              })()}
            </span>
            <AddCandidatesPanel onAdded={fetchCandidates} />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, location, job title…"
            className="pl-9"
          />
        </div>

        {/* Filters — flat, no box */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {/* Industry — one line, overflow hidden; "More" opens a dropdown popover */}
          <IndustryFilter
            industries={industries}
            toggleIndustry={toggleIndustry}
            clearIndustries={() => setParams({ industry: null })}
          />

          <div className="w-px h-4 bg-gray-200 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-gray-400 mr-0.5">Status</span>
            {['', ...STATUS_OPTIONS].map(s => (
              <button key={s} type="button" onClick={() => setParams({ status: s })}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all capitalize ${
                  status === s
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
                }`}>
                {s || 'All'}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-gray-200 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-gray-400 mr-0.5">Type</span>
            {['', ...EMPLOYMENT_OPTIONS].map(e => (
              <button key={e} type="button" onClick={() => setParams({ type: e })}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  employment === e
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
                }`}>
                {e || 'All'}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-gray-200 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-gray-400 mr-0.5">Kind</span>
            {([['all', 'All'], ['profile', 'Profiles'], ['video', 'Video only']] as const).map(([v, label]) => (
              <button key={v} type="button" onClick={() => setParams({ source: v === 'all' ? null : v })}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  sourceFilter === v
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
                }`}>
                {label}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-gray-200 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-gray-400 mr-0.5">Interviewed</span>
            {(['all', 'yes', 'no'] as const).map(v => (
              <button key={v} type="button" onClick={() => setParams({ interviewed: v === 'all' ? null : v })}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  interviewedFilter === v
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
                }`}>
                {v === 'all' ? 'All' : v === 'yes' ? '✓ Yes' : '✗ No'}
              </button>
            ))}
          </div>
        </div>

        {actionError && <ErrorNote className="mb-4">{actionError}</ErrorNote>}

        {/* Results */}
        {loading ? (
          <CandidateRowsSkeleton />
        ) : candidates.length === 0 ? (
          <div className={`text-sm text-gray-400 py-12 text-center ${refreshing ? 'opacity-50' : ''}`}>No candidates found.</div>
        ) : (
          // Dimmed while the next set loads, so a click visibly did something
          // without the list vanishing from under you.
          <div className={`space-y-3 transition-opacity ${refreshing ? 'opacity-60' : ''}`}>
            {candidates.map(c => {
              const assignedJobIds = jobAssignments[c.id] ?? []
              const actions = jobActions[c.id] ?? {}
              const isExpanded = expandedAssign === c.id

              return (
                <div key={c.id} id={`candidate-${c.id}`} className={`w-full bg-white rounded-xl border shadow-sm overflow-hidden transition-[box-shadow,border-color] duration-700 ${
                  lastOpened === c.id ? 'border-indigo-300 ring-2 ring-indigo-200' : 'border-gray-100'
                }`}>
                  {/* Candidate info — links to detail */}
                  <Link href={candidateHref(c)}
                    onClick={() => saveSequence(candidates, c.id)}
                    className="block px-5 py-4 group hover:bg-gray-50/60 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm select-none ${
                        c.source === 'video' ? 'bg-violet-50 text-violet-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {c.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                          <p className="text-xl font-bold text-gray-950 tracking-tight">{c.full_name ?? 'Unnamed'}</p>
                          {c.status && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
                              {c.status}
                            </span>
                          )}
                          {c.source === 'video' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-medium">
                              Video interview only
                            </span>
                          )}
                          {c.source !== 'video' && !isProfileFilledIn(c) && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-medium">
                              Signed up · profile empty
                            </span>
                          )}
                          {c.interviewed && c.source !== 'video' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">Interviewed ✓</span>
                          )}
                          {c.admin_tags?.map(tag => (
                            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">{tag}</span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-500">
                          {[c.current_job_title, c.location].filter(Boolean).join(' · ')}
                        </p>
                        {(c.fields_worked_in?.length > 0 || c.employment_type?.length > 0) && (
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {c.fields_worked_in?.map(f => (
                              <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">{f}</span>
                            ))}
                            {c.employment_type?.map(e => (
                              <span key={e} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{e}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </Link>

                  {/* Job assignment bar */}
                  <div className="border-t border-gray-100 bg-[#fafafa] px-5 py-2.5 flex items-center justify-between gap-4 min-h-[44px]">
                    <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
                      {assignedJobIds.length === 0 ? (
                        <span className="text-xs text-gray-300">No jobs assigned</span>
                      ) : (
                        assignedJobIds.map(jid => {
                          const job = jobs.find(j => j.id === jid)
                          const act = actions[jid]
                          const actionKey = `${c.id}-${jid}`
                          return (
                            <span key={jid} className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[12px] text-gray-600 font-medium">
                                {job ? `${job.employer_label} · ${job.job_title}` : jid}
                              </span>
                              <Button
                                type="button"
                                size="xs"
                                variant={act === 'request_meeting' ? 'default' : 'outline'}
                                disabled={savingAdminAction === actionKey}
                                onClick={() => handleAdminAction(c.id, jid, 'request_meeting')}
                              >
                                {act === 'request_meeting' ? 'Meeting ✓' : 'Meeting'}
                              </Button>
                              <Button
                                type="button"
                                size="xs"
                                variant={act === 'pass' ? 'secondary' : 'outline'}
                                disabled={savingAdminAction === actionKey}
                                onClick={() => handleAdminAction(c.id, jid, 'pass')}
                              >
                                {act === 'pass' ? 'Passed ✓' : 'Pass'}
                              </Button>
                            </span>
                          )
                        })
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* A filled-in profile is listed by the database without
                          being asked, so this only appears if that hasn't
                          happened — before auto_approve.sql has been run, or
                          for a row that somehow slipped past it. Approving an
                          empty profile would put a blank card on browse, so
                          it never offers that. */}
                      {c.status === 'pending' && isProfileFilledIn(c) && (
                        <button
                          type="button"
                          disabled={approving === c.id}
                          onClick={() => approveCandidate(c.id)}
                          className="text-xs px-2.5 py-1 rounded-full border font-medium transition-colors bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                        >
                          {approving === c.id ? 'Approving…' : 'Approve for browse'}
                        </button>
                      )}
                      {c.source !== 'video' && <button
                        type="button"
                        disabled={togglingInterviewed === c.id}
                        onClick={() => toggleInterviewed(c.id, c.interviewed)}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                          c.interviewed
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-700'
                        }`}
                      >
                        {c.interviewed ? 'Interviewed ✓' : 'Mark interviewed'}
                      </button>}
                      <Button
                        type="button"
                        size="sm"
                        variant={isExpanded ? 'default' : 'outline'}
                        onClick={() => setExpandedAssign(isExpanded ? null : c.id)}
                      >
                        {isExpanded ? 'Done' : '+ Assign job'}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded job assign panel */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/80">
                      {jobs.length === 0 ? (
                        <p className="text-xs text-gray-400">No open jobs found. <Link href="/dashboard/admin/jobs" className="text-indigo-600 hover:underline">Add jobs →</Link></p>
                      ) : (
                        <div className="space-y-2.5">
                          {jobs.map(job => {
                            const isAssigned = assignedJobIds.includes(job.id)
                            const key = `${c.id}-${job.id}`
                            return (
                              <label key={job.id} className="flex items-center gap-3 cursor-pointer group">
                                <Checkbox
                                  checked={isAssigned}
                                  disabled={togglingAssign === key}
                                  onCheckedChange={() => toggleJobAssignment(c.id, job.id)}
                                />
                                <span className="text-[13px] text-gray-700 group-hover:text-gray-900 transition-colors">
                                  <span className="font-medium">{job.employer_label}</span>
                                  <span className="text-gray-400"> · {job.job_title}</span>
                                </span>
                                <span className={`text-[11px] font-medium ${JOB_STATUS_COLORS[job.status] ?? 'text-gray-400'}`}>
                                  {job.status}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
  )
}

import type Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { IMAGE_MODEL, getAnthropic } from '@/lib/ai/models'
import { loadResume } from '@/lib/resumeContent'
import { resumesUrl, serviceClient, stagedPath } from '@/lib/assistant/storage'

// SERVER ONLY.
//
// What the admin assistant can look at. Each tool reads the real records —
// profiles, résumé text, interview transcripts, jobs, match scores — so its
// answers come from what is on file, not from what the model remembers or
// guesses. Everything here runs with the signed-in admin's own database
// session, so it can see exactly what the admin can and nothing more.

type Tool = Anthropic.Beta.BetaTool
type ToolResult = Anthropic.Beta.BetaToolResultBlockParam

// The longest text one tool hands back. A résumé or a transcript is well under
// this; a mistaken upload (a portfolio, a book) is cut, and the cut is said.
const MAX_TEXT = 60_000
const MAX_RESULTS = 50

export const TOOLS: Tool[] = [
  {
    name: 'search_candidates',
    description:
      'Find candidates. Searches names, job titles, locations and roles, and — with a keyword — the full text of résumés, '
      + 'candidate summaries and interview transcripts. Use a single distinctive keyword or short phrase per search '
      + '(e.g. "QuickBooks", "Hebrew", "medical billing"); run several searches for several terms. '
      + 'Filters narrow the list. Returns up to `limit` candidates with their id, kind and where the keyword was found.',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['keyword', 'industry', 'employment_type', 'status', 'kind', 'limit'],
      properties: {
        // Plain strings with an explicit "none" value rather than nullable
        // types: strict tool schemas don't take a list of types.
        keyword: { type: 'string', description: 'Text to look for, or "" to list by the filters only.' },
        industry: { type: 'string', description: 'An industry such as "Accounting & Finance", or "" for any.' },
        employment_type: { type: 'string', enum: ['any', 'Full Time', 'Part Time'] },
        status: { type: 'string', enum: ['any', 'pending', 'active', 'inactive', 'placed'], description: 'Profile status.' },
        kind: { type: 'string', enum: ['any', 'profile', 'video'], description: '"video" means people known only from a video interview.' },
        limit: { type: 'integer', description: `How many to return, 1-${MAX_RESULTS}.` },
      },
    },
  },
  {
    name: 'get_candidate',
    description:
      'Everything on file about one candidate except the full résumé and transcript text: profile fields, contact details, '
      + 'status, admin tags, whether interviewed, the AI summary card, which jobs and employers they are assigned to, '
      + 'and whether a résumé and a transcript exist.',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'kind'],
      properties: {
        id: { type: 'string', description: 'The candidate id from search_candidates.' },
        kind: { type: 'string', enum: ['profile', 'video'] },
      },
    },
  },
  {
    name: 'read_resume',
    description: 'The full text of a candidate\'s résumé. Only profile candidates have résumés.',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'read_transcript',
    description: 'The full transcript of a candidate\'s recorded video interview, if there is one.',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'kind'],
      properties: {
        id: { type: 'string' },
        kind: { type: 'string', enum: ['profile', 'video'] },
      },
    },
  },
  {
    name: 'read_attached_file',
    description:
      'The text of a file the admin attached in this chat — usually a résumé to add as a new candidate, or to put on an '
      + 'existing candidate. The file id appears in the admin\'s message as "file_id: ...".',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['file_id'],
      properties: { file_id: { type: 'string' } },
    },
  },
  {
    name: 'list_jobs',
    description: 'Jobs on the job board, newest first, with their id, title, company and status.',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['any', 'New', 'Open', 'On Hold', 'Filled', 'Closed'] },
      },
    },
  },
  {
    name: 'get_job',
    description:
      'One job in full — description, requirements, pay, hours — with the candidates assigned to it and the '
      + 'highest stored match scores from Matching (scores may be out of date if the job or a candidate changed since).',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
]

const ok = (id: string, content: string | ToolResult['content']): ToolResult => ({ type: 'tool_result', tool_use_id: id, content })
const fail = (id: string, message: string): ToolResult => ({ type: 'tool_result', tool_use_id: id, content: message, is_error: true })

// A string argument, with "" and "any" meaning "not given".
const str = (v: unknown) => (typeof v === 'string' && v.trim() && v !== 'any' ? v.trim() : null)
const cut = (text: string) => (text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT)}\n\n[Cut here: the rest (${text.length - MAX_TEXT} characters) was left out.]` : text)
// % and _ are wildcards in a LIKE pattern; a keyword means them literally.
const like = (keyword: string) => `%${keyword.replace(/[\\%_]/g, m => `\\${m}`)}%`
const json = (value: unknown) => JSON.stringify(value, null, 1)

/** Run one tool call. Never throws: a failure goes back to the model as an error result it can explain. */
export async function runTool(db: SupabaseClient, call: { id: string; name: string; input: unknown }): Promise<ToolResult> {
  const input = (call.input ?? {}) as Record<string, unknown>
  try {
    switch (call.name) {
      case 'search_candidates': return ok(call.id, await searchCandidates(db, input))
      case 'get_candidate': return ok(call.id, await getCandidate(db, String(input.id ?? ''), input.kind === 'video' ? 'video' : 'profile'))
      case 'read_resume': return ok(call.id, await readResume(db, String(input.id ?? '')))
      case 'read_transcript': return ok(call.id, await readTranscript(db, String(input.id ?? ''), input.kind === 'video' ? 'video' : 'profile'))
      case 'list_jobs': return ok(call.id, await listJobs(db, str(input.status)))
      case 'get_job': return ok(call.id, await getJob(db, String(input.id ?? '')))
      case 'read_attached_file': {
        const path = stagedPath(input.file_id)
        if (!path) return fail(call.id, 'That is not a file attached in this chat.')
        // Attached files sit in a holding folder only the server role reads.
        return ok(call.id, `Attached file:\n\n${await readResumeFile(serviceClient(), resumesUrl(path))}`)
      }
      default: return fail(call.id, `There is no tool called ${call.name}.`)
    }
  } catch (e) {
    console.error(`assistant tool ${call.name} failed:`, e)
    return fail(call.id, `The lookup failed: ${e instanceof Error ? e.message : String(e)}`)
  }
}

type Found = { id: string; kind: 'profile' | 'video'; name: string | null; title: string | null; location: string | null; status?: string | null; industries?: string[]; matchedIn: Set<string> }

async function searchCandidates(db: SupabaseClient, input: Record<string, unknown>): Promise<string> {
  const keyword = str(input.keyword)?.trim() || null
  const industry = str(input.industry)
  const employment = str(input.employment_type)
  const status = str(input.status)
  const kind = input.kind === 'profile' || input.kind === 'video' ? input.kind : 'any'
  const limit = Math.max(1, Math.min(MAX_RESULTS, Number(input.limit) || 20))
  const wantProfiles = kind !== 'video'
  // Video candidates have no status, so a status filter leaves them out.
  const wantVideos = kind !== 'profile' && !status

  const found = new Map<string, Found>()
  const add = (f: Omit<Found, 'matchedIn'>, where: string) => {
    const existing = found.get(f.id)
    if (existing) existing.matchedIn.add(where)
    else found.set(f.id, { ...f, matchedIn: new Set([where]) })
  }

  const profileCols = 'id, full_name, current_job_title, location, status, fields_worked_in, employment_type'
  // Profiles with the filters applied; callers add the search and the limit.
  const profileQuery = () => {
    let q = db.from('candidate_profiles').select(profileCols)
    if (status) q = q.eq('status', status)
    if (industry) q = q.overlaps('fields_worked_in', [industry])
    if (employment) q = q.overlaps('employment_type', [employment])
    return q
  }
  type ProfileRow = { id: string; full_name: string | null; current_job_title: string | null; location: string | null; status: string | null; fields_worked_in: string[] | null }
  type VideoRow = { id: string; name: string | null; current_job_title: string | null; location: string | null; fields_worked_in: string[] | null }
  const asProfile = (p: ProfileRow) => ({ id: p.id, kind: 'profile' as const, name: p.full_name, title: p.current_job_title, location: p.location, status: p.status, industries: p.fields_worked_in ?? [] })
  const asVideo = (v: VideoRow) => ({ id: v.id, kind: 'video' as const, name: v.name, title: v.current_job_title, location: v.location, industries: v.fields_worked_in ?? [] })

  if (!keyword) {
    const [profiles, videos] = await Promise.all([
      wantProfiles ? profileQuery().order('full_name').limit(limit) : null,
      wantVideos ? (() => {
        let q = db.from('video_candidates').select('id, name, current_job_title, location, fields_worked_in')
        if (industry) q = q.overlaps('fields_worked_in', [industry])
        if (employment) q = q.overlaps('employment_type', [employment])
        return q.order('name').limit(limit)
      })() : null,
    ])
    for (const p of (profiles?.data ?? []) as ProfileRow[]) add(asProfile(p), 'filters')
    for (const v of (videos?.data ?? []) as VideoRow[]) add(asVideo(v), 'filters')
  } else {
    const pattern = like(keyword)
    const fields = ['full_name', 'current_job_title', 'location', 'roles_seeking', 'tools_software', 'languages']
    // Each place a keyword can appear is its own query, so a hit can say where
    // it was found — and no user text ever goes into a combined filter string.
    const [byField, cards, transcripts, videoByField] = await Promise.all([
      wantProfiles ? Promise.all(fields.map(f => profileQuery().ilike(f, pattern).limit(MAX_RESULTS))) : [],
      Promise.all([
        db.from('candidate_cards').select('candidate_id, source').ilike('resume_text', pattern).limit(200),
        db.from('candidate_cards').select('candidate_id, source').ilike('card_text', pattern).limit(200),
      ]),
      Promise.all([
        wantProfiles ? db.from('videos').select('candidate_id').ilike('transcript', pattern).not('candidate_id', 'is', null).limit(200) : null,
        wantVideos ? db.from('video_candidates').select('id').ilike('transcript', pattern).limit(200) : null,
      ]),
      wantVideos ? Promise.all(['name', 'current_job_title', 'location'].map(f =>
        db.from('video_candidates').select('id, name, current_job_title, location, fields_worked_in').ilike(f, pattern).limit(MAX_RESULTS))) : [],
    ])
    byField.forEach((res, i) => { for (const p of (res.data ?? []) as ProfileRow[]) add(asProfile(p), fields[i].replace(/_/g, ' ')) })
    for (const res of videoByField) for (const v of (res.data ?? []) as VideoRow[]) add(asVideo(v), 'profile')

    // Hits in résumés, summaries and transcripts are ids only; look the people up.
    const where = new Map<string, Set<string>>()
    const note = (id: string, w: string) => { if (!where.has(id)) where.set(id, new Set()); where.get(id)!.add(w) }
    const [resumeHits, cardHits] = cards
    for (const c of (resumeHits.data ?? []) as { candidate_id: string; source: string }[]) note(c.candidate_id, 'résumé')
    for (const c of (cardHits.data ?? []) as { candidate_id: string; source: string }[]) note(c.candidate_id, 'summary')
    for (const t of (transcripts[0]?.data ?? []) as { candidate_id: string }[]) note(t.candidate_id, 'interview transcript')
    for (const t of (transcripts[1]?.data ?? []) as { id: string }[]) note(t.id, 'interview transcript')
    const ids = [...where.keys()]
    if (ids.length > 0) {
      const chunks: string[][] = []
      for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100))
      const [profileRows, videoRows] = await Promise.all([
        wantProfiles ? Promise.all(chunks.map(c => profileQuery().in('id', c))) : [],
        wantVideos ? Promise.all(chunks.map(c => {
          let q = db.from('video_candidates').select('id, name, current_job_title, location, fields_worked_in').in('id', c)
          if (industry) q = q.overlaps('fields_worked_in', [industry])
          if (employment) q = q.overlaps('employment_type', [employment])
          return q
        })) : [],
      ])
      for (const res of profileRows) for (const p of (res.data ?? []) as ProfileRow[]) for (const w of where.get(p.id) ?? []) add(asProfile(p), w)
      for (const res of videoRows) for (const v of (res.data ?? []) as VideoRow[]) for (const w of where.get(v.id) ?? []) add(asVideo(v), w)
    }
  }

  const all = [...found.values()]
  const shown = all.slice(0, limit)
  if (shown.length === 0) return keyword ? `No candidates mention “${keyword}”${status || industry || employment ? ' with those filters' : ''}.` : 'No candidates match those filters.'
  return json({
    total_found: all.length,
    returned: shown.length,
    ...(all.length > shown.length ? { note: `Only the first ${shown.length} are listed; narrow the search or raise the limit to see more.` } : {}),
    candidates: shown.map(f => ({
      id: f.id, kind: f.kind, name: f.name, title: f.title, location: f.location,
      ...(f.kind === 'profile' ? { status: f.status } : {}),
      industries: f.industries, ...(keyword ? { found_in: [...f.matchedIn] } : {}),
    })),
  })
}

async function getCandidate(db: SupabaseClient, id: string, kind: 'profile' | 'video'): Promise<string> {
  if (!id) return 'No id given.'
  if (kind === 'video') {
    const [{ data: v }, { data: card }, { data: jobs }] = await Promise.all([
      db.from('video_candidates').select('id, name, location, current_job_title, fields_worked_in, employment_type, notes, transcript, created_at').eq('id', id).maybeSingle(),
      db.from('candidate_cards').select('card_text').eq('candidate_id', id).eq('source', 'video').maybeSingle(),
      db.from('candidate_job_assignments').select('job_id, action, job_requirements(job_title, company_name)').eq('candidate_id', id),
    ])
    if (!v) return 'No video candidate with that id.'
    const { transcript, ...rest } = v as Record<string, unknown>
    return json({
      kind: 'video — known only from a recorded video interview; no account, profile or résumé',
      ...rest,
      has_transcript: !!transcript,
      ai_summary_card: (card as { card_text?: string } | null)?.card_text ?? null,
      assigned_jobs: jobs ?? [],
    })
  }

  const [{ data: cp }, { data: card }, { data: jobs }, { data: employers }, { data: videos }] = await Promise.all([
    db.from('candidate_profiles').select('*').eq('id', id).maybeSingle(),
    db.from('candidate_cards').select('card_text, resume_status, resume_note').eq('candidate_id', id).eq('source', 'profile').maybeSingle(),
    db.from('candidate_job_assignments').select('job_id, action, job_requirements(job_title, company_name)').eq('candidate_id', id),
    db.from('employer_candidate_assignments').select('employer_id, action, profiles(full_name, email)').eq('candidate_id', id),
    db.from('videos').select('id').eq('candidate_id', id).not('transcript', 'is', null).limit(1),
  ])
  if (!cp) return 'No candidate profile with that id.'
  const c = card as { card_text?: string; resume_status?: string; resume_note?: string | null } | null
  return json({
    kind: 'profile',
    ...(cp as Record<string, unknown>),
    has_resume: !!(cp as { resume_url?: string | null }).resume_url,
    resume_reading: c ? `${c.resume_status}${c.resume_note ? ` (${c.resume_note})` : ''}` : 'no summary card built yet',
    has_transcript: (videos ?? []).length > 0,
    ai_summary_card: c?.card_text ?? null,
    assigned_jobs: jobs ?? [],
    assigned_employers: employers ?? [],
  })
}

async function readResume(db: SupabaseClient, id: string): Promise<string> {
  if (!id) return 'No id given.'
  // The text Matching already pulled out of the résumé — the same text every
  // match is made from — so nothing is downloaded or read twice.
  const [{ data: card }, { data: cp }] = await Promise.all([
    db.from('candidate_cards').select('resume_text, resume_status, resume_note').eq('candidate_id', id).eq('source', 'profile').maybeSingle(),
    db.from('candidate_profiles').select('full_name, resume_url').eq('id', id).maybeSingle(),
  ])
  if (!cp) return 'No candidate profile with that id.'
  const resumeUrl = (cp as { resume_url?: string | null }).resume_url
  if (!resumeUrl) return 'This candidate has no résumé on file.'
  const stored = (card as { resume_text?: string | null } | null)?.resume_text
  if (stored?.trim()) return `Résumé text:\n\n${cut(stored.trim())}`

  // Not read yet (no card built). Read it now.
  return readResumeFile(db, resumeUrl)
}

/** The text of a résumé file: read directly, or transcribed when it's a photo or a scan. */
async function readResumeFile(db: SupabaseClient, resumeUrl: string): Promise<string> {
  const resume = await loadResume(db, resumeUrl)
  if (resume.kind === 'none') return 'There is no file there.'
  if (resume.kind === 'unreadable') return `The résumé couldn't be read: ${resume.note}.`
  if (resume.kind === 'text') return `Résumé text:\n\n${cut(resume.text)}`

  // A photo or a scan: have it transcribed, word for word.
  const source: Anthropic.Beta.BetaContentBlockParam = resume.kind === 'image'
    ? { type: 'image', source: { type: 'base64', media_type: resume.mediaType, data: resume.data.toString('base64') } }
    : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: resume.data.toString('base64') } }
  const message = await getAnthropic().beta.messages.create({
    model: IMAGE_MODEL,
    max_tokens: 8_000,
    messages: [{
      role: 'user',
      content: [source, { type: 'text', text: 'Transcribe this résumé to plain text, word for word, keeping its sections and order. Write only the transcription.' }],
    }],
  })
  if (message.stop_reason === 'refusal') return 'The résumé is a scanned image and could not be transcribed.'
  const text = message.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map(b => b.text).join('').trim()
  return text ? `Résumé text (transcribed from a scanned image, so small misreadings are possible):\n\n${cut(text)}` : 'The résumé is a scanned image and could not be transcribed.'
}

async function readTranscript(db: SupabaseClient, id: string, kind: 'profile' | 'video'): Promise<string> {
  if (!id) return 'No id given.'
  if (kind === 'video') {
    const { data } = await db.from('video_candidates').select('transcript').eq('id', id).maybeSingle()
    const t = (data as { transcript?: string | null } | null)?.transcript
    return t?.trim() ? `Interview transcript:\n\n${cut(t.trim())}` : 'There is no transcript for this candidate.'
  }
  // The newest recording that has one — the same one the summary card uses.
  const { data } = await db.from('videos').select('transcript, created_at').eq('candidate_id', id)
    .not('transcript', 'is', null).order('created_at', { ascending: false }).limit(1)
  const v = (data ?? [])[0] as { transcript?: string | null; created_at?: string } | undefined
  return v?.transcript?.trim()
    ? `Interview transcript (recorded ${v.created_at?.slice(0, 10) ?? 'date unknown'}):\n\n${cut(v.transcript.trim())}`
    : 'There is no transcript for this candidate.'
}

async function listJobs(db: SupabaseClient, status: string | null): Promise<string> {
  let q = db.from('job_requirements').select('id, job_title, company_name, status, employment_type, created_at').order('created_at', { ascending: false }).limit(100)
  if (status) q = q.eq('status', status)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []).length ? json(data) : 'No jobs found.'
}

async function getJob(db: SupabaseClient, id: string): Promise<string> {
  if (!id) return 'No id given.'
  const [{ data: job }, { data: assigned }, { data: scores }] = await Promise.all([
    db.from('job_requirements').select('*').eq('id', id).maybeSingle(),
    db.from('candidate_job_assignments').select('candidate_id, action').eq('job_id', id),
    db.from('candidate_ai_scores').select('candidate_id, source, score, summary, triage_only, updated_at').eq('job_id', id).order('score', { ascending: false }).limit(20),
  ])
  if (!job) return 'No job with that id.'
  const ids = [...new Set([...(assigned ?? []).map(a => a.candidate_id), ...(scores ?? []).map(s => s.candidate_id)])]
  const names = new Map<string, string>()
  if (ids.length) {
    const [p, v] = await Promise.all([
      db.from('candidate_profiles').select('id, full_name').in('id', ids),
      db.from('video_candidates').select('id, name').in('id', ids),
    ])
    for (const r of p.data ?? []) names.set(r.id, r.full_name ?? 'Unnamed')
    for (const r of v.data ?? []) names.set(r.id, r.name ?? 'Unnamed')
  }
  return json({
    job,
    assigned_candidates: (assigned ?? []).map(a => ({ ...a, name: names.get(a.candidate_id) ?? null })),
    top_match_scores: (scores ?? []).map(s => ({
      candidate_id: s.candidate_id, kind: s.source, name: names.get(s.candidate_id) ?? null, score: s.score,
      kind_of_score: s.triage_only ? 'quick score' : 'full analysis', summary: s.summary || undefined, scored_at: s.updated_at,
    })),
  })
}

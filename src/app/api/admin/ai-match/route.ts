import { createClient } from '@/lib/supabase/server'
import { createClient as adminSupabase } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

// Constructed lazily — building at module level crashes the whole route when the key is missing
let _anthropic: Anthropic | null = null
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 5 })
  return _anthropic
}

function adminClient() {
  return adminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function getResumeText(resumeUrl: string): Promise<string | null> {
  try {
    let buffer: Buffer | null = null

    const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resumes/`
    if (resumeUrl.startsWith(storageBase)) {
      // Supabase storage — download through the admin client
      const storagePath = resumeUrl.slice(storageBase.length)
      const supabase = adminClient()
      const { data } = await supabase.storage.from('resumes').download(storagePath)
      if (!data) return null
      buffer = Buffer.from(await data.arrayBuffer())
    } else if (resumeUrl.startsWith('http')) {
      // External link (e.g. admin-imported Wix files) — fetch directly
      const res = await fetch(resumeUrl, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) return null
      buffer = Buffer.from(await res.arrayBuffer())
    }

    if (!buffer || buffer.length === 0) return null
    // Dynamic import — pdf-parse pulls in native canvas deps that can fail to load on Vercel
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: buffer })
    const result = await parser.getText()
    return result.text.slice(0, 6000).trim() || null
  } catch {
    return null
  }
}

// ─── Batch Haiku triage — profile fields only, 25 candidates per call ───
function triageCandidateLine(c: Record<string, unknown>): string {
  return [
    `ID: ${c.id}`,
    `Title: ${c.current_job_title ?? '?'}`,
    `Location: ${c.location ?? '?'}`,
    `Fields: ${(c.fields_worked_in as string[] ?? []).join('/') || '?'}`,
    `Emp types: ${(c.employment_type as string[] ?? []).join('/') || '?'}`,
    `Langs: ${c.languages ?? '?'}`,
    `Seeking: ${c.roles_seeking ?? '?'}`,
    `Exp: ${c.years_experience ?? '?'}`,
  ].join(' | ')
}

async function triageBatch(
  candidates: Record<string, unknown>[],
  job: Record<string, unknown>,
): Promise<Record<string, number>> {
  const prompt = `You are a recruiter doing a FIRST-PASS screen of candidates for a job. Score each candidate 0-100 on likely fit.

━━━ JOB ━━━
Title: ${job.job_title}
Employment Type: ${job.employment_type ?? 'Not specified'}
Languages Required: ${job.languages ?? 'Not specified'}
Description:
${((job.description as string) ?? '(none)').slice(0, 3000)}

━━━ RULES ━━━
- Work arrangement defaults to REMOTE unless the description explicitly requires in-person presence. If remote, candidate location does not matter.
- If the job is explicitly on-site in a specific place and the candidate is clearly elsewhere: score ≤ 20.
- Similar-sounding titles are NOT the same role — judge by what the person actually does.
- Scale: 85-100 direct fit, 65-84 strong, 45-64 related with gaps, 25-44 stretch, 0-24 poor.

━━━ CANDIDATES ━━━
${candidates.map(triageCandidateLine).join('\n')}

Respond with JSON only — an array, one entry per candidate, same order:
[{"id": "<candidate id>", "score": <0-100>}, ...]`

  try {
    const message = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const jsonStart = text.indexOf('[')
    const jsonEnd = text.lastIndexOf(']')
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1))
    const map: Record<string, number> = {}
    for (const r of parsed) {
      if (r?.id) map[r.id] = Math.min(100, Math.max(0, Number(r.score) || 0))
    }
    return map
  } catch {
    return {}
  }
}

// ─── Single Sonnet deep analysis — full resume + transcript, one candidate ───
async function scoreCandidate(
  candidate: Record<string, unknown>,
  job: Record<string, unknown>,
  resumeText: string | null,
  transcript: string | null,
): Promise<{ score: number; summary: string; strengths: string[]; concerns: string[] }> {
  const prompt = `You are a recruiter evaluating a candidate for a job. Work through this carefully and systematically.

━━━ JOB ━━━
Title: ${job.job_title}
Employment Type: ${job.employment_type ?? 'Not specified'}
Hours/Week: ${job.hours ?? 'Not specified'}
Languages Required: ${job.languages ?? 'Not specified'}
Salary: ${job.salary ?? 'Not specified'}
Full Description:
${job.description ?? '(No description provided)'}

━━━ CANDIDATE ━━━
Current Title: ${candidate.current_job_title ?? 'Unknown'}
Location: ${candidate.location ?? 'Unknown'}
Fields Worked In: ${(candidate.fields_worked_in as string[] ?? []).join(', ') || 'Not specified'}
Employment Types Available: ${(candidate.employment_type as string[] ?? []).join(', ') || 'Not specified'}
Languages: ${candidate.languages ?? 'Not specified'}
Roles Seeking: ${candidate.roles_seeking ?? 'Not specified'}
Years Experience: ${candidate.years_experience ?? 'Unknown'}
Education: ${candidate.education_level ?? 'Unknown'}
Tools & Software: ${candidate.tools_software ?? 'Not specified'}
Remote Experience: ${candidate.remote_experience === true ? 'Yes' : candidate.remote_experience === false ? 'No' : 'Unknown'}

━━━ RESUME ━━━
${resumeText ?? '(Not provided — rely on profile fields above)'}

━━━ INTERVIEW TRANSCRIPT ━━━
${transcript ? (transcript as string).slice(0, 5000) : '(Not provided — rely on profile fields and resume)'}

━━━ INSTRUCTIONS ━━━
Output a single JSON object. The fields BEFORE "score" force you to reason correctly before you commit to a number.

1. job_work_arrangement: Read the full description. Default is "remote" unless the description explicitly says otherwise. Only set "on-site" if the description clearly requires in-person presence. Set "hybrid" only if explicitly stated.

2. job_required_location: Only if on-site or hybrid AND a specific city/country is named. Null for remote or if no location is specified.

3. job_core_function: In 1-2 sentences, what does this person ACTUALLY DO day-to-day?

4. candidate_location_match: true if remote, true if candidate is in the required location, false only if the job is explicitly on-site and candidate is clearly elsewhere.

5. candidate_actual_experience: In 1-2 sentences, what has this candidate ACTUALLY DONE based on resume and transcript?

6. score: Integer 0-100.
   - On-site job + candidate NOT in required location → score MUST be ≤ 20
   - Employment type mismatch → score MUST be ≤ 35
   - Scale: 85-100 direct fit, 65-84 strong, 45-64 related with gaps, 25-44 stretch, 0-24 poor.

Respond with JSON only — no markdown, no text outside the JSON:
{
  "job_work_arrangement": "remote|on-site|hybrid|unspecified",
  "job_required_location": "<city/country or null>",
  "job_core_function": "<what this role actually does>",
  "candidate_location_match": true|false|null,
  "candidate_actual_experience": "<what they have actually done>",
  "score": <0-100>,
  "summary": "<2-3 sentences: state location requirement + whether candidate meets it, then genuine fit>",
  "strengths": ["<evidence-based strength from resume/transcript/profile>"],
  "concerns": ["<specific gap, mismatch, or violated constraint>"]
}`

  let text = ''
  try {
    const message = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })
    text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { score: 0, summary: `AI error: ${msg}`, strengths: [], concerns: [] }
  }

  try {
    // Extract the JSON object even if the model wrapped it in markdown fences or prose
    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd <= jsonStart) throw new Error('no JSON object in response')
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1))
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      summary: parsed.summary ?? '',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
    }
  } catch {
    return { score: 0, summary: 'Could not parse AI response.', strengths: [], concerns: [] }
  }
}

export async function POST(req: Request) {
  try {
    return await handle(req)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(`ai-match crashed: ${msg}`, { status: 500 })
  }
}

async function handle(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response('ANTHROPIC_API_KEY is not set in environment variables', { status: 500 })
  }

  const body = await req.json()
  const { jobId, stage } = body
  if (!jobId) return new Response('Missing jobId', { status: 400 })

  // Auth — admin only
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: string }>()
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const db = adminClient()

  // ─── Batch Haiku triage — each request scores exactly 25 candidates (1 Haiku call) ───
  if (stage === 'triage' || !stage) {
    const { candidateIds, videoCandidateIds } = body
    const hasRegular = Array.isArray(candidateIds) && candidateIds.length > 0
    const hasVideo = Array.isArray(videoCandidateIds) && videoCandidateIds.length > 0
    if (!hasRegular && !hasVideo) return new Response('Missing candidate IDs', { status: 400 })

    const { data: job } = await db.from('job_requirements').select('*').eq('id', jobId).single()
    if (!job) return new Response('Job not found', { status: 404 })

    const pool: Record<string, unknown>[] = []
    const sourceOf: Record<string, 'profile' | 'video'> = {}

    if (hasRegular) {
      const { data } = await db
        .from('candidate_profiles')
        .select('id, current_job_title, location, fields_worked_in, employment_type, languages, roles_seeking, years_experience')
        .in('id', candidateIds)
      for (const c of data ?? []) { sourceOf[c.id] = 'profile'; pool.push(c) }
    }
    if (hasVideo) {
      const { data } = await db
        .from('video_candidates')
        .select('id, current_job_title, location, fields_worked_in, employment_type')
        .in('id', videoCandidateIds)
      for (const c of data ?? []) { sourceOf[c.id] = 'video'; pool.push(c) }
    }

    // Single Haiku call for the whole pool (caller sends ≤25 candidates per request)
    const scoreMap = await triageBatch(pool, job)

    // Cache triage scores (best effort — scoring already succeeded even if this fails)
    if (Object.keys(scoreMap).length > 0) {
      try {
        await db.from('candidate_ai_scores').upsert(
          Object.entries(scoreMap).map(([candidateId, score]) => ({
            job_id: jobId,
            candidate_id: candidateId,
            source: sourceOf[candidateId] ?? 'profile',
            score,
            summary: null,
            strengths: [],
            concerns: [],
            triage_only: true,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: 'job_id,candidate_id' },
        )
      } catch { /* cache failure is non-fatal */ }
    }

    return Response.json({
      results: Object.entries(scoreMap).map(([candidateId, score]) => ({ candidateId, score })),
    })
  }

  // ─── Deep single — Sonnet full analysis on one candidate, on demand ───
  if (stage === 'deep_single') {
    const { data: job } = await db.from('job_requirements').select('*').eq('id', jobId).single()
    if (!job) return new Response('Job not found', { status: 404 })
    const { candidateId, source } = body
    if (!candidateId) return new Response('Missing candidateId', { status: 400 })

    let candidate: Record<string, unknown> | null = null
    let resumeText: string | null = null
    let transcript: string | null = null

    if (source === 'video') {
      const { data } = await db
        .from('video_candidates')
        .select('id, name, location, current_job_title, fields_worked_in, employment_type, transcript')
        .eq('id', candidateId)
        .single()
      if (!data) return new Response('Candidate not found', { status: 404 })
      transcript = data.transcript ?? null
      candidate = {
        current_job_title: data.current_job_title,
        location: data.location,
        fields_worked_in: data.fields_worked_in ?? [],
        employment_type: data.employment_type ?? [],
        languages: null, roles_seeking: null, years_experience: null,
        education_level: null, tools_software: null,
        us_hours_comfortable: null, remote_experience: null,
      }
    } else {
      const [{ data: cp }, { data: videos }] = await Promise.all([
        db.from('candidate_profiles').select('*').eq('id', candidateId).single(),
        db.from('videos').select('transcript').eq('candidate_id', candidateId)
          .not('transcript', 'is', null).order('created_at', { ascending: false }).limit(1),
      ])
      if (!cp) return new Response('Candidate not found', { status: 404 })
      candidate = cp
      resumeText = cp.resume_url ? await getResumeText(cp.resume_url) : null
      transcript = videos?.[0]?.transcript ?? null
    }

    if (!candidate) return new Response('Candidate not found', { status: 404 })
    const result = await scoreCandidate(candidate, job, resumeText, transcript)

    // Don't cache failures as real scores — surface them so the client keeps the triage score
    if (result.summary.startsWith('AI error:') || result.summary === 'Could not parse AI response.') {
      return new Response(result.summary, { status: 502 })
    }

    // Cache full score (best effort)
    try {
      await db.from('candidate_ai_scores').upsert(
        [{
          job_id: jobId,
          candidate_id: candidateId,
          source: source ?? 'profile',
          score: result.score,
          summary: result.summary,
          strengths: result.strengths,
          concerns: result.concerns,
          triage_only: false,
          updated_at: new Date().toISOString(),
        }],
        { onConflict: 'job_id,candidate_id' },
      )
    } catch { /* cache failure is non-fatal */ }

    return Response.json({ candidateId, ...result })
  }

  return new Response(`Unknown stage: ${stage}`, { status: 400 })
}

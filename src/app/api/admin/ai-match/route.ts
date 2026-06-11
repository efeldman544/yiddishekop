import { createClient } from '@/lib/supabase/server'
import { createClient as adminSupabase } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { PDFParse } from 'pdf-parse'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function adminClient() {
  return adminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function getResumeText(resumeUrl: string): Promise<string | null> {
  try {
    const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resumes/`
    const storagePath = resumeUrl.startsWith(storageBase) ? resumeUrl.slice(storageBase.length) : null
    if (!storagePath) return null
    const supabase = adminClient()
    const { data } = await supabase.storage.from('resumes').download(storagePath)
    if (!data) return null
    const buffer = Buffer.from(await data.arrayBuffer())
    const parser = new PDFParse({ data: buffer })
    const result = await parser.getText()
    return result.text.slice(0, 6000).trim() || null
  } catch {
    return null
  }
}

async function scoreCandidate(
  candidate: any,
  job: any,
  resumeText: string | null,
  transcript: string | null,
): Promise<{ score: number; summary: string; strengths: string[]; concerns: string[] }> {
  const prompt = `You are a senior recruiter at a staffing agency evaluating whether a candidate is genuinely right for a job opening. Your goal is accurate fit assessment — not keyword matching.

═══ STEP 1: CHECK HARD CONSTRAINTS ═══
Evaluate these before anything else. A violated hard constraint caps the score.

1. LOCATION: Read the job description carefully. If the job says "on-site", "in-office", or names a specific city/country, the candidate MUST be in that location. If they are not → score cannot exceed 20 regardless of other qualifications. Be strict: Jerusalem/Israel ≠ New York, London, Montreal, etc.

2. EMPLOYMENT TYPE: If the job specifies Full Time and the candidate only wants Part Time (or vice versa), that is a hard mismatch → score cannot exceed 35.

3. LANGUAGES: If the job requires a specific language the candidate doesn't have → score cannot exceed 40.

═══ STEP 2: EVALUATE GENUINE FIT ═══
Only if hard constraints are met, assess the real substance of fit:

- Read what the job actually DOES — not just the title. "Donor Relations" means fundraising, nonprofit stakeholder management, donor stewardship. It is NOT the same as customer service or customer relations even though both have the word "relations". Reason about what the role requires.
- Look at what the candidate has actually DONE in their career — their real experience, not surface-level title similarity.
- Use the resume and interview transcript as primary evidence of capability. If those aren't available, be more conservative.
- A candidate with tangentially related experience should score 40-55, not 70+.

═══ SCORING GUIDE ═══
90-100: Exceptional match — direct relevant experience, meets all requirements
75-89:  Strong match — solid relevant background, minor gaps only
55-74:  Reasonable fit — related experience but meaningful gaps
35-54:  Stretch — tangential relevance, significant gaps
0-34:   Poor fit, OR a hard constraint is violated (location/type/language)

JOB OPENING:
Title: ${job.job_title}
Employment Type: ${job.employment_type ?? 'Not specified'}
Location/On-site requirement: ${job.description?.match(/on.?site|in.?office|in.?person|jerusalem|israel|new york|remote|hybrid/gi)?.join(', ') ?? 'See description'}
Languages Required: ${job.languages ?? 'Not specified'}
Salary: ${job.salary ?? 'Not specified'}
Hours: ${job.hours ?? 'Not specified'}
Description: ${job.description ?? 'Not specified'}

CANDIDATE PROFILE:
Name/Title: ${candidate.current_job_title ?? 'Unknown'}
Location: ${candidate.location ?? 'Unknown'}
Fields Worked In: ${(candidate.fields_worked_in ?? []).join(', ') || 'Not specified'}
Employment Types Available: ${(candidate.employment_type ?? []).join(', ') || 'Not specified'}
Languages: ${candidate.languages ?? 'Not specified'}
Roles Seeking: ${candidate.roles_seeking ?? 'Not specified'}
Years Experience: ${candidate.years_experience ?? 'Not specified'}
Education: ${candidate.education_level ?? 'Not specified'}
Tools & Software: ${candidate.tools_software ?? 'Not specified'}
US Hours Comfortable: ${candidate.us_hours_comfortable === true ? 'Yes' : candidate.us_hours_comfortable === false ? 'No' : 'Unknown'}
Remote Experience: ${candidate.remote_experience === true ? 'Yes' : candidate.remote_experience === false ? 'No' : 'Unknown'}

RESUME:
${resumeText ?? 'Not available'}

INTERVIEW TRANSCRIPT:
${transcript ? transcript.slice(0, 4000) : 'Not available'}

Think through hard constraints first, then genuine fit. Respond with JSON only — no markdown:
{
  "score": <integer 0-100>,
  "summary": "<2-3 sentences — lead with whether hard constraints are met, then genuine fit assessment>",
  "strengths": ["<specific, evidence-based strength>", ...],
  "concerns": ["<specific concern, gap, or violated constraint>", ...]
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  try {
    const parsed = JSON.parse(text)
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
  // Auth — admin only
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: string }>()
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const { jobId, candidateIds, videoCandidateIds } = await req.json()
  const hasRegular = Array.isArray(candidateIds) && candidateIds.length > 0
  const hasVideo = Array.isArray(videoCandidateIds) && videoCandidateIds.length > 0
  if (!jobId || (!hasRegular && !hasVideo)) {
    return new Response('Missing jobId or candidate IDs', { status: 400 })
  }

  const db = adminClient()

  const { data: job } = await db.from('job_requirements').select('*').eq('id', jobId).single()
  if (!job) return new Response('Job not found', { status: 404 })

  const BATCH = 5
  const results: { candidateId: string; score: number; summary: string; strengths: string[]; concerns: string[] }[] = []

  // --- Regular candidates (candidate_profiles + videos table for transcript) ---
  if (hasRegular) {
    const { data: candidates } = await db
      .from('candidate_profiles')
      .select('*, profiles(email)')
      .in('id', candidateIds)

    if (candidates?.length) {
      const { data: videos } = await db
        .from('videos')
        .select('candidate_id, transcript')
        .in('candidate_id', candidateIds)
        .not('transcript', 'is', null)
        .order('created_at', { ascending: false })

      const transcriptMap: Record<string, string> = {}
      for (const v of videos ?? []) {
        if (!transcriptMap[v.candidate_id]) transcriptMap[v.candidate_id] = v.transcript
      }

      for (let i = 0; i < candidates.length; i += BATCH) {
        const batch = candidates.slice(i, i + BATCH)
        const batchResults = await Promise.all(
          batch.map(async (c) => {
            const resumeText = c.resume_url ? await getResumeText(c.resume_url) : null
            const transcript = transcriptMap[c.id] ?? null
            const aiResult = await scoreCandidate(c, job, resumeText, transcript)
            return { candidateId: c.id, ...aiResult }
          })
        )
        results.push(...batchResults)
      }
    }
  }

  // --- Video-only candidates (transcript stored directly on video_candidates) ---
  if (hasVideo) {
    const { data: videoCandidates } = await db
      .from('video_candidates')
      .select('id, name, location, current_job_title, fields_worked_in, employment_type, transcript')
      .in('id', videoCandidateIds)

    if (videoCandidates?.length) {
      for (let i = 0; i < videoCandidates.length; i += BATCH) {
        const batch = videoCandidates.slice(i, i + BATCH)
        const batchResults = await Promise.all(
          batch.map(async (vc) => {
            const profileShape = {
              current_job_title: vc.current_job_title,
              location: vc.location,
              fields_worked_in: vc.fields_worked_in ?? [],
              employment_type: vc.employment_type ?? [],
              languages: null, roles_seeking: null, years_experience: null,
              education_level: null, tools_software: null,
              us_hours_comfortable: null, remote_experience: null,
            }
            const aiResult = await scoreCandidate(profileShape, job, null, vc.transcript ?? null)
            return { candidateId: vc.id, ...aiResult }
          })
        )
        results.push(...batchResults)
      }
    }
  }

  return Response.json({ results })
}

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
Fields Worked In: ${(candidate.fields_worked_in ?? []).join(', ') || 'Not specified'}
Employment Types Available: ${(candidate.employment_type ?? []).join(', ') || 'Not specified'}
Languages: ${candidate.languages ?? 'Not specified'}
Roles Seeking: ${candidate.roles_seeking ?? 'Not specified'}
Years Experience: ${candidate.years_experience ?? 'Unknown'}
Education: ${candidate.education_level ?? 'Unknown'}
Tools & Software: ${candidate.tools_software ?? 'Not specified'}
Remote Experience: ${candidate.remote_experience === true ? 'Yes' : candidate.remote_experience === false ? 'No' : 'Unknown'}

━━━ RESUME ━━━
${resumeText ?? '(Not provided — rely on profile fields above)'}

━━━ INTERVIEW TRANSCRIPT ━━━
${transcript ? transcript.slice(0, 5000) : '(Not provided — rely on profile fields and resume)'}

━━━ INSTRUCTIONS ━━━
Output a single JSON object. The fields BEFORE "score" force you to reason correctly before you commit to a number.

1. job_work_arrangement: Read the full description. Default is "remote" unless the description explicitly says otherwise. Only set "on-site" if the description clearly requires in-person presence (e.g. "in our office", "must commute", "on-site in [city]", "in-person"). Set "hybrid" only if explicitly stated. If the description is silent on location, output "remote".

2. job_required_location: Only if on-site or hybrid AND a specific city/country is named. Null for remote or if no location is specified.

3. job_core_function: In 1-2 sentences, what does this person ACTUALLY DO day-to-day? Go beyond the title — explain the real work.

4. candidate_location_match: true if remote (location doesn't matter), true if candidate is in the required location, false only if the job is explicitly on-site and candidate is clearly elsewhere. Default to true when arrangement is remote.

5. candidate_actual_experience: In 1-2 sentences, what has this candidate ACTUALLY DONE based on resume and transcript? Be specific about real work, not just job titles.

6. score: Integer 0-100. Apply these hard caps STRICTLY:
   - On-site job + candidate NOT in required location → score MUST be ≤ 20
   - Employment type mismatch (e.g. job is Full Time, candidate only wants Part Time) → score MUST be ≤ 35
   - "Similar-sounding" titles are NOT the same role. Donor relations ≠ customer service. Fundraising coordinator ≠ sales rep. Score based on actual overlap in what the person does.
   Scale: 85-100 direct fit, 65-84 strong, 45-64 related with gaps, 25-44 stretch, 0-24 poor or constraint violated.

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

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
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

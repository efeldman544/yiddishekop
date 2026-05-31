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
  const prompt = `You are an expert recruitment specialist for a staffing agency. Evaluate how well this candidate matches the job opening. Be concise but insightful — go beyond keyword matching and reason about actual fit based on their experience, communication style in the interview, and resume depth.

JOB OPENING:
Title: ${job.job_title}
Employment Type: ${job.employment_type ?? 'Not specified'}
Languages Required: ${job.languages ?? 'Not specified'}
Salary: ${job.salary ?? 'Not specified'}
Hours: ${job.hours ?? 'Not specified'}
Description: ${job.description ?? 'Not specified'}

CANDIDATE PROFILE:
Current Title: ${candidate.current_job_title ?? 'Unknown'}
Location: ${candidate.location ?? 'Unknown'}
Fields: ${(candidate.fields_worked_in ?? []).join(', ') || 'Not specified'}
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

Respond with a JSON object only — no markdown, no explanation outside the JSON:
{
  "score": <integer 0-100>,
  "summary": "<2-3 sentence assessment>",
  "strengths": ["<specific strength>", ...],
  "concerns": ["<specific concern or gap>", ...]
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

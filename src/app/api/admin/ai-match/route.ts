import { createClient } from '@/lib/supabase/server'
import { createClient as adminSupabase } from '@supabase/supabase-js'
import { describeAiFailure } from '@/lib/ai/models'
import { fallbackHash, fallbackText, loadCardInputs, type Source } from '@/lib/candidateCard'
import { isMissingSchema } from '@/lib/matchPool'
import { loadFreshScores, scoringTexts, storeScores, type ScoreRow } from '@/lib/matchStore'
import { analyseCandidate, jobHash, scoreBatch, type Job } from '@/lib/matchScoring'
import { loadResume } from '@/lib/resumeContent'

export const maxDuration = 60

// Matching, in three calls the admin screen makes:
//
//   load         the scores for a job that are still current
//   score        score a batch of candidates against the job, from their cards
//   deep_single  the full write-up for one candidate, on request
//
// A score is current when it was made from this version of the job and this
// version of the candidate's card. Both are recorded on the score, which is
// what lets a job be re-scored only when it changed and a candidate only when
// their card did, instead of everything or nothing.

function adminClient() {
  return adminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(req: Request) {
  try {
    return await handle(req)
  } catch (err: unknown) {
    console.error('ai-match failed:', err)
    return new Response(describeAiFailure(err), { status: 500 })
  }
}

async function handle(req: Request) {
  const body = await req.json().catch(() => null)
  const jobId: string | undefined = body?.jobId
  const stage: string = body?.stage ?? 'load'
  if (!jobId) return new Response('Missing jobId', { status: 400 })

  // Admin only. Every stage after "load" spends money.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: string }>()
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const db = adminClient()
  const { data: job } = await db.from('job_requirements').select('*').eq('id', jobId).maybeSingle<Job>()
  if (!job) return new Response('Job not found', { status: 404 })
  const currentJobHash = jobHash(job)

  // ─── load: the scores that are still current ───
  if (stage === 'load') {
    const { scores, tracked } = await loadFreshScores(db, jobId, currentJobHash)
    return Response.json({ scores, tracked })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response('ANTHROPIC_API_KEY is not set in the environment variables.', { status: 500 })
  }

  // ─── score: one batch of candidates, from their cards ───
  if (stage === 'score') {
    const candidates: { id: string; source: Source }[] = (Array.isArray(body.candidates) ? body.candidates : [])
      .filter((c: { id?: unknown; source?: unknown }) => typeof c?.id === 'string' && (c.source === 'profile' || c.source === 'video'))
    if (candidates.length === 0) return new Response('Missing candidates', { status: 400 })
    if (candidates.length > 30) return new Response('Too many candidates in one batch', { status: 400 })

    const texts = await scoringTexts(db, candidates)
    const scorable = candidates.filter(c => texts.has(c.id))
    if (scorable.length === 0) return Response.json({ results: [], unscored: candidates.map(c => c.id), usd: 0 })

    const { scores, usage } = await scoreBatch(job, scorable.map(c => texts.get(c.id)!.text))

    const now = new Date().toISOString()
    const rows: ScoreRow[] = []
    scorable.forEach((c, i) => {
      const score = scores[i]
      if (score == null) return
      rows.push({
        job_id: jobId, candidate_id: c.id, source: c.source, score,
        summary: null, strengths: [], concerns: [], triage_only: true, updated_at: now,
        job_hash: currentJobHash, card_hash: texts.get(c.id)!.hash,
      })
    })
    // Scoring already succeeded, so a failed write costs the cache, not the
    // result — but it must be said, or the same scores are bought again on
    // every visit with nothing to show why.
    const storeError = await storeScores(db, rows)
    if (storeError) console.error('could not store scores:', storeError)

    const scored = new Set(rows.map(r => r.candidate_id))
    return Response.json({
      results: rows.map(r => ({ candidateId: r.candidate_id, score: r.score })),
      unscored: candidates.filter(c => !scored.has(c.id)).map(c => c.id),
      usd: usage.usd,
      storeError,
    })
  }

  // ─── deep_single: the full write-up for one candidate ───
  if (stage === 'deep_single') {
    const candidateId: string | undefined = body.candidateId
    const source: Source = body.source === 'video' ? 'video' : 'profile'
    if (!candidateId) return new Response('Missing candidateId', { status: 400 })

    const inputs = await loadCardInputs(db, candidateId, source)
    if (!inputs.exists) return new Response('Candidate not found', { status: 404 })

    const cardRow = await db.from('candidate_cards')
      .select('card_text, card_hash, resume_text')
      .eq('candidate_id', candidateId).eq('source', source)
      .maybeSingle<{ card_text: string; card_hash: string; resume_text: string | null }>()
    if (cardRow.error && !isMissingSchema(cardRow.error.message)) throw new Error(cardRow.error.message)

    let cardText: string
    let cardHash: string
    let resumeText: string | null
    if (cardRow.data) {
      cardText = cardRow.data.card_text
      cardHash = cardRow.data.card_hash
      resumeText = cardRow.data.resume_text
    } else {
      // No card: read the resume now, the way this always worked. Only text
      // can be read this way — a photographed resume needs its card built.
      cardText = fallbackText(inputs.fields)
      cardHash = fallbackHash(inputs.fields)
      const resume = await loadResume(db, inputs.resumeUrl)
      resumeText = resume.kind === 'text' ? resume.text : null
    }

    const { result, usage } = await analyseCandidate(job, { cardText, resumeText, transcript: inputs.transcript })

    const storeError = await storeScores(db, [{
      job_id: jobId, candidate_id: candidateId, source, score: result.score,
      summary: result.summary, strengths: result.strengths, concerns: result.concerns,
      triage_only: false, updated_at: new Date().toISOString(),
      job_hash: currentJobHash, card_hash: cardHash,
    }])
    if (storeError) console.error('could not store analysis:', storeError)

    return Response.json({ candidateId, ...result, usd: usage.usd, storeError })
  }

  return new Response(`Unknown stage: ${stage}`, { status: 400 })
}

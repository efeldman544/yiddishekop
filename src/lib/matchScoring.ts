import type Anthropic from '@anthropic-ai/sdk'
import { DEEP_MODEL, SCORE_MODEL, AiError, costUsd, getAnthropic, readJson } from '@/lib/ai/models'
import { shortHash } from '@/lib/candidateCard'

// SERVER ONLY.
//
// The two questions matching asks: how well does each of these candidates fit
// this job (many at once, cheaply, from their cards), and what exactly is the
// case for and against this one (one at a time, on request, from everything).

type Client = { messages: Pick<Anthropic['messages'], 'create'> }

export type Job = Record<string, unknown> & { id: string }

const JOB_MAX_CHARS = 20_000

/**
 * A fingerprint of the parts of a job the prompts read. A score records it,
 * so a score made from an older version of the job can be told apart from a
 * current one — editing a description used to leave every cached score in
 * place, describing a job that no longer existed.
 */
export function jobHash(job: Job): string {
  return shortHash(JSON.stringify([
    job.job_title ?? '', job.employment_type ?? '', job.languages ?? '',
    job.description ?? '', job.hours ?? '', job.salary ?? '',
  ]))
}

function jobBlock(job: Job): string {
  const description = String(job.description ?? '').trim()
  return [
    `Title: ${job.job_title ?? '(untitled)'}`,
    `Employment type: ${job.employment_type ?? 'Not specified'}`,
    `Hours per week: ${job.hours ?? 'Not specified'}`,
    `Languages required: ${job.languages ?? 'Not specified'}`,
    `Salary: ${job.salary ?? 'Not specified'}`,
    'Description:',
    description ? description.slice(0, JOB_MAX_CHARS) : '(No description provided)',
  ].join('\n')
}

const SCALE = '85-100 direct fit, 65-84 strong, 45-64 related with gaps, 25-44 stretch, 0-24 poor'

const SCORE_SYSTEM = `You are a recruiter ranking candidates for one job. You are given the job and a numbered list of candidate cards. Each card summarises what a candidate's resume, interview and profile show. Score every candidate from 0 to 100 on how well they fit the job.

How to judge:
- Judge by what the person has actually done, as the card describes it. A similar-sounding title is not the same role.
- Evidence counts for more than claims. Work described in a role held counts for more than a skill merely listed.
- The job is remote unless its description explicitly requires being somewhere in person. For a remote job, where the candidate lives does not matter. If the job is explicitly on-site in a named place and the candidate is clearly elsewhere, score 20 or below.
- If the job states an employment type and the candidate is only available for a different one, score 35 or below.
- If the job requires a language the card gives no sign of, treat that as a serious gap.
- Some cards are marked "Profile fields only". Their resume has not been read yet. Score them on what is there. Do not mark them down for the missing resume itself, but do not assume experience the card does not show.
- Use the whole scale: ${SCALE}. Two candidates should get the same score only if you really cannot separate them.

Return one entry for every candidate number you were given, and no others.`

const SCORE_SCHEMA = {
  type: 'object',
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object',
        properties: { n: { type: 'integer' }, score: { type: 'integer' } },
        required: ['n', 'score'],
        additionalProperties: false,
      },
    },
  },
  required: ['scores'],
  additionalProperties: false,
}

export type Usage = { model: string; inputTokens: number; outputTokens: number; usd: number }

function usageOf(model: string, message: Anthropic.Message): Usage {
  const { input_tokens, output_tokens } = message.usage
  return { model, inputTokens: input_tokens, outputTokens: output_tokens, usd: costUsd(model, input_tokens, output_tokens) }
}

const clamp = (n: unknown) => Math.min(100, Math.max(0, Math.round(Number(n) || 0)))

/**
 * Score a batch of candidates against a job, in one call.
 *
 * Candidates are numbered rather than identified by their database ids. A
 * UUID is some twenty tokens to send and twenty more to get back, per
 * candidate, and a model copying thirty-six characters will now and then get
 * one wrong, at which point that score belongs to nobody.
 *
 * Returns a score per input, in order, with null where the model didn't give
 * one. A missing score is left missing — reported as zero it would look like a
 * verdict on the candidate rather than a hole in the answer.
 */
export async function scoreBatch(
  job: Job,
  cardTexts: string[],
  client: Client = getAnthropic(),
): Promise<{ scores: (number | null)[]; usage: Usage }> {
  const candidates = cardTexts.map((text, i) => `--- Candidate ${i + 1} ---\n${text}`).join('\n\n')
  const message = await client.messages.create({
    model: SCORE_MODEL,
    // Thinking counts toward this, so a cap sized for the list of numbers
    // alone would be spent before the answer started.
    max_tokens: 8_000,
    system: SCORE_SYSTEM,
    messages: [{
      role: 'user',
      content: `=== JOB ===\n${jobBlock(job)}\n\n=== CANDIDATES ===\n${candidates}`,
    }],
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCORE_SCHEMA } },
  })
  const parsed = readJson<{ scores: { n: number; score: number }[] }>(message)

  const scores: (number | null)[] = cardTexts.map(() => null)
  for (const entry of parsed.scores ?? []) {
    const index = Number(entry?.n) - 1
    if (Number.isInteger(index) && index >= 0 && index < scores.length) scores[index] = clamp(entry.score)
  }
  return { scores, usage: usageOf(SCORE_MODEL, message) }
}

const DEEP_SYSTEM = `You are a recruiter writing up one candidate for one job, for a colleague who will decide whether to put them in front of the employer. You have the job, the candidate's card, their full resume and their interview transcript. Work from that evidence only.

Fill in the fields in order. The ones before "score" are there so that you settle the facts before committing to a number.

- job_work_arrangement: "remote" unless the description explicitly requires being somewhere in person; "hybrid" only if it says so.
- job_required_location: the place, only when the job is on-site or hybrid and names one. Otherwise "".
- job_core_function: one or two sentences on what this person would actually do day to day.
- candidate_location_match: true for a remote job, true if the candidate is in the required place, false only when the job is explicitly on-site and the candidate is clearly elsewhere.
- candidate_actual_experience: one or two sentences on what this candidate has actually done, from the resume and transcript.
- score: 0 to 100. On-site job and candidate not in the required place: 20 or below. Employment type mismatch: 35 or below. Otherwise ${SCALE}.
- summary: two or three sentences. Say whether any location or hours requirement is met, then how well they really fit.
- strengths: specific points, each backed by something in the resume, transcript or card.
- concerns: specific gaps, mismatches or things to check. Empty if there are none worth raising.

Do not include the candidate's name or contact details in anything you write.`

const DEEP_SCHEMA = {
  type: 'object',
  properties: {
    job_work_arrangement: { type: 'string', enum: ['remote', 'on-site', 'hybrid', 'unspecified'] },
    job_required_location: { type: 'string' },
    job_core_function: { type: 'string' },
    candidate_location_match: { type: 'boolean' },
    candidate_actual_experience: { type: 'string' },
    score: { type: 'integer' },
    summary: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    concerns: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'job_work_arrangement', 'job_required_location', 'job_core_function', 'candidate_location_match',
    'candidate_actual_experience', 'score', 'summary', 'strengths', 'concerns',
  ],
  additionalProperties: false,
}

export type DeepResult = { score: number; summary: string; strengths: string[]; concerns: string[] }

const DEEP_TEXT_MAX_CHARS = 60_000

/** The full write-up for one candidate: whole resume, whole transcript. */
export async function analyseCandidate(
  job: Job,
  candidate: { cardText: string; resumeText: string | null; transcript: string | null },
  client: Client = getAnthropic(),
): Promise<{ result: DeepResult; usage: Usage }> {
  const resume = candidate.resumeText?.trim().slice(0, DEEP_TEXT_MAX_CHARS)
  const transcript = candidate.transcript?.trim().slice(0, DEEP_TEXT_MAX_CHARS)
  const message = await client.messages.create({
    model: DEEP_MODEL,
    max_tokens: 8_000,
    system: DEEP_SYSTEM,
    messages: [{
      role: 'user',
      content: [
        `=== JOB ===\n${jobBlock(job)}`,
        `=== CANDIDATE CARD ===\n${candidate.cardText}`,
        `=== RESUME ===\n${resume || '(No readable resume on file. Rely on the card and transcript.)'}`,
        `=== INTERVIEW TRANSCRIPT ===\n${transcript || '(No transcript on file. Rely on the card and resume.)'}`,
      ].join('\n\n'),
    }],
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: DEEP_SCHEMA } },
  })
  const parsed = readJson<DeepResult>(message)
  if (typeof parsed.summary !== 'string' || !parsed.summary.trim()) {
    throw new AiError('The AI returned an analysis with no summary.')
  }
  return {
    result: {
      score: clamp(parsed.score),
      summary: parsed.summary,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
    },
    usage: usageOf(DEEP_MODEL, message),
  }
}

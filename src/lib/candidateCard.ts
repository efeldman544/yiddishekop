import { createHash } from 'node:crypto'
import type Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { CARD_MODEL, IMAGE_MODEL, costUsd, getAnthropic, readJson } from '@/lib/ai/models'
import { loadResume, type ResumeContent } from '@/lib/resumeContent'

// SERVER ONLY.
//
// A candidate card: everything matching needs to know about one person, read
// once and kept.
//
// The old matching scored every candidate on eight profile fields and opened
// a resume only when an admin clicked Analyze on that one person. So the
// ranking of five hundred people was made without a single resume, and
// somebody with a thin profile and an excellent resume sat at the bottom
// until somebody happened to click on them.
//
// A card is built when a resume, transcript or profile changes — one call per
// candidate, not one per candidate per job — and every job is then scored
// against cards. The full resume text is stored beside it, so the deep
// analysis never downloads or parses a file either.

export type Source = 'profile' | 'video'

/** The profile fields a card and its fallback are made from. */
export type CandidateFields = {
  current_job_title: string | null
  location: string | null
  fields_worked_in: string[] | null
  employment_type: string[] | null
  languages: string | null
  roles_seeking: string | null
  years_experience: string | null
  education_level: string | null
  tools_software: string | null
  us_hours_comfortable: boolean | null
  remote_experience: boolean | null
}

export type Card = {
  headline: string
  summary: string
  roles: { title: string; where: string; duration: string; did: string }[]
  skills: string[]
  tools: string[]
  industries: string[]
  languages: string[]
  education: string
  experience_total: string
  availability: string
  location: string
  strengths: string[]
  unclear: string[]
}

export type ResumeStatus = 'text' | 'image' | 'none' | 'unreadable'

type MessagesApi = Pick<Anthropic['messages'], 'create' | 'countTokens'>
type Client = { messages: MessagesApi }

const TRANSCRIPT_MAX_CHARS = 60_000

export function shortHash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16)
}

const FIELD_KEYS: (keyof CandidateFields)[] = [
  'current_job_title', 'location', 'fields_worked_in', 'employment_type', 'languages',
  'roles_seeking', 'years_experience', 'education_level', 'tools_software',
  'us_hours_comfortable', 'remote_experience',
]

export function pickFields(row: Record<string, unknown> | null | undefined): CandidateFields {
  const r = row ?? {}
  return {
    current_job_title: (r.current_job_title as string) ?? null,
    location: (r.location as string) ?? null,
    fields_worked_in: (r.fields_worked_in as string[]) ?? null,
    employment_type: (r.employment_type as string[]) ?? null,
    languages: (r.languages as string) ?? null,
    roles_seeking: (r.roles_seeking as string) ?? null,
    years_experience: (r.years_experience as string) ?? null,
    education_level: (r.education_level as string) ?? null,
    tools_software: (r.tools_software as string) ?? null,
    us_hours_comfortable: (r.us_hours_comfortable as boolean) ?? null,
    remote_experience: (r.remote_experience as boolean) ?? null,
  }
}

/**
 * A fingerprint of what a card would be built from.
 *
 * Made only from things a cheap query returns — the profile fields, the
 * resume's address, and which interview recording has a transcript — so that
 * checking five hundred candidates for stale cards doesn't mean downloading
 * five hundred resumes. The one thing it can't see is a resume replaced under
 * the same filename, which keeps the same address; the places that upload a
 * resume force a rebuild for that reason.
 */
export function sourceHash(
  source: Source,
  fields: CandidateFields,
  resumeUrl: string | null,
  transcriptMarker: string,
): string {
  const ordered = FIELD_KEYS.map(k => fields[k] ?? null)
  return shortHash(JSON.stringify([source, ordered, resumeUrl ?? '', transcriptMarker]))
}

function line(label: string, value: string | null | undefined): string | null {
  const v = (value ?? '').trim()
  return v ? `${label}: ${v}` : null
}

function profileLines(f: CandidateFields): string[] {
  return [
    line('Current title', f.current_job_title),
    line('Location', f.location),
    line('Fields worked in', (f.fields_worked_in ?? []).join(', ')),
    line('Employment types wanted', (f.employment_type ?? []).join(', ')),
    line('Languages', f.languages),
    line('Roles seeking', f.roles_seeking),
    line('Years of experience', f.years_experience),
    line('Education', f.education_level),
    line('Tools and software', f.tools_software),
    f.us_hours_comfortable == null ? null : `Works US hours: ${f.us_hours_comfortable ? 'yes' : 'no'}`,
    f.remote_experience == null ? null : `Has worked remotely: ${f.remote_experience ? 'yes' : 'no'}`,
  ].filter((l): l is string => !!l)
}

/**
 * What a candidate is scored on before they have a card.
 *
 * It says so in its first line, because the scorer should know it is looking
 * at somebody whose resume hasn't been read rather than somebody with nothing
 * to show.
 */
export function fallbackText(fields: CandidateFields): string {
  const lines = profileLines(fields)
  return [
    '(Profile fields only. This candidate’s resume has not been read yet.)',
    ...(lines.length ? lines : ['No profile details given.']),
  ].join('\n')
}

/** The hash a score records for a candidate scored on the fallback. */
export function fallbackHash(fields: CandidateFields): string {
  return `f:${shortHash(fallbackText(fields))}`
}

const list = (label: string, items: string[] | undefined) =>
  items && items.length ? `${label}: ${items.join(', ')}` : null

/** The compact text of a card, which is what every job is scored against. */
export function renderCardText(card: Card): string {
  const roles = (card.roles ?? [])
    .map(r => `- ${r.title}${r.where ? `, ${r.where}` : ''}${r.duration ? ` (${r.duration})` : ''}: ${r.did}`)
  return [
    card.headline,
    card.summary,
    roles.length ? `Roles held:\n${roles.join('\n')}` : null,
    list('Skills', card.skills),
    list('Tools', card.tools),
    list('Industries', card.industries),
    list('Languages', card.languages),
    line('Education', card.education),
    line('Total experience', card.experience_total),
    line('Availability', card.availability),
    line('Location', card.location),
    list('Evidence of strength', card.strengths),
    list('Unclear or missing', card.unclear),
  ].filter((l): l is string => !!l).join('\n')
}

const STRINGS = { type: 'array', items: { type: 'string' } }

function cardSchema(withTranscription: boolean) {
  const properties: Record<string, unknown> = {
    ...(withTranscription ? { resume_transcription: { type: 'string' } } : {}),
    headline: { type: 'string' },
    summary: { type: 'string' },
    roles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' }, where: { type: 'string' },
          duration: { type: 'string' }, did: { type: 'string' },
        },
        required: ['title', 'where', 'duration', 'did'],
        additionalProperties: false,
      },
    },
    skills: STRINGS, tools: STRINGS, industries: STRINGS, languages: STRINGS,
    education: { type: 'string' },
    experience_total: { type: 'string' },
    availability: { type: 'string' },
    location: { type: 'string' },
    strengths: STRINGS,
    unclear: STRINGS,
  }
  return {
    type: 'object',
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  }
}

const CARD_INSTRUCTIONS = `You are preparing a candidate card for a recruiting team that places remote staff with small businesses. The card is what every future job will be matched against, so it must carry everything in the resume and interview that bears on what work this person can do.

Work only from what you are given: the resume, the interview transcript, and the profile fields the candidate filled in. Where they disagree, trust the resume and transcript over the profile fields. Do not invent or assume anything; when something is not stated, leave it out or list it under "unclear".

Leave out the candidate's name, email, phone number, street address and links. The card is about their work, not who they are.

Fields:
- headline: one line saying what this person is, in terms of the work they do. Example: "Bookkeeper with six years in property management, QuickBooks and Yardi".
- summary: three to five sentences on what they have actually done and how well the evidence supports it. Concrete, no adjectives that the evidence does not earn.
- roles: every job on the resume, most recent first. "where" is the kind of employer or its name. "duration" as stated ("2019 to 2023", "3 years"). "did" is one or two sentences on the actual duties and results.
- skills: what they can do ("accounts payable", "customer support by phone", "social media scheduling").
- tools: software and systems by name.
- industries: the kinds of business they have worked in.
- languages: each language with the level if stated.
- education: degrees, certificates, or "" if none stated.
- experience_total: total relevant working experience, as far as the evidence shows.
- availability: full time or part time, hours, US-hours availability, remote experience, as stated.
- location: city and country if stated, otherwise "".
- strengths: up to five specific things backed by evidence in the resume or transcript.
- unclear: gaps or things a recruiter would need to ask about. Empty if nothing stands out.`

const TRANSCRIPTION_INSTRUCTIONS = `

The resume is attached as an image or scanned document. First read it and put its complete text into resume_transcription, in reading order, keeping every job, date, skill and detail. This transcription is kept as the candidate's resume text, so do not summarise or shorten it. If the document cannot be read at all, set resume_transcription to an empty string and build the card from the profile fields and transcript alone.`

export type CardInputs = {
  exists: boolean
  fields: CandidateFields
  resumeUrl: string | null
  transcript: string | null
  /** Identifies the transcript without reading it: see sourceHash. */
  transcriptMarker: string
  filledIn: boolean
}

export async function loadCardInputs(db: SupabaseClient, id: string, source: Source): Promise<CardInputs> {
  if (source === 'video') {
    const { data, error } = await db
      .from('video_candidates')
      .select('id, location, current_job_title, fields_worked_in, employment_type, transcript')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    const transcript = (data?.transcript as string | null) ?? null
    return {
      exists: !!data,
      fields: pickFields(data),
      resumeUrl: null,
      transcript,
      transcriptMarker: transcript ? 'has' : '',
      filledIn: true,
    }
  }

  const [{ data: cp, error }, { data: videos }] = await Promise.all([
    db.from('candidate_profiles').select('*').eq('id', id).maybeSingle(),
    db.from('videos').select('id, transcript').eq('candidate_id', id)
      .not('transcript', 'is', null).order('created_at', { ascending: false }).limit(1),
  ])
  if (error) throw new Error(error.message)
  const fields = pickFields(cp)
  const video = videos?.[0] as { id: string; transcript: string | null } | undefined
  return {
    exists: !!cp,
    fields,
    resumeUrl: (cp?.resume_url as string | null) ?? null,
    transcript: video?.transcript ?? null,
    transcriptMarker: video?.id ?? '',
    filledIn: !!(fields.current_job_title?.trim() || fields.roles_seeking?.trim() || (fields.fields_worked_in?.length ?? 0) > 0),
  }
}

type Prepared = {
  model: string
  params: Anthropic.MessageCreateParamsNonStreaming
  resumeStatus: ResumeStatus
  resumeNote: string | null
  resumeText: string | null
  transcribes: boolean
}

/**
 * The exact request a card build would send.
 *
 * Separate from sending it so the cost estimate can count the tokens of the
 * real request — same resume, same prompt — instead of guessing from averages.
 */
export function prepareCardRequest(inputs: CardInputs, resume: ResumeContent): Prepared {
  const visual = resume.kind === 'image' || resume.kind === 'pdf-scan'
  const profile = profileLines(inputs.fields)

  let transcript = inputs.transcript?.trim() ?? ''
  let transcriptNote = ''
  if (transcript.length > TRANSCRIPT_MAX_CHARS) {
    transcript = transcript.slice(0, TRANSCRIPT_MAX_CHARS)
    transcriptNote = ' (a very long transcript; only the first part is included)'
  }

  const resumeSection =
    resume.kind === 'text' ? resume.text
    : visual ? '(Attached above as an image or scan. Read it.)'
    : resume.kind === 'unreadable' ? `(On file but could not be read: ${resume.note}. Build the card from the rest.)`
    : '(None on file. Build the card from the rest.)'

  const text = [
    '=== PROFILE FIELDS (entered by the candidate) ===',
    profile.length ? profile.join('\n') : '(none given)',
    '',
    '=== RESUME ===',
    resumeSection,
    '',
    `=== INTERVIEW TRANSCRIPT${transcriptNote} ===`,
    transcript || '(None on file.)',
  ].join('\n')

  const content: Anthropic.ContentBlockParam[] = []
  if (resume.kind === 'image') {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: resume.mediaType, data: resume.data.toString('base64') },
    })
  } else if (resume.kind === 'pdf-scan') {
    content.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: resume.data.toString('base64') },
    })
  }
  content.push({ type: 'text', text })

  const model = visual ? IMAGE_MODEL : CARD_MODEL
  return {
    model,
    transcribes: visual,
    resumeStatus: resume.kind === 'text' ? 'text' : visual ? 'image' : resume.kind === 'unreadable' ? 'unreadable' : 'none',
    resumeNote: resume.kind === 'unreadable' ? resume.note : resume.kind === 'text' ? resume.note ?? null : null,
    resumeText: resume.kind === 'text' ? resume.text : null,
    params: {
      model,
      // Room for the thinking these models do before answering, the card, and
      // for a scan the whole transcription — a cap sized for the card alone
      // would cut a two-page resume off part-way through.
      max_tokens: visual ? 12_000 : 6_000,
      system: CARD_INSTRUCTIONS + (visual ? TRANSCRIPTION_INSTRUCTIONS : ''),
      messages: [{ role: 'user', content }],
      output_config: {
        effort: 'medium',
        format: { type: 'json_schema', schema: cardSchema(visual) },
      },
    },
  }
}

export type BuildResult =
  | { status: 'built'; resumeStatus: ResumeStatus; resumeNote: string | null; model: string; inputTokens: number; outputTokens: number; usd: number }
  | { status: 'skipped'; reason: 'unchanged' | 'recent' | 'empty' }
  | { status: 'missing' }

type ExistingCard = { source_hash: string; built_at: string } | null

/**
 * Build one candidate's card and store it.
 *
 * Skips when nothing it is made from has changed, unless forced. `minIntervalMs`
 * is for the candidate's own save button: a card costs money to build and that
 * path is reachable by anybody with an account, so it won't rebuild the same
 * card twice inside the interval however often it is asked.
 */
export async function buildCard(
  db: SupabaseClient,
  id: string,
  source: Source,
  opts: { force?: boolean; minIntervalMs?: number; requireFilledIn?: boolean; client?: Client } = {},
): Promise<BuildResult> {
  const inputs = await loadCardInputs(db, id, source)
  if (!inputs.exists) return { status: 'missing' }
  if (opts.requireFilledIn && !inputs.filledIn) return { status: 'skipped', reason: 'empty' }

  const hash = sourceHash(source, inputs.fields, inputs.resumeUrl, inputs.transcriptMarker)

  const { data: existing, error: readError } = await db
    .from('candidate_cards')
    .select('source_hash, built_at')
    .eq('candidate_id', id).eq('source', source)
    .maybeSingle<NonNullable<ExistingCard>>()
  // supabase-js resolves with an error rather than throwing. Carrying on here
  // would pay for a card and then fail to store it.
  if (readError) throw new Error(readError.message)

  if (existing) {
    if (opts.minIntervalMs && Date.now() - new Date(existing.built_at).getTime() < opts.minIntervalMs) {
      return { status: 'skipped', reason: 'recent' }
    }
    if (!opts.force && existing.source_hash === hash) return { status: 'skipped', reason: 'unchanged' }
  }

  const resume = await loadResume(db, inputs.resumeUrl)
  const prepared = prepareCardRequest(inputs, resume)

  const client = opts.client ?? getAnthropic()
  const message = await client.messages.create(prepared.params)
  const raw = readJson<Card & { resume_transcription?: string }>(message)

  let resumeStatus = prepared.resumeStatus
  let resumeNote = prepared.resumeNote
  let resumeText = prepared.resumeText
  if (prepared.transcribes) {
    const transcription = (raw.resume_transcription ?? '').trim()
    if (transcription) {
      resumeText = transcription
    } else {
      resumeStatus = 'unreadable'
      resumeNote = 'the image was too poor to read'
    }
  }
  delete raw.resume_transcription
  const card: Card = raw

  const cardText = renderCardText(card)
  const inputTokens = message.usage.input_tokens
  const outputTokens = message.usage.output_tokens

  const { error: writeError } = await db.from('candidate_cards').upsert({
    candidate_id: id,
    source,
    card,
    card_text: cardText,
    card_hash: shortHash(cardText),
    resume_text: resumeText,
    resume_status: resumeStatus,
    resume_note: resumeNote,
    source_hash: hash,
    model: prepared.model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    built_at: new Date().toISOString(),
  }, { onConflict: 'candidate_id,source' })
  if (writeError) throw new Error(writeError.message)

  return {
    status: 'built',
    resumeStatus,
    resumeNote,
    model: prepared.model,
    inputTokens,
    outputTokens,
    usd: costUsd(prepared.model, inputTokens, outputTokens),
  }
}

/** Typical output for a card, used only to estimate: thinking plus the card itself. */
const EST_OUTPUT_TOKENS = { text: 1_400, visual: 3_200 }

export type Estimate =
  | { status: 'counted'; model: string; inputTokens: number; estOutputTokens: number; usd: number; resumeStatus: ResumeStatus }
  | { status: 'missing' }

/**
 * What building this card would cost, without building it.
 *
 * Input tokens are counted by the API from the real request, so that half is
 * exact. Output is an allowance, because nothing can know how much a model
 * will write before it writes it.
 */
export async function estimateCard(
  db: SupabaseClient,
  id: string,
  source: Source,
  opts: { client?: Client } = {},
): Promise<Estimate> {
  const inputs = await loadCardInputs(db, id, source)
  if (!inputs.exists) return { status: 'missing' }
  const resume = await loadResume(db, inputs.resumeUrl)
  const prepared = prepareCardRequest(inputs, resume)
  const client = opts.client ?? getAnthropic()
  const counted = await client.messages.countTokens({
    model: prepared.model,
    system: prepared.params.system,
    messages: prepared.params.messages,
  })
  const estOutputTokens = prepared.transcribes ? EST_OUTPUT_TOKENS.visual : EST_OUTPUT_TOKENS.text
  return {
    status: 'counted',
    model: prepared.model,
    inputTokens: counted.input_tokens,
    estOutputTokens,
    usd: costUsd(prepared.model, counted.input_tokens, estOutputTokens),
    resumeStatus: prepared.resumeStatus,
  }
}

import type { SupabaseClient } from '@supabase/supabase-js'
import { fallbackHash, fallbackText, pickFields, type Source } from '@/lib/candidateCard'
import { fetchAll, isMissingSchema, listPool } from '@/lib/matchPool'

// SERVER ONLY.
//
// Reading and writing match scores. Kept apart from the route so the part
// that decides whether a stored score is still current can be tested on its
// own — it is the part that decides when money gets spent.

export type ScoreRow = {
  job_id: string
  candidate_id: string
  source: Source
  score: number
  summary: string | null
  strengths: string[]
  concerns: string[]
  triage_only: boolean
  updated_at: string
  job_hash: string
  card_hash: string
}

/**
 * Store scores, without the two hash columns if the database hasn't got them.
 *
 * The app deploys the moment it merges and the SQL that adds a column is run
 * by hand afterwards. A write naming a column that isn't there yet is refused
 * whole, so without this every score would be paid for and then thrown away
 * until somebody ran the migration.
 */
export async function storeScores(db: SupabaseClient, rows: ScoreRow[]): Promise<string | null> {
  if (rows.length === 0) return null
  const first = await db.from('candidate_ai_scores').upsert(rows, { onConflict: 'job_id,candidate_id' })
  if (!first.error) return null
  if (!/job_hash|card_hash/.test(first.error.message)) return first.error.message
  const plain = rows.map(({ job_hash: _j, card_hash: _c, ...rest }) => { void _j; void _c; return rest })
  const second = await db.from('candidate_ai_scores').upsert(plain, { onConflict: 'job_id,candidate_id' })
  return second.error?.message ?? null
}

/** Each candidate's card, or what to score them on while they haven't got one. */
export async function scoringTexts(
  db: SupabaseClient,
  candidates: { id: string; source: Source }[],
): Promise<Map<string, { text: string; hash: string }>> {
  const out = new Map<string, { text: string; hash: string }>()
  const ids = candidates.map(c => c.id)

  const cards = await db.from('candidate_cards').select('candidate_id, card_text, card_hash').in('candidate_id', ids)
  // No cards table yet is not a failure: everybody is scored on their profile.
  if (cards.error && !isMissingSchema(cards.error.message)) throw new Error(cards.error.message)
  for (const c of cards.data ?? []) out.set(c.candidate_id, { text: c.card_text, hash: c.card_hash })

  const need = candidates.filter(c => !out.has(c.id))
  const profileIds = need.filter(c => c.source === 'profile').map(c => c.id)
  const videoIds = need.filter(c => c.source === 'video').map(c => c.id)

  if (profileIds.length) {
    const { data, error } = await db.from('candidate_profiles').select('*').in('id', profileIds)
    if (error) throw new Error(error.message)
    for (const row of data ?? []) {
      const fields = pickFields(row)
      out.set(row.id, { text: fallbackText(fields), hash: fallbackHash(fields) })
    }
  }
  if (videoIds.length) {
    const { data, error } = await db.from('video_candidates')
      .select('id, location, current_job_title, fields_worked_in, employment_type').in('id', videoIds)
    if (error) throw new Error(error.message)
    for (const row of data ?? []) {
      const fields = pickFields(row)
      out.set(row.id, { text: fallbackText(fields), hash: fallbackHash(fields) })
    }
  }
  return out
}


export type StoredScore = {
  score: number
  summary: string
  strengths: string[]
  concerns: string[]
  triageOnly?: boolean
}

/**
 * The stored scores for a job that are still current.
 *
 * A score is current when it was made from this version of the job and this
 * version of the candidate's card (or, for somebody without a card, these
 * profile fields). Anything else is left out, and the caller scores it again.
 *
 * `tracked` is false when the database has no hash columns yet — the SQL
 * hasn't been run. No score can be shown to be current in that state, and
 * calling them all stale would re-score every candidate on every visit and
 * pay for it each time. So a stored score is simply trusted, which is how it
 * worked before there was anything to compare.
 */
export async function loadFreshScores(
  db: SupabaseClient,
  jobId: string,
  currentJobHash: string,
): Promise<{ scores: Record<string, StoredScore>; tracked: boolean }> {
  type Cached = {
    candidate_id: string; score: number; summary: string | null
    strengths: unknown; concerns: unknown; triage_only: boolean
    job_hash?: string | null; card_hash?: string | null
  }
  let rows: Cached[]
  let tracked = true
  try {
    rows = await fetchAll<Cached>((from, to) =>
      db.from('candidate_ai_scores')
        .select('candidate_id, score, summary, strengths, concerns, triage_only, job_hash, card_hash')
        .eq('job_id', jobId).order('candidate_id').range(from, to))
  } catch (e) {
    if (!isMissingSchema(e instanceof Error ? e.message : '')) throw e
    tracked = false
    rows = await fetchAll<Cached>((from, to) =>
      db.from('candidate_ai_scores')
        .select('candidate_id, score, summary, strengths, concerns, triage_only')
        .eq('job_id', jobId).order('candidate_id').range(from, to))
  }

  let current: Map<string, string> | null = null
  if (tracked) {
    current = new Map()
    for (const entry of await listPool(db)) current.set(entry.id, fallbackHash(entry.fields))
    try {
      const cards = await fetchAll<{ candidate_id: string; card_hash: string }>((from, to) =>
        db.from('candidate_cards').select('candidate_id, card_hash').order('candidate_id').range(from, to))
      for (const c of cards) current.set(c.candidate_id, c.card_hash)
    } catch (e) {
      if (!isMissingSchema(e instanceof Error ? e.message : '')) throw e
    }
  }

  const scores: Record<string, StoredScore> = {}
  for (const r of rows) {
    if (current && (r.job_hash !== currentJobHash || r.card_hash !== current.get(r.candidate_id))) continue
    scores[r.candidate_id] = {
      score: r.score,
      summary: r.summary ?? '',
      strengths: Array.isArray(r.strengths) ? (r.strengths as string[]) : [],
      concerns: Array.isArray(r.concerns) ? (r.concerns as string[]) : [],
      triageOnly: r.triage_only || undefined,
    }
  }
  return { scores, tracked }
}

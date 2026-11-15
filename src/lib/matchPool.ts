import type { SupabaseClient } from '@supabase/supabase-js'
import { pickFields, sourceHash, type CandidateFields, type Source } from '@/lib/candidateCard'

// SERVER ONLY.
//
// Everybody matching ranks: active candidate profiles, and every video
// candidate. One place decides that, so the card status, the freshness check
// and the scorer can't each have a slightly different idea of who is in.

export type PoolEntry = {
  id: string
  source: Source
  name: string | null
  fields: CandidateFields
  resumeUrl: string | null
  /** What a card built from this candidate today would be fingerprinted as. */
  sourceHash: string
}

const PAGE = 1000

/**
 * Every row of a query, a page at a time.
 *
 * The API returns at most a thousand rows per request and says nothing when
 * it stops there, so a plain select quietly drops candidate 1,001 onwards.
 */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE) return rows
  }
}

const PROFILE_COLUMNS =
  'id, full_name, resume_url, current_job_title, location, fields_worked_in, employment_type, languages, ' +
  'roles_seeking, years_experience, education_level, tools_software, us_hours_comfortable, remote_experience'

type Row = Record<string, unknown> & { id: string }

export async function listPool(db: SupabaseClient): Promise<PoolEntry[]> {
  const [profiles, transcripts, videoCandidates, videoWithTranscript] = await Promise.all([
    fetchAll<Row>((from, to) =>
      db.from('candidate_profiles').select(PROFILE_COLUMNS).eq('status', 'active').order('id').range(from, to) as never),
    // Oldest first, so the last one seen per candidate is the newest — the
    // same recording loadCardInputs picks.
    fetchAll<{ id: string; candidate_id: string }>((from, to) =>
      db.from('videos').select('id, candidate_id').not('transcript', 'is', null)
        .order('created_at', { ascending: true }).range(from, to)),
    fetchAll<Row>((from, to) =>
      db.from('video_candidates')
        .select('id, name, location, current_job_title, fields_worked_in, employment_type')
        .order('id').range(from, to) as never),
    fetchAll<{ id: string }>((from, to) =>
      db.from('video_candidates').select('id').not('transcript', 'is', null).order('id').range(from, to)),
  ])

  const latestTranscript = new Map<string, string>()
  for (const v of transcripts) if (v.candidate_id) latestTranscript.set(v.candidate_id, v.id)
  const videoHasTranscript = new Set(videoWithTranscript.map(v => v.id))

  const pool: PoolEntry[] = []
  for (const p of profiles) {
    const fields = pickFields(p)
    const resumeUrl = (p.resume_url as string | null) ?? null
    pool.push({
      id: p.id, source: 'profile', name: (p.full_name as string | null) ?? null, fields, resumeUrl,
      sourceHash: sourceHash('profile', fields, resumeUrl, latestTranscript.get(p.id) ?? ''),
    })
  }
  for (const v of videoCandidates) {
    const fields = pickFields(v)
    pool.push({
      id: v.id, source: 'video', name: (v.name as string | null) ?? null, fields, resumeUrl: null,
      sourceHash: sourceHash('video', fields, null, videoHasTranscript.has(v.id) ? 'has' : ''),
    })
  }
  return pool
}

/** True when the error means the table or column isn't there yet — the SQL hasn't been run. */
export function isMissingSchema(message: string | undefined | null): boolean {
  return /schema cache|does not exist|could not find the/i.test(message ?? '')
}

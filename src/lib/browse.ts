import { createClient } from '@supabase/supabase-js'
import { displayTitle, cleanText } from './candidateDisplay'
import { canonicalIndustries, inferIndustry, BROWSE_INDUSTRIES } from './candidateTaxonomy'

// SERVER ONLY — uses the service-role key. Never import from a client
// component. Anonymization happens here, before data leaves the server, so a
// logged-out visitor's page never contains candidate names in the first place.

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export type BrowseCard = {
  key: string
  /** Short opaque reference — browse never shows a candidate's real name. */
  ref: string
  /**
   * Real id, only for accounts allowed to request an introduction. There is
   * deliberately no name field: the introduction is how an employer learns who
   * someone is, so the name is resolved server-side when the request is made
   * and never travels with the card.
   */
  id: string | null
  title: string
  location: string | null
  industries: string[]
  employmentType: string[]
  yearsExperience: string | null
  languages: string | null
  usHours: boolean | null
  interviewed: boolean
}

export type BrowseFilters = {
  industry?: string
  employmentType?: string
  q?: string
}

// The pool is in the dozens-to-low-hundreds, so everyone who matches is
// returned and the page reveals them in batches rather than paging. These caps
// exist only to stop a runaway response if the pool grows by an order of
// magnitude; `truncated` says when one actually bit, so it can't silently hide
// people the way a quiet slice would.
const LIMIT = 500
// Fetch wider than we display: industry and availability are matched in JS
// (below) so stored variants still match, and that filtering has to happen
// against the full set rather than a pre-trimmed page.
const FETCH_LIMIT = 1500

// Stored availability values drift — "Full-time" vs "Full Time" — and an exact
// array match silently drops those candidates from results, so compare
// loosely. Industries go through the taxonomy instead, which maps the far
// wider spread of stored values onto the same list the filter offers.
function looseMatch(value: string, filter: string): boolean {
  const a = value.toLowerCase().replace(/[^a-z0-9]+/g, '')
  const b = filter.toLowerCase().replace(/[^a-z0-9]+/g, '')
  if (!a || !b) return false
  return a === b || a.startsWith(b) || b.startsWith(a)
}

function refFrom(id: string) {
  return id.replace(/-/g, '').slice(0, 4).toUpperCase()
}

/**
 * The categories a candidate belongs to, judged the way an employer would
 * judge the card: by the title as well as the fields they ticked.
 *
 * Plenty of candidates left `fields_worked_in` empty or answered "Other" while
 * their title says exactly what they do. Filtering on the stored list alone
 * dropped those people from the very category the card visibly belongs to —
 * a bookkeeper missing from Accounting & Finance.
 *
 * "Other" is deliberately not in the result: it's not worth a chip on the
 * card, and an empty list is what the "Other" filter looks for.
 */
function cardIndustries(
  stored: string[] | null | undefined,
  title: string,
  rolesSeeking?: string | null,
): string[] {
  const out: string[] = []
  const add = (c: string | null) => { if (c && c !== 'Other' && !out.includes(c)) out.push(c) }
  for (const c of canonicalIndustries(stored)) add(c)
  add(inferIndustry(title))
  add(inferIndustry(rolesSeeking))
  return out
}

/** Everything a text search should be able to find this candidate by. */
function haystackFor(parts: (string | null | undefined)[], industries: string[]): string {
  return [...parts, ...industries].filter(Boolean).join(' ').toLowerCase()
}

/**
 * The industries somebody in the pool is actually in — the same set browse
 * offers as chips. The home page links into browse with these, so a link there
 * can't land on an empty list.
 *
 * Falls back to the full category list if the lookup fails, so a database
 * hiccup thins the section rather than deleting it.
 */
export async function poolIndustries(): Promise<string[]> {
  try {
    const client = db()
    const [{ data: profiles, error: pErr }, { data: videos, error: vErr }] = await Promise.all([
      client.from('candidate_profiles').select('current_job_title, roles_seeking, fields_worked_in').eq('status', 'active').limit(FETCH_LIMIT),
      client.from('video_candidates').select('current_job_title, fields_worked_in').limit(FETCH_LIMIT),
    ])
    if (pErr || vErr) throw new Error(pErr?.message ?? vErr?.message)

    type Row = { current_job_title: string | null; roles_seeking?: string | null; fields_worked_in: string[] | null }
    const present = new Set<string>()
    for (const r of [...(profiles ?? []), ...(videos ?? [])] as Row[]) {
      const title = displayTitle(r.current_job_title, r.roles_seeking ?? null, r.fields_worked_in)
      for (const i of cardIndustries(r.fields_worked_in, title, r.roles_seeking)) present.add(i)
    }
    if (present.size === 0) throw new Error('no industries in pool')
    return [...present].sort((a, b) => a.localeCompare(b))
  } catch (e) {
    console.error('poolIndustries failed:', e instanceof Error ? e.message : e)
    return BROWSE_INDUSTRIES.filter(i => i !== 'Other')
  }
}

export async function poolStats(): Promise<{ total: number; interviewed: number }> {
  try {
    const client = db()
    const [{ count: profileCount }, { count: interviewedCount }, { count: videoCount }] = await Promise.all([
      client.from('candidate_profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      client.from('candidate_profiles').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('interviewed', true),
      client.from('video_candidates').select('id', { count: 'exact', head: true }),
    ])
    return {
      total: (profileCount ?? 0) + (videoCount ?? 0),
      interviewed: (interviewedCount ?? 0) + (videoCount ?? 0),
    }
  } catch {
    return { total: 0, interviewed: 0 }
  }
}

export type BrowseResult = {
  cards: BrowseCard[]
  /** True when the display cap cut the list — the page says so rather than pretending that's everyone. */
  truncated: boolean
  /**
   * The industries actually present in the pool, given the other filters.
   * The page offers only these, so every choice returns someone — a fixed list
   * of all 23 categories was mostly dead ends.
   */
  industries: string[]
}

export async function browseCandidates(
  filters: BrowseFilters,
  allowIntroRequests: boolean,
): Promise<BrowseResult> {
  const client = db()
  const { industry, employmentType, q } = filters

  // Every filter runs in JS below, against the finished card. Doing the text
  // search in SQL instead would match the raw stored text — so a search for
  // "bookkeeper" would miss the candidate whose card says Bookkeeper because
  // they'd typed "doing the books for a few clients", which is precisely the
  // mismatch the taxonomy exists to remove.
  const profileQuery = client
    .from('candidate_profiles')
    .select('id, current_job_title, roles_seeking, tools_software, location, fields_worked_in, employment_type, years_experience, languages, us_hours_comfortable, interviewed')
    .eq('status', 'active')
    .limit(FETCH_LIMIT)

  const videoQuery = client
    .from('video_candidates')
    .select('id, current_job_title, location, fields_worked_in, employment_type')
    .limit(FETCH_LIMIT)

  const [{ data: profiles, error: profileError }, { data: videos, error: videoError }] =
    await Promise.all([profileQuery, videoQuery])

  // supabase-js resolves with an `error` instead of rejecting, so a failed
  // query would otherwise look like an empty pool. Surface it as a failure.
  if (profileError || videoError) {
    throw new Error(profileError?.message ?? videoError?.message ?? 'Candidate lookup failed')
  }

  type ProfileRow = {
    id: string; current_job_title: string | null; roles_seeking: string | null
    tools_software: string | null; location: string | null
    fields_worked_in: string[] | null; employment_type: string[] | null; years_experience: string | null
    languages: string | null; us_hours_comfortable: boolean | null; interviewed: boolean | null
  }
  type VideoRow = {
    id: string; current_job_title: string | null; location: string | null
    fields_worked_in: string[] | null; employment_type: string[] | null
  }

  // The haystack stays server-side — it holds the candidate's own raw wording,
  // which an anonymized visitor has no business receiving.
  type Entry = { card: BrowseCard; haystack: string }

  const entries: Entry[] = [
    ...((profiles ?? []) as ProfileRow[]).map((p): Entry => {
      const title = displayTitle(p.current_job_title, p.roles_seeking, p.fields_worked_in)
      const industries = cardIndustries(p.fields_worked_in, title, p.roles_seeking)
      return {
        card: {
          key: `p-${p.id}`,
          ref: refFrom(p.id),
          id: allowIntroRequests ? p.id : null,
          title,
          location: cleanText(p.location),
          industries,
          employmentType: p.employment_type ?? [],
          yearsExperience: cleanText(p.years_experience),
          languages: cleanText(p.languages),
          usHours: p.us_hours_comfortable,
          interviewed: !!p.interviewed,
        },
        haystack: haystackFor(
          [title, p.current_job_title, p.roles_seeking, p.tools_software, p.location],
          industries,
        ),
      }
    }),
    ...((videos ?? []) as VideoRow[]).map((v): Entry => {
      const title = displayTitle(v.current_job_title, null, v.fields_worked_in)
      const industries = cardIndustries(v.fields_worked_in, title)
      return {
        card: {
          key: `v-${v.id}`,
          ref: refFrom(v.id),
          id: allowIntroRequests ? v.id : null,
          title,
          location: cleanText(v.location),
          industries,
          employmentType: v.employment_type ?? [],
          yearsExperience: null,
          languages: null,
          usHours: null,
          interviewed: true,
        },
        haystack: haystackFor([title, v.current_job_title, v.location], industries),
      }
    }),
  ]

  // Multi-word searches read as "all of these", so "remote bookkeeper" doesn't
  // return every remote worker.
  const terms = (q ?? '').toLowerCase().split(/\s+/).filter(Boolean)

  // Narrow by everything except industry first, so the industry choices can be
  // built from what's genuinely left.
  const pool = entries.filter(({ card, haystack }) => {
    if (employmentType && !card.employmentType.some(t => looseMatch(t, employmentType))) return false
    if (terms.length && !terms.every(t => haystack.includes(t))) return false
    return true
  })

  // Offer only industries somebody is actually in. Listing all 23 categories
  // meant most of them returned nothing, which reads as a broken filter rather
  // than an empty category — and there's no way for a visitor to tell which is
  // which. "Other" appears only if someone really couldn't be categorized.
  const present = new Set<string>()
  let anyUncategorized = false
  for (const { card } of pool) {
    if (card.industries.length === 0) anyUncategorized = true
    for (const i of card.industries) present.add(i)
  }
  const industries = [...present].sort((a, b) => a.localeCompare(b))
  if (anyUncategorized) industries.push('Other')

  const filtered = pool.filter(({ card }) => {
    if (!industry) return true
    // "Other" is the absence of a category, not a category.
    return industry === 'Other'
      ? card.industries.length === 0
      : card.industries.includes(industry)
  }).map(e => e.card)

  // Order by title so the grid reads consistently. Deliberately NOT
  // interviewed-first: with the row cap that hid every candidate who hasn't
  // been filmed yet.
  filtered.sort((a, b) => a.title.localeCompare(b.title))
  return {
    cards: filtered.slice(0, LIMIT),
    truncated: filtered.length > LIMIT,
    industries,
  }
}

import { createClient } from '@supabase/supabase-js'
import { displayTitle, displayName, cleanText } from './candidateDisplay'
import { canonicalIndustries, inferIndustry, tidyCase, BROWSE_INDUSTRIES } from './candidateTaxonomy'

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
  /** First name only. Browse shows who, not who exactly — the surname comes with the introduction. */
  firstName: string | null
  title: string
  location: string | null
  industries: string[]
  employmentType: string[]
  yearsExperience: string | null
  languages: string | null
  usHours: boolean | null
  interviewed: boolean
  /**
   * There is a clip that would actually play. `interviewed` is a flag someone
   * ticks; this is whether a video exists, so the play control can't promise
   * something that isn't there.
   */
  hasVideo: boolean
  /** This employer already has this candidate, so the clip is theirs to watch. */
  assigned: boolean
  /** They have already asked for this introduction and it is still open. */
  requested: boolean
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

/**
 * Just the given name. A first name makes a card read as a person rather than
 * an open role, which is what browse is for — but the surname is what an
 * introduction is, so it never leaves the server.
 */
function firstNameOf(raw: string | null | undefined): string | null {
  const cleaned = displayName(raw)
  if (!cleaned) return null
  const first = cleaned.split(/\s+/)[0].replace(/[^\p{L}'\-]/gu, '')
  return first.length >= 2 ? first : null
}

/**
 * Locations are typed by hand, so they arrive in every casing at once —
 * "LAKEWOOD, NJ" beside "safed" beside "Monsey, NY".
 *
 * Title-casing an all-caps entry has to lowercase it first, which would turn
 * NJ into Nj. Two-letter words in a place name are state and country codes, so
 * they go back to capitals afterwards.
 */
function tidyLocation(raw: string | null | undefined): string | null {
  const t = cleanText(raw)
  if (!t) return null
  return tidyCase(t).replace(/\b([A-Za-z]{2})\b(?=[,\s]|$)/g, (m, code, offset) =>
    // Only trailing codes: "Tel Aviv" must not become "Tel AVIV", and a leading
    // two-letter word is a word, not a code.
    offset > 0 ? code.toUpperCase() : m)
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
  // The title first, because the card leads with it and shows only the first
  // category. Stored fields led before, which is how an "Accountant" ended up
  // tagged Healthcare & Medical — a field they once ticked, contradicting the
  // job title printed directly above it.
  add(inferIndustry(title))
  add(inferIndustry(rolesSeeking))
  for (const c of canonicalIndustries(stored)) add(c)
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
  /** The signed-in employer, so their own assignments can be marked. */
  viewerId?: string | null,
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
    .select('id, full_name, current_job_title, roles_seeking, tools_software, location, fields_worked_in, employment_type, years_experience, languages, us_hours_comfortable, interviewed')
    .eq('status', 'active')
    .limit(FETCH_LIMIT)

  const videoQuery = client
    .from('video_candidates')
    .select('id, name, current_job_title, location, fields_worked_in, employment_type, mux_playback_id')
    .limit(FETCH_LIMIT)

  // Which candidates have a clip, and which of them this employer already has.
  // Both are small lookups and both change what the card is allowed to offer,
  // so they belong in the same round trip as the candidates themselves.
  const clipsQuery = client.from('videos').select('candidate_id').not('mux_playback_id', 'is', null)
  // Open requests, so the button says "Requested" on arrival rather than only
  // until the page reloads.
  const requestedQuery = viewerId
    ? client.from('introduction_requests').select('candidate_id, candidate_ref').eq('employer_id', viewerId).eq('status', 'new')
    : Promise.resolve({ data: [] as { candidate_id: string | null; candidate_ref: string | null }[], error: null })
  const assignedQuery = viewerId
    ? client.from('employer_candidate_assignments').select('candidate_id').eq('employer_id', viewerId)
    : Promise.resolve({ data: [] as { candidate_id: string }[], error: null })
  const jobAssignedQuery = viewerId
    ? client.from('candidate_job_assignments').select('candidate_id, job_requirements!inner(employer_id)').eq('job_requirements.employer_id', viewerId)
    : Promise.resolve({ data: [] as { candidate_id: string }[], error: null })

  const [
    { data: profiles, error: profileError },
    { data: videos, error: videoError },
    { data: clips },
    { data: directAssigned },
    { data: jobAssigned },
    { data: requested },
  ] = await Promise.all([profileQuery, videoQuery, clipsQuery, assignedQuery, jobAssignedQuery, requestedQuery])

  const withClip = new Set((clips ?? []).map((v: { candidate_id: string }) => v.candidate_id))
  // Requests are matched by id where there is one and by reference otherwise,
  // the same way the API records them.
  const requestedKeys = new Set(
    (requested ?? []).flatMap((r: { candidate_id: string | null; candidate_ref: string | null }) =>
      [r.candidate_id, r.candidate_ref].filter(Boolean) as string[]),
  )
  const assignedIds = new Set([
    ...(directAssigned ?? []).map((a: { candidate_id: string }) => a.candidate_id),
    ...(jobAssigned ?? []).map((a: { candidate_id: string }) => a.candidate_id),
  ])

  // supabase-js resolves with an `error` instead of rejecting, so a failed
  // query would otherwise look like an empty pool. Surface it as a failure.
  if (profileError || videoError) {
    throw new Error(profileError?.message ?? videoError?.message ?? 'Candidate lookup failed')
  }

  type ProfileRow = {
    id: string; full_name: string | null; current_job_title: string | null; roles_seeking: string | null
    tools_software: string | null; location: string | null
    fields_worked_in: string[] | null; employment_type: string[] | null; years_experience: string | null
    languages: string | null; us_hours_comfortable: boolean | null; interviewed: boolean | null
  }
  type VideoRow = {
    id: string; name: string | null; current_job_title: string | null; location: string | null
    fields_worked_in: string[] | null; employment_type: string[] | null; mux_playback_id: string | null
  }

  // Both extras stay server-side. The haystack holds the candidate's own raw
  // wording, which an anonymized visitor has no business receiving; the title
  // industry only exists to order results.
  type Entry = { card: BrowseCard; haystack: string; titleIndustry: string | null }

  const entries: Entry[] = [
    ...((profiles ?? []) as ProfileRow[]).map((p): Entry => {
      const title = displayTitle(p.current_job_title, p.roles_seeking, p.fields_worked_in)
      const industries = cardIndustries(p.fields_worked_in, title, p.roles_seeking)
      return {
        card: {
          key: `p-${p.id}`,
          ref: refFrom(p.id),
          id: allowIntroRequests ? p.id : null,
          firstName: firstNameOf(p.full_name),
          title,
          location: tidyLocation(p.location),
          industries,
          employmentType: p.employment_type ?? [],
          yearsExperience: cleanText(p.years_experience),
          languages: cleanText(p.languages),
          usHours: p.us_hours_comfortable,
          interviewed: !!p.interviewed,
          hasVideo: withClip.has(p.id),
          assigned: assignedIds.has(p.id),
          requested: requestedKeys.has(p.id),
        },
        haystack: haystackFor(
          [title, p.current_job_title, p.roles_seeking, p.tools_software, p.location],
          industries,
        ),
        titleIndustry: inferIndustry(title),
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
          firstName: firstNameOf(v.name),
          title,
          location: tidyLocation(v.location),
          industries,
          employmentType: v.employment_type ?? [],
          yearsExperience: null,
          languages: null,
          usHours: null,
          interviewed: true,
          hasVideo: !!v.mux_playback_id,
          assigned: assignedIds.has(v.id),
          requested: requestedKeys.has(v.id) || requestedKeys.has(refFrom(v.id)),
        },
        haystack: haystackFor([title, v.current_job_title, v.location], industries),
        titleIndustry: inferIndustry(title),
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
  })

  // Order, most significant first:
  //   1. Someone whose job title IS the thing you filtered for beats someone
  //      who merely ticked that field once.
  //   2. Interviewed candidates lead — an employer can watch them today, so
  //      they're the stronger answer. This is safe now that the page reveals
  //      everyone in batches; when the list was hard-capped, sorting this way
  //      pushed every un-filmed candidate off the end entirely.
  //   3. Title, so the grid reads consistently.
  filtered.sort((a, b) => {
    if (industry) {
      const aTitle = a.titleIndustry === industry ? 0 : 1
      const bTitle = b.titleIndustry === industry ? 0 : 1
      if (aTitle !== bTitle) return aTitle - bTitle
    }
    // Same signal the badge uses: a clip is proof of an interview even if
    // nobody ticked the flag.
    const aSeen = a.card.interviewed || a.card.hasVideo
    const bSeen = b.card.interviewed || b.card.hasVideo
    if (aSeen !== bSeen) return aSeen ? -1 : 1
    return a.card.title.localeCompare(b.card.title)
  })

  const cards = filtered.map(e => e.card)
  return {
    cards: cards.slice(0, LIMIT),
    truncated: cards.length > LIMIT,
    industries,
  }
}

import { createClient } from '@supabase/supabase-js'
import { displayTitle, displayName, cleanText } from './candidateDisplay'
import { canonicalIndustries } from './candidateTaxonomy'

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
  /** Short opaque reference shown instead of a name to logged-out visitors. */
  ref: string
  /** Real id — only populated when names are revealed. */
  id: string | null
  name: string | null
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
}

export async function browseCandidates(
  filters: BrowseFilters,
  revealNames: boolean,
): Promise<BrowseResult> {
  const client = db()
  const { industry, employmentType, q } = filters

  let profileQuery = client
    .from('candidate_profiles')
    .select('id, full_name, current_job_title, roles_seeking, location, fields_worked_in, employment_type, years_experience, languages, us_hours_comfortable, interviewed')
    .eq('status', 'active')
    .limit(FETCH_LIMIT)

  let videoQuery = client
    .from('video_candidates')
    .select('id, name, current_job_title, location, fields_worked_in, employment_type')
    .limit(FETCH_LIMIT)

  if (q?.trim()) {
    const term = q.trim()
    profileQuery = profileQuery.or(`current_job_title.ilike.%${term}%,roles_seeking.ilike.%${term}%,tools_software.ilike.%${term}%`)
    videoQuery = videoQuery.ilike('current_job_title', `%${term}%`)
  }

  const [{ data: profiles, error: profileError }, { data: videos, error: videoError }] =
    await Promise.all([profileQuery, videoQuery])

  // supabase-js resolves with an `error` instead of rejecting, so a failed
  // query would otherwise look like an empty pool. Surface it as a failure.
  if (profileError || videoError) {
    throw new Error(profileError?.message ?? videoError?.message ?? 'Candidate lookup failed')
  }

  type ProfileRow = {
    id: string; full_name: string | null; current_job_title: string | null; roles_seeking: string | null; location: string | null
    fields_worked_in: string[] | null; employment_type: string[] | null; years_experience: string | null
    languages: string | null; us_hours_comfortable: boolean | null; interviewed: boolean | null
  }
  type VideoRow = {
    id: string; name: string | null; current_job_title: string | null; location: string | null
    fields_worked_in: string[] | null; employment_type: string[] | null
  }

  const cards: BrowseCard[] = [
    ...((profiles ?? []) as ProfileRow[]).map(p => ({
      key: `p-${p.id}`,
      ref: refFrom(p.id),
      id: revealNames ? p.id : null,
      name: revealNames ? displayName(p.full_name) : null,
      title: displayTitle(p.current_job_title, p.roles_seeking, p.fields_worked_in),
      location: cleanText(p.location),
      industries: canonicalIndustries(p.fields_worked_in),
      employmentType: p.employment_type ?? [],
      yearsExperience: cleanText(p.years_experience),
      languages: cleanText(p.languages),
      usHours: p.us_hours_comfortable,
      interviewed: !!p.interviewed,
    })),
    ...((videos ?? []) as VideoRow[]).map(v => ({
      key: `v-${v.id}`,
      ref: refFrom(v.id),
      id: revealNames ? v.id : null,
      name: revealNames ? displayName(v.name) : null,
      title: displayTitle(v.current_job_title, null, v.fields_worked_in),
      location: cleanText(v.location),
      industries: canonicalIndustries(v.fields_worked_in),
      employmentType: v.employment_type ?? [],
      yearsExperience: null,
      languages: null,
      usHours: null,
      interviewed: true,
    })),
  ]

  const filtered = cards.filter(c => {
    // c.industries is already canonical, and the dropdown only offers canonical
    // values, so this is an exact comparison by construction.
    if (industry && !c.industries.includes(industry)) return false
    if (employmentType && !c.employmentType.some(t => looseMatch(t, employmentType))) return false
    return true
  })

  // Order by title so the grid reads consistently. Deliberately NOT
  // interviewed-first: with the row cap that hid every candidate who hasn't
  // been filmed yet.
  filtered.sort((a, b) => a.title.localeCompare(b.title))
  return { cards: filtered.slice(0, LIMIT), truncated: filtered.length > LIMIT }
}

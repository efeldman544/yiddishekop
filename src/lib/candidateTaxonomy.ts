import { INDUSTRIES } from './candidateOptions'
import { cleanText } from './textClean'

// Candidate-entered industries and job titles are free text in practice: older
// category lists ("Tech/Software"), typed-in variants ("Other:: Doing
// accounting for clients"), and titles that are really sentences. Matching or
// displaying those raw means the industry filter silently misses people and
// the cards read badly, so map everything onto a canonical vocabulary first.

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')

// Labels the app no longer offers but candidates are already stored under.
// They mean the same thing as a current category, so folding them keeps one
// real category from splitting across two buckets where neither filter finds
// everyone.
const RETIRED: Record<string, string> = {
  'Information Technology': 'Technology & Software',
}

/** The categories a candidate can actually be filed under after canonicalization. */
export const BROWSE_INDUSTRIES: string[] = INDUSTRIES.filter(i => !(i in RETIRED))

const CANON_BY_NORM = new Map<string, string>([
  ...INDUSTRIES.map(i => [norm(i), RETIRED[i] ?? (i as string)] as [string, string]),
  ...Object.entries(RETIRED).map(([from, to]) => [norm(from), to] as [string, string]),
])

// Ordered: more specific rules first, since "engineer" and "account" appear
// inside several categories.
const INDUSTRY_RULES: [string, RegExp][] = [
  ['Accounting & Finance', /(bookkeep|account|financ|audit|\btax\b|payroll|invoic|billing|controller|\bcpa\b)/i],
  ['Human Resources', /(human\s*resour|\bhr\b|recruit|talent\s*acq|staffing)/i],
  ['Customer Service', /(customer\s*(service|support|care|success)|client\s*(service|support)|help\s*desk|call\s*cent)/i],
  ['Sales & Business Development', /(\bsales\b|business\s*develop|account\s*exec|telemarket|\bbiz\s*dev)/i],
  ['Marketing & Advertising', /(marketing|advertis|\bseo\b|\bppc\b|brand(ing)?|social\s*media|copywrit)/i],
  ['Data & Analytics', /(data\s*(analy|scien|engineer)|analytics|business\s*intelligence)/i],
  ['Technology & Software', /(software|web\s*dev|developer|programm|full[\s-]*stack|front[\s-]*end|back[\s-]*end|\bqa\b|devops|\bit\b|information\s*tech|\btech\b|coder|\bcoding\b)/i],
  ['Arts & Creative', /(graphic|design(er)?|creative|illustrat|photograph|animat|video\s*edit)/i],
  ['Media & Communications', /(\bmedia\b|communicat|journalis|\beditor\b|content\s*writ|proofread|translat)/i],
  ['Education & Training', /(teach|tutor|educat|instructor|curriculum|training|school|morah|rebbe)/i],
  ['Healthcare & Medical', /(health|medical|nurs|therap|clinic|patient|dental|pharma|caregiv)/i],
  ['Legal & Compliance', /(legal|paralegal|attorney|lawyer|complian|contract\s*review)/i],
  ['Logistics & Supply Chain', /(logistic|supply\s*chain|shipping|freight|warehous|dispatch|procure|fulfil)/i],
  ['Real Estate', /(real\s*estate|propert|realtor|leasing|mortgage)/i],
  ['Insurance', /(insuran|underwrit|\bclaims\b|actuar)/i],
  ['Construction & Engineering', /(construction|contractor|architect|civil\s*eng|structural|drafting)/i],
  ['Manufacturing & Operations', /(manufactur|production|operations|assembly|quality\s*control)/i],
  ['Nonprofit & Social Services', /(non[\s-]*profit|charit|social\s*work|community|chesed|tzedak)/i],
  ['Retail & E-commerce', /(retail|e[\s-]*commerce|shopify|amazon|merchandis|\bstore\b)/i],
  ['Hospitality & Travel', /(hospitality|hotel|travel|tourism|restaurant|catering)/i],
  ['Administrative & Office Support', /(admin|office|secretar|clerical|reception|data\s*entry|virtual\s*assistant|executive\s*assistant|typist|schedul)/i],
  ['Engineering', /(engineer)/i],
]

/**
 * The category a piece of free text belongs to, or null when nothing in it
 * says. Unlike `canonicalIndustry` this does NOT fall back to "Other", so it
 * is safe to run over a job title: a title we can't place adds no category
 * rather than mislabelling someone.
 */
export function inferIndustry(raw: string | null | undefined): string | null {
  const t = cleanText(raw)
  if (!t) return null
  const exact = CANON_BY_NORM.get(norm(t))
  if (exact) return exact
  for (const [canon, re] of INDUSTRY_RULES) if (re.test(t)) return canon
  return null
}

/**
 * Map a stored industry value onto one of the canonical categories. A value
 * that was stored as an industry always lands somewhere, so unrecognised ones
 * become "Other".
 */
export function canonicalIndustry(raw: string | null | undefined): string | null {
  const t = cleanText(raw)
  if (!t) return null
  return inferIndustry(t) ?? 'Other'
}

export function canonicalIndustries(raw: string[] | null | undefined): string[] {
  const out: string[] = []
  for (const v of raw ?? []) {
    const c = canonicalIndustry(v)
    if (c && !out.includes(c)) out.push(c)
  }
  return out
}

/**
 * A short noun for describing someone by their field when we have no title —
 * "Accounting & Finance" reads badly in a sentence, "Accounting" doesn't.
 */
export function industryLabel(canon: string): string {
  return canon.split(/\s*&\s*/)[0].trim()
}

// ── Titles ────────────────────────────────────────────────────────────

// Candidates answer the "current job title" question with a sentence as often
// as with a title. Strip the sentence opener before looking at what's left.
const LEAD_IN = /^(?:i\s*(?:am|m)?\s*(?:currently\s*)?(?:work(?:ing)?\s*)?(?:as\s*)?(?:an?)?\s+|currently\s+|(?:position|role|job\s*title|title|profession)\b)\s*[:\-–]?\s*/i

// A recognised role wins over whatever phrasing the candidate used, so the
// grid reads consistently ("Doing accounting for clients" -> "Accountant").
const ROLE_RULES: [RegExp, string][] = [
  [/bookkeep/i, 'Bookkeeper'],
  [/\bcpa\b|certified\s*public\s*account/i, 'Accountant'],
  [/payroll/i, 'Payroll Specialist'],
  [/account(ant|ing)/i, 'Accountant'],
  [/accounts?\s*(payable|receivable)/i, 'Accounts Clerk'],
  [/executive\s*assistant/i, 'Executive Assistant'],
  [/virtual\s*assistant/i, 'Virtual Assistant'],
  [/(administrative|admin)\s*(assistant|support)/i, 'Administrative Assistant'],
  [/office\s*manag/i, 'Office Manager'],
  [/secretar/i, 'Secretary'],
  [/reception/i, 'Receptionist'],
  [/data\s*entry/i, 'Data Entry Clerk'],
  [/customer\s*(service|support|care|success)|help\s*desk/i, 'Customer Service Representative'],
  [/\bsales\b|account\s*exec/i, 'Sales Representative'],
  [/social\s*media/i, 'Social Media Manager'],
  [/copywrit|content\s*writ/i, 'Copywriter'],
  [/marketing/i, 'Marketing Specialist'],
  [/graphic\s*design|\bdesigner\b/i, 'Graphic Designer'],
  [/(web|software|front[\s-]*end|back[\s-]*end|full[\s-]*stack)\s*(developer|dev|engineer)|programmer|\bcoder\b/i, 'Software Developer'],
  [/data\s*analy/i, 'Data Analyst'],
  [/project\s*manag/i, 'Project Manager'],
  [/paralegal/i, 'Paralegal'],
  [/recruit/i, 'Recruiter'],
  [/\bnurs(e|ing)\b/i, 'Nurse'],
  [/teacher|teaching|morah|rebbe/i, 'Teacher'],
  [/tutor/i, 'Tutor'],
  [/translat/i, 'Translator'],
  [/proofread|\beditor\b|editing/i, 'Editor'],
  [/transcrib|transcription/i, 'Transcriptionist'],
]

const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with'])

/**
 * Title-case a word run, leaving deliberate capitalization alone: short
 * acronyms (IT, HR, QA, CPA) and words with an interior capital
 * ("QuickBooks", "eCommerce", "McDonald").
 */
export function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w, i) => {
      const lower = w.toLowerCase()
      if (w.length <= 4 && /[A-Z]/.test(w) && w === w.toUpperCase()) return w
      if (/[A-Z]/.test(w.slice(1))) return w
      if (i > 0 && SMALL.has(lower)) return lower
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

/**
 * Make a title read like the rest of the grid. Shouting is flattened first —
 * otherwise every letter of "BOOKKEEPER" looks like a deliberate capital — and
 * then title-cased, which preserves acronyms and brand casing.
 */
export function tidyCase(s: string): string {
  return titleCase(s === s.toUpperCase() ? s.toLowerCase() : s)
}

/** The canonical role name a piece of free text describes, if any. */
export function matchRole(raw: string | null | undefined): string | null {
  const t = cleanText(raw)
  if (!t) return null
  for (const [re, role] of ROLE_RULES) if (re.test(t)) return role
  return null
}

/** Drop the sentence opener candidates write before their actual title. */
export function stripLeadIn(s: string): string {
  return s.replace(LEAD_IN, '').replace(/^[\s:,\-–—]+/, '').trim()
}

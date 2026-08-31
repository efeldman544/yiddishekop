// Imported and self-entered candidate data has messy titles: blanks,
// "unemployed", "not working right now", sentences ("I am currently doing
// accounting for a few clients"), shouting ("BOOKKEEPER"), and — for
// bulk-uploaded video candidates — file-derived strings like "2026 03 29
// Reuvane Rhodes transcript". None of that should be shown to an employer, so
// map it onto the canonical role vocabulary and only fall back to the raw text
// when it already reads like a title.

import { cleanText } from './textClean'
import {
  matchRole, tidyCase, stripLeadIn, canonicalIndustry, industryLabel,
} from './candidateTaxonomy'

export { cleanText }

// Whole-value junk
const JUNK_EXACT = /^(n\/?a|na|none|nothing|null|nil|unknown|untitled|test|tbd|other|misc|[-–—.?]+)$/i

// Phrases that make the rest of the string junk too ("not working right now")
const JUNK_PREFIX = /^(un-?employed|not\s*(currently\s*)?(working|employed)|no\s*(job|work|position)|jobless|between\s*jobs|currently\s*(un-?employed|looking|available)|looking(\s*for)?\b|seeking\b|open\s*to\b|available\b|job\s*seeker|student|housewife|homemaker|retired|none\b|any(thing)?\b)/i

// File-derived noise: dates, transcript/interview/zoom, extensions, "(2)"
const NOISE = /(transcript|interview|zoom|recording|meeting|\.(mp4|mov|m4a|pdf|docx?)\b|\d{4}[-_ /]\d{1,2}[-_ /]\d{1,2}|\(\d+\))/i

function usable(v: string | null | undefined): string | null {
  const t = cleanText(v) ?? ''
  if (t.length < 2) return null
  if (JUNK_EXACT.test(t)) return null
  if (JUNK_PREFIX.test(t)) return null
  if (NOISE.test(t)) return null
  // A "title" that's really a sentence isn't a title
  if (t.length > 60) return null
  return t
}

/**
 * Turn one free-text answer into a presentable title, or null if it can't be
 * one. A recognised role wins over the candidate's own phrasing so the grid
 * reads consistently; unrecognised text is only kept when it's short enough to
 * plausibly be a title rather than a description of their situation.
 */
function normalizeTitle(raw: string | null | undefined): string | null {
  const cleaned = cleanText(raw)
  if (!cleaned) return null

  // "I am a bookkeeper" -> "bookkeeper". Do this before the junk checks so
  // "Currently unemployed" is still caught by JUNK_PREFIX.
  const stripped = stripLeadIn(cleaned)

  // A recognised role is worth extracting even out of a sentence, and even out
  // of a "not working right now" answer — someone between jobs is still a
  // bookkeeper, and that's what an employer needs to see on the card.
  const role = matchRole(stripped)
  if (role) return role

  if (!usable(stripped)) return null

  // Unrecognised. Keep it only if it reads like a title.
  if (stripped.split(/\s+/).length > 5) return null
  return tidyCase(stripped).replace(/[.,;:]+$/, '')
}

/** A presentable role title, derived from whatever the record actually has. */
export function displayTitle(
  title: string | null | undefined,
  rolesSeeking?: string | null,
  industries?: string[] | null,
): string {
  const direct = normalizeTitle(title)
  if (direct) return direct

  // What they say they're looking for is the next best description
  const seeking = normalizeTitle((rolesSeeking ?? '').split(/[,;/|]/)[0])
  if (seeking) return seeking

  // Otherwise describe them by the field they've worked in. "Other" tells an
  // employer nothing, so it doesn't count as a field.
  for (const raw of industries ?? []) {
    const canon = canonicalIndustry(raw)
    if (canon && canon !== 'Other') return `${industryLabel(canon)} professional`
  }

  return 'Remote professional'
}

/** Strip file-name noise (dates, "transcript") out of an imported name. */
export function displayName(name: string | null | undefined): string | null {
  let t = (name ?? '').replace(/\s+/g, ' ').trim()
  if (!t) return null
  t = t
    .replace(/\.(mp4|mov|m4a|pdf|docx?)\b/gi, '')
    .replace(/\d{4}[-_ /]\d{1,2}[-_ /]\d{1,2}/g, '')
    // Underscores are word characters, so split them before matching \b words
    // ("interview_chaim" would otherwise keep the "interview").
    .replace(/[_]+/g, ' ')
    .replace(/\b(transcript|interview|recording|zoom|meeting)\b/gi, '')
    .replace(/\(\d+\)/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[-–—\s]+|[-–—\s]+$/g, '')
    .trim()
  return t.length >= 2 ? t : null
}

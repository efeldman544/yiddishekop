import Anthropic from '@anthropic-ai/sdk'

// Shared nickname/transliteration-aware name matching, used by the admin
// "Re-match all" flow (/api/admin/ai-name-match) and by the Zoom recording
// webhook to auto-attach recordings when email/booking matching fails.

export type NameMatchEntry = { id: string; name: string }
export type NameMatchProfile = { id: string; full_name: string | null }
export type NameMatchResult = {
  videoId: string
  candidateId: string | null
  confidence: 'high' | 'medium' | 'low' | 'none'
  reason: string
}

export async function aiMatchNamesToCandidates(
  entries: NameMatchEntry[],
  profiles: NameMatchProfile[],
): Promise<NameMatchResult[]> {
  const profileList = profiles.filter(p => p.full_name)
  if (entries.length === 0) return []
  if (profileList.length === 0) {
    return entries.map(e => ({
      videoId: e.id, candidateId: null, confidence: 'none' as const,
      reason: 'No candidate profiles to match against.',
    }))
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are matching interview video recordings to candidate profiles by name for a recruiting platform serving the Yiddish-speaking community.

Video file/folder names are often messy — they may contain dates, meeting IDs, words like "Interview", "Zoom", trailing numbers like "(2)", underscores, or other clutter around the actual person's name. Names may also appear in different transliterations or as nicknames (e.g. "Gitty"/"Gittel"/"Gita", "Devorah"/"Dvora"/"Devoiry", "Yossi"/"Yosef"/"Joseph", "Chaim"/"Hyman", "Shprintza"/"Shprintzy").

CANDIDATE PROFILES (id — full name):
${profileList.map(p => `${p.id} — ${p.full_name}`).join('\n')}

VIDEO ENTRIES TO MATCH (id — raw name/label):
${entries.map(e => `${e.id} — ${e.name}`).join('\n')}

For each video entry, decide whether it corresponds to exactly one of the candidate profiles above. Strip noise from the video name mentally and reason about whether the remaining name plausibly refers to the same person (accounting for nickname/transliteration variants, word order, missing middle names, etc).

Respond with a JSON array only — no markdown, no explanation outside the JSON:
[
  { "videoId": "<video entry id>", "candidateId": "<matching profile id, or null>", "confidence": "high" | "medium" | "low" | "none", "reason": "<one short sentence>" }
]

Guidance on confidence:
- "high": you're confident this is the same person (clear name match, only cosmetic noise differs)
- "medium": plausible match but uncertain (e.g. a nickname/variant you're not fully sure of, or partial name overlap) — needs human review
- "low" or "none": no good candidate match — set candidateId to null

Return exactly one entry per video entry, in the same order.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  try {
    const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
    const parsed = JSON.parse(jsonText)
    if (!Array.isArray(parsed)) throw new Error('not an array')
    const validIds = new Set(profileList.map(p => p.id))
    return parsed.map((r: Record<string, unknown>) => ({
      videoId: String(r.videoId),
      candidateId: typeof r.candidateId === 'string' && validIds.has(r.candidateId) ? r.candidateId : null,
      confidence: (['high', 'medium', 'low', 'none'].includes(r.confidence as string)
        ? r.confidence : 'none') as NameMatchResult['confidence'],
      reason: typeof r.reason === 'string' ? r.reason : '',
    }))
  } catch {
    return entries.map(e => ({
      videoId: e.id, candidateId: null, confidence: 'none' as const,
      reason: 'Could not parse AI response.',
    }))
  }
}

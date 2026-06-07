import { createClient } from '@/lib/supabase/server'
import { createClient as adminSupabase } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function adminClient() {
  return adminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

type MatchResult = {
  videoId: string
  candidateId: string | null
  confidence: 'high' | 'medium' | 'low' | 'none'
  reason: string
}

export async function POST(req: Request) {
  // Auth — admin only
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: string }>()
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const { videoCandidates } = await req.json()
  if (!Array.isArray(videoCandidates) || videoCandidates.length === 0) {
    return new Response('Missing videoCandidates', { status: 400 })
  }

  const db = adminClient()
  const { data: profiles } = await db.from('candidate_profiles').select('id, full_name').order('full_name')
  const profileList = ((profiles ?? []) as { id: string; full_name: string | null }[]).filter(p => p.full_name)

  if (profileList.length === 0) {
    return Response.json({ results: videoCandidates.map((vc: { id: string }) => ({
      videoId: vc.id, candidateId: null, confidence: 'none', reason: 'No candidate profiles to match against.',
    })) })
  }

  const prompt = `You are matching interview video recordings to candidate profiles by name for a recruiting platform serving the Yiddish-speaking community.

Video file/folder names are often messy — they may contain dates, meeting IDs, words like "Interview", "Zoom", trailing numbers like "(2)", underscores, or other clutter around the actual person's name. Names may also appear in different transliterations or as nicknames (e.g. "Gitty"/"Gittel"/"Gita", "Devorah"/"Dvora"/"Devoiry", "Yossi"/"Yosef"/"Joseph", "Chaim"/"Hyman", "Shprintza"/"Shprintzy").

CANDIDATE PROFILES (id — full name):
${profileList.map(p => `${p.id} — ${p.full_name}`).join('\n')}

VIDEO ENTRIES TO MATCH (id — raw name/label):
${videoCandidates.map((vc: { id: string; name: string }) => `${vc.id} — ${vc.name}`).join('\n')}

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
  let results: MatchResult[] = []
  try {
    const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
    const parsed = JSON.parse(jsonText)
    if (Array.isArray(parsed)) {
      const validIds = new Set(profileList.map(p => p.id))
      results = parsed.map((r: Record<string, unknown>) => ({
        videoId: String(r.videoId),
        candidateId: typeof r.candidateId === 'string' && validIds.has(r.candidateId) ? r.candidateId : null,
        confidence: (['high', 'medium', 'low', 'none'].includes(r.confidence as string) ? r.confidence : 'none') as MatchResult['confidence'],
        reason: typeof r.reason === 'string' ? r.reason : '',
      }))
    }
  } catch {
    results = videoCandidates.map((vc: { id: string }) => ({
      videoId: vc.id, candidateId: null, confidence: 'none', reason: 'Could not parse AI response.',
    }))
  }

  return Response.json({ results })
}

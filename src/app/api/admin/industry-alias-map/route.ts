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

const CURRENT_INDUSTRIES = [
  'Accounting & Finance', 'Administrative & Office Support', 'Arts & Creative',
  'Construction & Engineering', 'Customer Service', 'Data & Analytics',
  'Education & Training', 'Engineering', 'Healthcare & Medical',
  'Hospitality & Travel', 'Human Resources', 'Information Technology',
  'Insurance', 'Legal & Compliance', 'Logistics & Supply Chain',
  'Manufacturing & Operations', 'Marketing & Advertising', 'Media & Communications',
  'Nonprofit & Social Services', 'Real Estate', 'Retail & E-commerce',
  'Sales & Business Development', 'Technology & Software', 'Other',
]

export async function GET() {
  // Auth — admin only
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: string }>()
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const db = adminClient()
  const { data: rows } = await db.from('candidate_profiles').select('fields_worked_in').not('fields_worked_in', 'is', null)

  const currentSet = new Set(CURRENT_INDUSTRIES.map(i => i.toLowerCase()))
  const legacyValues = new Set<string>()
  for (const row of (rows ?? []) as { fields_worked_in: string[] | null }[]) {
    for (const v of row.fields_worked_in ?? []) {
      const trimmed = v.trim()
      if (trimmed && !currentSet.has(trimmed.toLowerCase())) legacyValues.add(trimmed)
    }
  }

  if (legacyValues.size === 0) {
    return Response.json({ aliasMap: {} })
  }

  const legacyList = Array.from(legacyValues)

  const prompt = `A recruiting platform changed its list of industry/field categories over time. Candidates who filled out their profile under older versions of the list have values stored that no longer match the current category names exactly.

CURRENT CATEGORIES:
${CURRENT_INDUSTRIES.map(c => `- ${c}`).join('\n')}

OLD VALUES STILL STORED ON CANDIDATE PROFILES:
${legacyList.map(v => `- ${v}`).join('\n')}

For each old value, identify the single current category it most closely corresponds to, so that filtering by the current category also surfaces candidates who used the old value. If an old value is itself essentially free text or doesn't meaningfully correspond to any current category, map it to null.

Respond with a JSON object only — no markdown, no explanation outside the JSON — mapping each old value (as the key, exactly as given) to either a current category name (exactly as listed above) or null:
{ "<old value>": "<current category or null>", ... }`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  let aliasMap: Record<string, string | null> = {}
  try {
    const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
    const parsed = JSON.parse(jsonText)
    const validCategories = new Set(CURRENT_INDUSTRIES)
    for (const key of legacyList) {
      const val = parsed[key]
      aliasMap[key] = typeof val === 'string' && validCategories.has(val) ? val : null
    }
  } catch {
    aliasMap = Object.fromEntries(legacyList.map(v => [v, null]))
  }

  return Response.json({ aliasMap })
}

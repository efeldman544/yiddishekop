import { createClient } from '@/lib/supabase/server'
import { createClient as adminSupabase } from '@supabase/supabase-js'
import { costUsd, describeAiFailure } from '@/lib/ai/models'
import { buildCard, estimateCard, type Source } from '@/lib/candidateCard'
import { fetchAll, isMissingSchema, listPool } from '@/lib/matchPool'

export const maxDuration = 60

// Candidate cards, for the admin:
//
//   status    who has a card, whose is out of date, whose resume couldn't be read
//   estimate  what building some cards would cost, without building them
//   build     build them
//
// The admin screen drives estimate and build a few candidates at a time, so
// no single request has to outlast a serverless time limit and a failure
// costs a handful of candidates rather than the run.

function adminClient() {
  return adminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

type Item = { id: string; source: Source }

function readItems(body: { items?: unknown }, max: number): Item[] | Response {
  const items = (Array.isArray(body?.items) ? body.items : [])
    .filter((c: { id?: unknown; source?: unknown }) => typeof c?.id === 'string' && (c.source === 'profile' || c.source === 'video')) as Item[]
  if (items.length === 0) return new Response('Missing items', { status: 400 })
  if (items.length > max) return new Response('Too many items in one request', { status: 400 })
  return items
}

export async function POST(req: Request) {
  try {
    return await handle(req)
  } catch (err: unknown) {
    console.error('candidate-cards failed:', err)
    return new Response(describeAiFailure(err), { status: 500 })
  }
}

async function handle(req: Request) {
  const body = await req.json().catch(() => null)
  const stage: string = body?.stage ?? 'status'

  // Admin only: estimate and build read resumes, and build spends money.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: string }>()
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const db = adminClient()

  if (stage === 'status') {
    const pool = await listPool(db)

    type CardRow = {
      candidate_id: string; source: Source; source_hash: string
      resume_status: string; resume_note: string | null
      model: string | null; input_tokens: number; output_tokens: number
    }
    let cards: CardRow[]
    try {
      cards = await fetchAll<CardRow>((from, to) =>
        db.from('candidate_cards')
          .select('candidate_id, source, source_hash, resume_status, resume_note, model, input_tokens, output_tokens')
          .order('candidate_id').range(from, to))
    } catch (e) {
      if (!isMissingSchema(e instanceof Error ? e.message : '')) throw e
      // The table isn't there: the SQL hasn't been run. Say so rather than
      // reporting five hundred candidates as needing a card that can't be stored.
      return Response.json({ ready: false, total: pool.length })
    }

    const byId = new Map(cards.map(c => [c.candidate_id, c]))
    const stale: Item[] = []
    const unreadable: { id: string; source: Source; name: string | null; note: string | null }[] = []
    let images = 0
    let noResume = 0
    for (const entry of pool) {
      const card = byId.get(entry.id)
      if (!card || card.source_hash !== entry.sourceHash) { stale.push({ id: entry.id, source: entry.source }); continue }
      if (card.resume_status === 'unreadable') unreadable.push({ id: entry.id, source: entry.source, name: entry.name, note: card.resume_note })
      else if (card.resume_status === 'image') images++
      else if (card.resume_status === 'none' && entry.source === 'profile') noResume++
    }

    return Response.json({
      ready: true,
      total: pool.length,
      built: pool.length - stale.length,
      stale,
      unreadable,
      images,
      noResume,
      spentUsd: cards.reduce((sum, c) => sum + costUsd(c.model ?? '', c.input_tokens, c.output_tokens), 0),
    })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response('ANTHROPIC_API_KEY is not set in the environment variables.', { status: 500 })
  }

  if (stage === 'estimate') {
    const items = readItems(body, 5)
    if (items instanceof Response) return items
    const results = await Promise.all(items.map(async item => {
      try {
        return { ...item, ...(await estimateCard(db, item.id, item.source)) }
      } catch (e) {
        return { ...item, status: 'error' as const, message: describeAiFailure(e) }
      }
    }))
    return Response.json({ results })
  }

  if (stage === 'build') {
    const items = readItems(body, 3)
    if (items instanceof Response) return items
    const force = body.force === true
    const results = await Promise.all(items.map(async item => {
      try {
        return { ...item, ...(await buildCard(db, item.id, item.source, { force })) }
      } catch (e) {
        console.error(`card build failed for ${item.id}:`, e)
        return { ...item, status: 'error' as const, message: describeAiFailure(e) }
      }
    }))
    return Response.json({ results })
  }

  return new Response(`Unknown stage: ${stage}`, { status: 400 })
}

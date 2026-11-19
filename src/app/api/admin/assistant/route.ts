import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { refuseUnlessAdmin } from '@/lib/requireAdmin'
import { ASSISTANT_MODEL, costWithCacheUsd, describeAiFailure, getAnthropic } from '@/lib/ai/models'
import { TOOLS, runTool } from '@/lib/assistant/tools'

export const maxDuration = 60

// The admin's assistant. One question can take several rounds — search, open a
// profile, read a résumé — and all of them together can outlast a serverless
// time limit, so the chat page drives the rounds one request at a time:
//
//   think   the model reads the conversation so far and either answers or asks
//           for lookups
//   tools   the lookups it asked for are run against the database
//
// Nothing is stored here. The conversation lives in the admin's browser and is
// sent back each round.

const SYSTEM = `You answer an admin's questions about YiddisheKop, a recruiting agency that places Jewish candidates in remote jobs. The admin manages candidates, employers and jobs; you can look all of them up with your tools.

Answer from the records. Everything you say about a candidate, a job or an employer must come from what your tools returned in this conversation. If the records don't say, say that plainly — don't fill the gap from general knowledge or a guess, and don't round a "probably" up to a fact. When the answer depends on what a résumé or an interview actually says, read it rather than relying on the AI summary card, and quote a few words when the exact wording matters.

When asked to find people, search with more than one keyword (synonyms, related tools, spellings) before concluding nobody fits, and mention what you searched for if you found little.

Link every candidate you name, so the admin can open them: [Full Name](/dashboard/admin/candidates/ID) for a profile, [Full Name](/dashboard/admin/video-candidates/ID) for a video-only candidate. Jobs: [Job title](/dashboard/admin/matching?job=ID).

Keep answers short and easy to scan. Lead with the answer. Use short "- " bullet lists for several people or points and **bold** sparingly; no headings and no tables. The admin may see candidates' contact details — give them when asked.`

type Body =
  | { stage: 'think'; messages: Anthropic.Beta.BetaMessageParam[] }
  | { stage: 'tools'; calls: { id: string; name: string; input: unknown }[] }

// A conversation larger than this is not something this page produces.
const MAX_BODY_CHARS = 3_000_000

export async function POST(req: Request) {
  const refused = await refuseUnlessAdmin()
  if (refused) return refused

  const raw = await req.text()
  if (raw.length > MAX_BODY_CHARS) return new Response('This conversation is too long. Start a new chat.', { status: 413 })
  let body: Body
  try { body = JSON.parse(raw) as Body } catch { return new Response('Bad request', { status: 400 }) }

  if (body.stage === 'tools') {
    if (!Array.isArray(body.calls) || body.calls.length === 0 || body.calls.length > 10) {
      return new Response('Bad request', { status: 400 })
    }
    // The admin's own session: the lookups see what the admin may see.
    const db = await createClient()
    const results = await Promise.all(body.calls.map(call => runTool(db, call)))
    return Response.json({ results })
  }

  if (body.stage !== 'think' || !Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response('Bad request', { status: 400 })
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response('ANTHROPIC_API_KEY is not set in the environment variables.', { status: 500 })
  }

  try {
    const message = await think(body.messages)
    return Response.json({
      content: message.content,
      stop_reason: message.stop_reason,
      cost_usd: costWithCacheUsd(ASSISTANT_MODEL, message.usage),
    })
  } catch (err) {
    console.error('assistant failed:', err)
    return new Response(describeAiFailure(err), { status: 502 })
  }
}

async function think(messages: Anthropic.Beta.BetaMessageParam[]): Promise<Anthropic.Beta.BetaMessage> {
  const params: Anthropic.Beta.MessageCreateParamsNonStreaming = {
    model: ASSISTANT_MODEL,
    max_tokens: 16_000,
    system: `${SYSTEM}\n\nToday is ${new Date().toISOString().slice(0, 10)}.`,
    tools: TOOLS,
    messages,
    // Thinking is always on for this model; effort sets how hard it works.
    // Looking things up and reporting them doesn't need the deepest setting.
    output_config: { effort: 'medium' },
    // Each round resends the conversation so far; caching makes the repeat
    // a fraction of the price.
    cache_control: { type: 'ephemeral' },
  }
  try {
    // If the model declines on a safety classifier, the API answers on another
    // model in the same call rather than leaving the admin with nothing.
    return await getAnthropic().beta.messages.create({
      ...params,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    } as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming)
  } catch (err) {
    // Rejected outright: ask once more without the fallback option, in case
    // that is what this account doesn't accept. Anything else in the request
    // that's wrong fails the same way again and is reported.
    if (err instanceof Anthropic.BadRequestError) {
      console.error('assistant request rejected, retrying without fallbacks:', err.message)
      return getAnthropic().beta.messages.create(params)
    }
    throw err
  }
}

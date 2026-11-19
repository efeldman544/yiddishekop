import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { refuseUnlessAdmin } from '@/lib/requireAdmin'
import { ASSISTANT_MODEL, costWithCacheUsd, describeAiFailure, getAnthropic } from '@/lib/ai/models'
import { TOOLS, runTool } from '@/lib/assistant/tools'
import { ACTION_TOOLS, isAction, previewAction, runAction, type Effects } from '@/lib/assistant/actions'

export const maxDuration = 60

// The admin's assistant. One question can take several rounds — search, open a
// profile, read a résumé — and all of them together can outlast a serverless
// time limit, so the chat page drives the rounds one request at a time:
//
//   think   the model reads the conversation so far and either answers or asks
//           for lookups
//   preview the changes it asked for, described from the records, for the
//           admin to confirm or cancel
//   tools   the lookups it asked for are run against the database, and the
//           changes the admin confirmed are made
//
// Nothing is stored here. The conversation lives in the admin's browser and is
// sent back each round.

const SYSTEM = `You answer an admin's questions about YiddisheKop, a recruiting agency that places Jewish candidates in remote jobs. The admin manages candidates, employers and jobs; you can look all of them up with your tools.

Answer from the records. Everything you say about a candidate, a job or an employer must come from what your tools returned in this conversation. If the records don't say, say that plainly — don't fill the gap from general knowledge or a guess, and don't round a "probably" up to a fact. When the answer depends on what a résumé or an interview actually says, read it rather than relying on the AI summary card, and quote a few words when the exact wording matters.

When asked to find people, search with more than one keyword (synonyms, related tools, spellings) before concluding nobody fits, and mention what you searched for if you found little.

Link every candidate you name, so the admin can open them: [Full Name](/dashboard/admin/candidates/ID) for a profile, [Full Name](/dashboard/admin/video-candidates/ID) for a video-only candidate. Jobs: [Job title](/dashboard/admin/matching?job=ID).

You can also make changes: change a candidate's status, mark them interviewed, set industry tags, assign or unassign them to a job, share them with an employer, add a job, add a candidate (usually from an attached résumé) and put an attached résumé on a candidate. Each change is shown to the admin to confirm before it happens, so when they ask for one, call the tool rather than asking "shall I?" in text — the confirmation card is the question. Only make changes the admin asked for. Look up ids first; never guess one. When adding a candidate from a résumé, read it, fill in what it says, and ask the admin for a required detail it doesn't have (an email address) instead of making one up. If the admin cancels, accept that and don't try again unless asked. After a change, say in a sentence what was done.

Keep answers short and easy to scan. Lead with the answer. Use short "- " bullet lists for several people or points and **bold** sparingly; no headings and no tables. The admin may see candidates' contact details — give them when asked.`

type Call = { id: string; name: string; input: unknown }
type Body =
  | { stage: 'think'; messages: Anthropic.Beta.BetaMessageParam[] }
  | { stage: 'preview'; calls: Call[] }
  // approvals: the admin's answer for each change, by tool call id. A change
  // without an explicit true is never made.
  | { stage: 'tools'; calls: Call[]; approvals?: Record<string, boolean> }

// A conversation larger than this is not something this page produces.
const MAX_BODY_CHARS = 3_000_000

export async function POST(req: Request) {
  const refused = await refuseUnlessAdmin()
  if (refused) return refused

  const raw = await req.text()
  if (raw.length > MAX_BODY_CHARS) return new Response('This conversation is too long. Start a new chat.', { status: 413 })
  let body: Body
  try { body = JSON.parse(raw) as Body } catch { return new Response('Bad request', { status: 400 }) }

  if (body.stage === 'preview' || body.stage === 'tools') {
    if (!Array.isArray(body.calls) || body.calls.length === 0 || body.calls.length > 10) {
      return new Response('Bad request', { status: 400 })
    }
    // The admin's own session: lookups and changes see and do what the admin may.
    const db = await createClient()

    if (body.stage === 'preview') {
      const previews = await Promise.all(body.calls.filter(c => isAction(c.name)).map(async c => ({ id: c.id, ...(await previewAction({ db }, c)) })))
      return Response.json({ previews })
    }

    const approvals = body.approvals ?? {}
    const effects: Effects[] = []
    const results = await Promise.all(body.calls.map(async call => {
      if (!isAction(call.name)) return runTool(db, call)
      if (approvals[call.id] !== true) {
        return { type: 'tool_result' as const, tool_use_id: call.id, content: 'The admin cancelled this change. It was not made.' }
      }
      const { result, effects: e } = await runAction({ db }, call)
      effects.push(e)
      return result
    }))
    return Response.json({ results, effects })
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
    tools: [...TOOLS, ...ACTION_TOOLS],
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
    // Rejected outright: ask once more in the plainest form — no fallback
    // option, no strict tool schemas — in case one of those is what this
    // account doesn't accept. Anything else wrong fails again and is reported.
    if (err instanceof Anthropic.BadRequestError) {
      console.error('assistant request rejected, retrying in the plainest form:', err.message)
      return getAnthropic().beta.messages.create({
        ...params,
        tools: params.tools?.map(t => ('strict' in t ? { ...t, strict: undefined } : t)),
      })
    }
    throw err
  }
}

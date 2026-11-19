import Anthropic from '@anthropic-ai/sdk'

// SERVER ONLY.
//
// Which model does which job, and what each costs, in one place — so changing
// a model is one line here rather than a hunt through prompts, and so the
// figures the admin is shown are computed from the same table the calls use.

/** Reads a candidate's resume, transcript and profile into a card. Paid once per candidate. */
export const CARD_MODEL = 'claude-haiku-5-5'
/** Scores every card against a job. The high-volume call, so the cheap model. */
export const SCORE_MODEL = 'claude-haiku-5-5'
/** The full write-up behind the Analyze button: whole resume, whole transcript. */
export const DEEP_MODEL = 'claude-sonnet-5-5'
/**
 * Resumes that are photos or scans. Reading a blurry phone photo is where the
 * cheap model misreads, and a misread here is permanent — it becomes the text
 * every later match is made from — so these go to the stronger one.
 */
export const IMAGE_MODEL = 'claude-sonnet-5-5'
/**
 * The admin's assistant: answers questions about candidates by looking them up.
 * The strongest model, because a wrong answer here is taken as fact.
 */
export const ASSISTANT_MODEL = 'claude-opus-5-5'

/** US dollars per million tokens: [input, output]. */
const PRICES: Record<string, [number, number]> = {
  // The rate for prompts up to 100K tokens, which is every prompt this app
  // sends. Longer prompts are billed on a higher card.
  'claude-haiku-5-5': [0.1, 0.5],
  'claude-sonnet-5-5': [2, 10],
  'claude-opus-5-5': [4, 20],
}

/** Cached-prompt prices, dollars per million tokens: [cache write, cache read]. */
const CACHE_PRICES: Record<string, [number, number]> = {
  'claude-opus-5-5': [5, 0.2],
}

/** What a call cost including prompt caching, in dollars. */
export function costWithCacheUsd(model: string, usage: {
  input_tokens: number; output_tokens: number
  cache_creation_input_tokens?: number | null; cache_read_input_tokens?: number | null
}): number {
  const [write, read] = CACHE_PRICES[model] ?? [0, 0]
  return costUsd(model, usage.input_tokens, usage.output_tokens)
    + ((usage.cache_creation_input_tokens ?? 0) * write + (usage.cache_read_input_tokens ?? 0) * read) / 1_000_000
}

/** What a call cost, in dollars. Unknown models count as zero rather than a guess. */
export function costUsd(model: string, inputTokens: number, outputTokens: number): number {
  const price = PRICES[model]
  if (!price) return 0
  return (inputTokens * price[0] + outputTokens * price[1]) / 1_000_000
}

// Constructed lazily — building at module level crashes the whole route when
// the key is missing.
let client: Anthropic | null = null
export function getAnthropic(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 3 })
  return client
}

/** A failure with a sentence fit to show an admin. */
export class AiError extends Error {}

/**
 * The JSON a structured-output call returned.
 *
 * These models think before they answer, so the reply can open with thinking
 * blocks and the answer is whichever block is text — never "the first one".
 * And a reply is not always an answer: the model can decline, or run out of
 * room part-way through, and both arrive as an ordinary successful response.
 * Reading the text without checking would hand half a JSON object, or nothing,
 * to the parser and report it as a parse error.
 */
export function readJson<T>(message: Anthropic.Message): T {
  if (message.stop_reason === 'refusal') {
    throw new AiError('The AI declined to process this one.')
  }
  if (message.stop_reason === 'max_tokens') {
    throw new AiError('The AI ran out of room before finishing its answer.')
  }
  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim()
  if (!text) throw new AiError('The AI returned an empty answer.')
  try {
    return JSON.parse(text) as T
  } catch {
    throw new AiError('The AI returned something that was not valid JSON.')
  }
}

/** A sentence for whatever the SDK threw, most specific first. */
export function describeAiFailure(err: unknown): string {
  if (err instanceof AiError) return err.message
  if (err instanceof Anthropic.AuthenticationError) return 'The Anthropic API key was rejected. Check ANTHROPIC_API_KEY in Vercel.'
  if (err instanceof Anthropic.PermissionDeniedError) return 'This Anthropic account does not have access to the model.'
  if (err instanceof Anthropic.NotFoundError) return 'The AI model was not found for this Anthropic account.'
  if (err instanceof Anthropic.RateLimitError) return 'The AI is rate limited right now. Wait a minute and try again.'
  if (err instanceof Anthropic.BadRequestError) return `The AI rejected the request: ${err.message}`
  if (err instanceof Anthropic.APIConnectionError) return 'Could not reach the AI service.'
  if (err instanceof Anthropic.APIError) return `The AI service returned an error (${err.status}).`
  return err instanceof Error ? err.message : 'Something went wrong calling the AI.'
}

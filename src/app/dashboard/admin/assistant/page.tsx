'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type Anthropic from '@anthropic-ai/sdk'
import { describeCall } from '@/lib/assistant/labels'
import { humanError } from '@/lib/errorMessage'
import ErrorNote from '@/components/ErrorNote'

// Ask questions about candidates, résumés, interviews and jobs, answered from
// the records. The page runs the conversation: it asks the model, runs the
// lookups the model asks for, and repeats until there is an answer — one
// request per round, so no single request has to last long.
//
// The conversation is kept in this browser tab, so following a link to a
// candidate and coming back keeps it.

type Msg = Anthropic.Beta.BetaMessageParam
type Block = Anthropic.Beta.BetaContentBlock
type ToolUse = Anthropic.Beta.BetaToolUseBlock

const STORE_KEY = 'admin-assistant:v1'
// Rounds of lookups for one question before stopping to ask the admin.
const MAX_ROUNDS = 12

const SUGGESTIONS = [
  'Who has QuickBooks experience?',
  'Which candidates speak Hebrew and have worked in bookkeeping?',
  'Who are the strongest candidates for our newest open job, and why?',
  'Which video-interview candidates mentioned customer service?',
]

async function post<T>(body: object): Promise<T> {
  const res = await fetch('/api/admin/assistant', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error((await res.text().catch(() => '')) || `HTTP ${res.status}`)
  return res.json() as Promise<T>
}

function load(): { messages: Msg[]; cost: number } {
  try {
    const raw = sessionStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { messages: [], cost: 0 }
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [cost, setCost] = useState(0)
  const [input, setInput] = useState('')
  const [activity, setActivity] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [restored, setRestored] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)
  const busy = activity !== null

  // Restored after the first paint (sessionStorage doesn't exist on the server).
  useEffect(() => {
    const t = setTimeout(() => {
      const saved = load()
      setMessages(saved.messages)
      setCost(saved.cost)
      setRestored(true)
    }, 0)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    if (!restored) return
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ messages, cost })) } catch {}
  }, [messages, cost, restored])
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }) }, [messages, activity])

  /** Keep going until the model answers, it has looked things up MAX_ROUNDS times, or something fails. */
  async function run(start: Msg[]) {
    let convo = start
    setError(null)
    try {
      for (let round = 0; round < MAX_ROUNDS; round++) {
        setActivity('Thinking…')
        const reply = await post<{ content: Block[]; stop_reason: string; cost_usd: number }>({ stage: 'think', messages: convo })
        setCost(c => c + (reply.cost_usd ?? 0))
        // The whole reply goes back next round exactly as it came — thinking
        // blocks included — or the model loses track of its own reasoning.
        convo = [...convo, { role: 'assistant', content: reply.content as unknown as Msg['content'] }]
        setMessages(convo)

        if (reply.stop_reason === 'tool_use') {
          const calls = reply.content.filter((b): b is ToolUse => b.type === 'tool_use')
          setActivity(calls.map(c => describeCall(c.name, c.input as Record<string, unknown>)).join(' · ') + '…')
          let results: Anthropic.Beta.BetaToolResultBlockParam[]
          try {
            results = (await post<{ results: Anthropic.Beta.BetaToolResultBlockParam[] }>({
              stage: 'tools', calls: calls.map(c => ({ id: c.id, name: c.name, input: c.input })),
            })).results
          } catch (e) {
            // Every lookup asked for needs an answer, or the conversation can't
            // continue; a failure is an answer the model can explain.
            const why = humanError(e, 'The lookup failed.')
            results = calls.map(c => ({ type: 'tool_result', tool_use_id: c.id, content: why, is_error: true }))
          }
          convo = [...convo, { role: 'user', content: results }]
          setMessages(convo)
          continue
        }
        if (reply.stop_reason === 'max_tokens') setError('The answer was cut off because it ran too long. Ask for a shorter answer or a narrower question.')
        if (reply.stop_reason === 'refusal') setError('The AI declined to answer that one.')
        return
      }
      setError(`Stopped after ${MAX_ROUNDS} rounds of lookups. Ask it to continue, or narrow the question.`)
    } catch (e) {
      setError(humanError(e, 'Couldn’t reach the assistant.'))
    } finally {
      setActivity(null)
    }
  }

  function ask(text: string) {
    const question = text.trim()
    if (!question || busy) return
    setInput('')
    const next: Msg[] = [...messages, { role: 'user', content: question }]
    setMessages(next)
    run(next)
  }

  function newChat() {
    if (busy) return
    setMessages([]); setCost(0); setError(null)
  }

  // A failed round leaves the conversation waiting on the model; Retry asks again.
  const last = messages[messages.length - 1]
  const canRetry = !busy && !!error && last?.role === 'user'

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-8 pt-8 pb-4">
        <div>
          <h1 className="page-title">Assistant</h1>
          <p className="text-sm text-gray-500 mt-1">Ask about candidates, résumés, interviews and jobs. Answers come from the records on file.</p>
        </div>
        {messages.length > 0 && (
          <button type="button" onClick={newChat} disabled={busy}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            New chat
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8">
        <div className="max-w-3xl space-y-5 pb-6">
          {restored && messages.length === 0 && (
            <div className="pt-6 space-y-3">
              <p className="text-sm text-gray-500">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map(s => (
                  <button key={s} type="button" onClick={() => ask(s)}
                    className="text-sm px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:text-indigo-700">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns(messages).map((t, i) => t.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm text-white whitespace-pre-wrap">{t.text}</div>
            </div>
          ) : (
            <div key={i} className="space-y-1.5">
              {t.lookups.length > 0 && (
                <p className="text-[11px] text-gray-400">Looked up: {[...new Set(t.lookups)].join(' · ')}</p>
              )}
              {t.text && (
                <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 shadow-sm">
                  <Answer text={t.text} />
                </div>
              )}
            </div>
          ))}

          {activity && (
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
              {activity}
            </p>
          )}
          {error && (
            <div className="space-y-2">
              <ErrorNote>{error}</ErrorNote>
              {canRetry && (
                <button type="button" onClick={() => run(messages)} className="text-xs font-medium text-indigo-600 hover:underline">Try again</button>
              )}
            </div>
          )}
          <div ref={bottom} />
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); ask(input) }} className="border-t border-gray-100 bg-white px-8 py-4">
        <div className="max-w-3xl flex items-end gap-2">
          <textarea value={input} onChange={e => setInput(e.target.value)} rows={1}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input) } }}
            placeholder="Ask about a candidate, a skill, an interview, a job…"
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-300 max-h-40" />
          <button type="submit" disabled={busy || !input.trim()}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            Ask
          </button>
        </div>
        {cost > 0 && <p className="max-w-3xl mt-2 text-[11px] text-gray-400">This chat has cost about ${cost < 0.01 ? '0.01' : cost.toFixed(2)} in AI usage.</p>}
      </form>
    </div>
  )
}

type Turn = { role: 'user'; text: string } | { role: 'assistant'; text: string; lookups: string[] }

/** The conversation as the admin sees it: questions, answers, and what was looked up on the way. */
function turns(messages: Msg[]): Turn[] {
  const out: Turn[] = []
  for (const m of messages) {
    if (m.role === 'user') {
      if (typeof m.content === 'string') out.push({ role: 'user', text: m.content })
      continue // lookup results aren't shown
    }
    const blocks = (Array.isArray(m.content) ? m.content : []) as Block[]
    const text = blocks.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map(b => b.text).join('\n\n').trim()
    const lookups = blocks.filter((b): b is ToolUse => b.type === 'tool_use').map(b => describeCall(b.name, b.input as Record<string, unknown>))
    // Consecutive rounds of one answer are shown as one.
    const prev = out[out.length - 1]
    if (prev && prev.role === 'assistant') {
      prev.lookups.push(...lookups)
      if (text) prev.text = prev.text ? `${prev.text}\n\n${text}` : text
    } else {
      out.push({ role: 'assistant', text, lookups })
    }
  }
  return out
}

/** The few bits of formatting the assistant uses: paragraphs, "- " lists, **bold** and links to admin pages. */
function Answer({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/)
  return (
    <div className="space-y-2.5">
      {blocks.map((block, i) => {
        const lines = block.split('\n')
        if (lines.every(l => /^\s*[-*•] /.test(l))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => <li key={j}><Inline text={l.replace(/^\s*[-*•] /, '')} /></li>)}
            </ul>
          )
        }
        return (
          <p key={i}>
            {lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}<Inline text={l} /></Fragment>)}
          </p>
        )
      })}
    </div>
  )
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g)
  return (
    <>
      {parts.map((part, i) => {
        const bold = /^\*\*([^*]+)\*\*$/.exec(part)
        if (bold) return <strong key={i} className="font-semibold text-gray-950">{bold[1]}</strong>
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
        // Only links into the admin pages become links; anything else is shown as text.
        if (link && link[2].startsWith('/dashboard/admin/')) {
          return <Link key={i} href={link[2]} className="font-medium text-indigo-700 hover:underline">{link[1]}</Link>
        }
        if (link) return <Fragment key={i}>{link[1]}</Fragment>
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}

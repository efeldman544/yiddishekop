'use client'

import { Fragment, Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type Anthropic from '@anthropic-ai/sdk'
import { ACTION_NAMES, describeCall } from '@/lib/assistant/labels'
import { humanError } from '@/lib/errorMessage'
import ErrorNote from '@/components/ErrorNote'
import { notifyAssigned } from '@/lib/notifyAssigned'
import { refreshCandidateCard } from '@/lib/refreshCard'
import { useToast } from '@/components/Toaster'
import { useQueryParams } from '@/lib/useQueryParams'

// Ask questions about candidates, résumés, interviews and jobs, answered from
// the records. The page runs the conversation: it asks the model, runs the
// lookups the model asks for, and repeats until there is an answer — one
// request per round, so no single request has to last long.
//
// Each chat is saved (supabase/assistant_chats.sql) as it goes and listed
// under Recent chats; the open one is in the address (?chat=), and is also
// kept in this tab so following a link to a candidate and coming back is
// instant.
//
// When the model asks to change something, the loop stops and shows a card
// for each change, worded by the server from the records. It carries on once
// every card is confirmed or cancelled; only confirmed ones are made.

type Msg = Anthropic.Beta.BetaMessageParam
type Block = Anthropic.Beta.BetaContentBlock
type ToolUse = Anthropic.Beta.BetaToolUseBlock

const STORE_KEY = 'admin-assistant:v2'
// A chat older than this gets a note that the records may have moved on.
const STALE_MS = 24 * 3_600_000

type ChatSummary = { id: string; title: string; cost_usd: number; updated_at: string }
// Rounds of lookups for one question before stopping to ask the admin.
const MAX_ROUNDS = 12

type Preview = { id: string; title: string; lines: string[]; warning?: string; error?: string }
type Effects = {
  notify?: { candidate_id: string; job_id: string } | { candidate_id: string; employer_id: string }
  refreshCard?: string
}
/** A round waiting on the admin: the changes it asked for, and the answers so far. */
type Pending = { convo: Msg[]; calls: ToolUse[]; previews: Preview[]; decisions: Record<string, boolean> }
type Attachment = { file_id: string; name: string }

const ACTIONS = new Set(ACTION_NAMES)
// How an attached file is named in the message the model reads; the chat
// shows it as a chip instead.
const ATTACHMENT_LINE = /^\[Attached: (.+) — file_id: (\S+)\]$/

const SUGGESTIONS = [
  'Who has QuickBooks experience?',
  'Which candidates speak Hebrew and have worked in bookkeeping?',
  'Who are the strongest candidates for our newest open job, and why?',
  'Which video-interview candidates mentioned customer service?',
  'Mark the most recent candidate as interviewed',
]

/** Tool calls as the server takes them. */
const wire = (calls: ToolUse[]) => calls.map(c => ({ id: c.id, name: c.name, input: c.input }))

async function post<T>(body: object): Promise<T> {
  const res = await fetch('/api/admin/assistant', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error((await res.text().catch(() => '')) || `HTTP ${res.status}`)
  return res.json() as Promise<T>
}

/**
 * A chat left waiting on a confirmation — the tab was closed, or it was saved
 * mid-question — gets those changes recorded as not made, or it can't go on.
 */
function closeUnanswered(messages: Msg[]): Msg[] {
  const last = messages[messages.length - 1]
  const unanswered = last?.role === 'assistant' && Array.isArray(last.content)
    ? (last.content as Block[]).filter((b): b is ToolUse => b.type === 'tool_use') : []
  if (!unanswered.length) return messages
  return [...messages, {
    role: 'user',
    content: unanswered.map(c => ({ type: 'tool_result' as const, tool_use_id: c.id, content: 'Not done: the chat was closed before this was confirmed.' })),
  }]
}

function load(): { chatId: string | null; messages: Msg[]; cost: number } {
  try {
    const raw = sessionStorage.getItem(STORE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as { chatId: string | null; messages: Msg[]; cost: number }
      return { ...saved, messages: closeUnanswered(saved.messages) }
    }
  } catch {}
  return { chatId: null, messages: [], cost: 0 }
}

/** What the chat is called in the list: its first question. */
function chatTitle(messages: Msg[]): string {
  const first = messages.find(m => m.role === 'user' && typeof m.content === 'string')
  const text = typeof first?.content === 'string' ? first.content.split('\n\n')[0] : ''
  return text.trim().slice(0, 120) || 'Untitled chat'
}

function when(iso: string): string {
  const d = new Date(iso)
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

async function chatsApi<T>(method: 'GET' | 'POST' | 'DELETE', query = '', body?: object): Promise<{ status: number; data: T | null; text: string }> {
  const res = await fetch(`/api/admin/assistant/chats${query}`, {
    method, ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  })
  const text = await res.text().catch(() => '')
  let data: T | null = null
  try { data = JSON.parse(text) as T } catch {}
  return { status: res.status, data, text }
}

// useSearchParams (for ?chat=) needs a Suspense boundary above it.
export default function AssistantPageWithChats() {
  return (
    <Suspense fallback={null}>
      <AssistantPage />
    </Suspense>
  )
}

function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [cost, setCost] = useState(0)
  const [input, setInput] = useState('')
  const [activity, setActivity] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [restored, setRestored] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const bottom = useRef<HTMLDivElement>(null)
  const toast = useToast()
  const busy = activity !== null || pending !== null || uploading

  // Saved chats. `historyReady` is false until the SQL has been run.
  const [params, setParams] = useQueryParams()
  const chatParam = params.get('chat')
  const [chatId, setChatId] = useState<string | null>(null)
  const [chats, setChats] = useState<ChatSummary[] | null>(null)
  const [historyReady, setHistoryReady] = useState<boolean | null>(null)
  const [keepDays, setKeepDays] = useState(60)
  /** When the open chat was last used, if that was long enough ago to warn about. */
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const [saveNote, setSaveNote] = useState<string | null>(null)
  const [hiddenChats, setHiddenChats] = useState<ReadonlySet<string>>(new Set())
  // What was last saved (or loaded), so opening a chat doesn't save it again —
  // that would move it to the top, reset its date and restart its 60 days.
  const savedSnapshot = useRef<string | null>(null)
  const snapshot = (m: Msg[], c: number) => JSON.stringify([m, c])

  async function refreshList() {
    const r = await chatsApi<{ ready: boolean; chats?: ChatSummary[]; keepDays?: number }>('GET')
    if (r.status === 409) { setHistoryReady(false); return }
    if (r.data?.chats) { setChats(r.data.chats); setHistoryReady(true); if (r.data.keepDays) setKeepDays(r.data.keepDays) }
  }

  async function openChat(id: string) {
    if (activity !== null || uploading) return
    const r = await chatsApi<{ chat?: ChatSummary & { messages: Msg[] } }>('GET', `?id=${encodeURIComponent(id)}`)
    if (!r.data?.chat) { setError(r.status === 404 ? 'That chat no longer exists.' : 'Couldn’t open that chat.'); setParams({ chat: null }); return }
    const loaded = closeUnanswered(r.data.chat.messages)
    const loadedCost = Number(r.data.chat.cost_usd) || 0
    savedSnapshot.current = snapshot(r.data.chat.messages, loadedCost)
    setMessages(loaded)
    setCost(loadedCost)
    setChatId(id)
    // An old chat gets a note that the records may have moved on since.
    const updated = r.data.chat.updated_at
    setOpenedAt(Date.now() - new Date(updated).getTime() > STALE_MS ? updated : null)
    setPending(null); setError(null); setAttachments([])
    setParams({ chat: id })
  }

  // Restored after the first paint (sessionStorage doesn't exist on the server):
  // the chat named in the address if there is one, else whatever this tab had.
  useEffect(() => {
    const t = setTimeout(() => {
      const saved = load()
      if (chatParam && chatParam !== saved.chatId) {
        openChat(chatParam).finally(() => setRestored(true))
      } else {
        savedSnapshot.current = snapshot(saved.messages, saved.cost)
        setMessages(saved.messages)
        setCost(saved.cost)
        setChatId(saved.chatId)
        if (saved.chatId && !chatParam) setParams({ chat: saved.chatId })
        setRestored(true)
      }
      refreshList()
    }, 0)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!restored) return
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ chatId, messages, cost })) } catch {}
  }, [chatId, messages, cost, restored])

  // Saved a moment after each change, so a chat is never more than a round behind.
  useEffect(() => {
    if (!restored || !chatId || messages.length === 0 || historyReady === false) return
    const current = snapshot(messages, cost)
    if (current === savedSnapshot.current) return
    const t = setTimeout(async () => {
      const title = chatTitle(messages)
      const r = await chatsApi('POST', '', { id: chatId, title, messages, cost_usd: cost })
      if (r.status === 409) { setHistoryReady(false); return }
      if (r.status === 413) { setSaveNote('This chat is too long to save any more. Start a new one to keep saving.'); return }
      if (r.status >= 400) { setSaveNote('Couldn’t save this chat just now; it will try again with the next message.'); return }
      savedSnapshot.current = current
      setSaveNote(null)
      setHistoryReady(true)
      const now = new Date().toISOString()
      setChats(prev => [{ id: chatId, title, cost_usd: cost, updated_at: now }, ...(prev ?? []).filter(c => c.id !== chatId)])
    }, 1200)
    return () => clearTimeout(t)
  }, [messages, cost, chatId, restored, historyReady])

  function deleteChat(id: string) {
    setHiddenChats(prev => new Set(prev).add(id))
    if (id === chatId) newChat()
    toast.undoable({
      message: 'Chat deleted',
      failure: 'Couldn’t delete that chat, so it has been put back.',
      commit: async () => {
        const r = await chatsApi('DELETE', `?id=${encodeURIComponent(id)}`)
        if (r.status >= 400) throw new Error(r.text)
        setChats(prev => (prev ?? []).filter(c => c.id !== id))
      },
      restore: () => setHiddenChats(prev => { const next = new Set(prev); next.delete(id); return next }),
    })
  }
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }) }, [messages, activity, pending])

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
          if (calls.some(c => ACTIONS.has(c.name))) {
            // A change: stop here and ask the admin. decide() carries on.
            setActivity('Getting the change ready for you to confirm…')
            const { previews } = await post<{ previews: Preview[] }>({ stage: 'preview', calls: wire(calls) })
            setPending({ convo, calls, previews, decisions: {} })
            return
          }
          setActivity(calls.map(c => describeCall(c.name, c.input as Record<string, unknown>)).join(' · ') + '…')
          convo = [...convo, { role: 'user', content: await runCalls(calls, {}) }]
          setMessages(convo)
          continue
        }
        if (reply.stop_reason === 'max_tokens') setError('The answer was cut off because it ran too long. Ask for a shorter answer or a narrower question.')
        if (reply.stop_reason === 'refusal') setError('The AI declined to answer that one.')
        return
      }
      setError(`Stopped after ${MAX_ROUNDS} rounds of lookups. Ask it to continue, or narrow the question.`)
    } catch (e) {
      // This page is for the admin only, so the server's own sentence is shown
      // as it is — it names what went wrong, where the general error tidier
      // would hide it behind "something went wrong".
      const raw = e instanceof Error ? e.message.trim() : ''
      const friendly = humanError(e, '')
      setError(friendly && friendly !== raw ? friendly : `Couldn’t get an answer${raw ? `: ${raw.slice(0, 400)}` : '.'}`)
    } finally {
      setActivity(null)
    }
  }

  /** Run a round's calls: lookups always, changes only where the admin said yes. */
  async function runCalls(calls: ToolUse[], approvals: Record<string, boolean>): Promise<Anthropic.Beta.BetaToolResultBlockParam[]> {
    try {
      const { results, effects } = await post<{ results: Anthropic.Beta.BetaToolResultBlockParam[]; effects?: Effects[] }>({
        stage: 'tools', calls: wire(calls), approvals,
      })
      for (const e of effects ?? []) {
        // The same follow-ups the rest of the admin site does after these changes.
        if (e.notify) notifyAssigned(e.notify, msg => toast.show(`Done, but the employer wasn’t notified: ${humanError(msg, 'unknown error')}`, 'error'))
        if (e.refreshCard) refreshCandidateCard(e.refreshCard, { force: true })
      }
      return results
    } catch (e) {
      // Every call needs an answer, or the conversation can't continue; a
      // failure is an answer the model can explain.
      const why = humanError(e, 'The request failed.')
      return calls.map(c => ({ type: 'tool_result', tool_use_id: c.id, content: why, is_error: true }))
    }
  }

  /** The admin's answer to one card. Once every card has one, the round carries on. */
  async function decide(id: string, approve: boolean) {
    if (!pending) return
    const decisions = { ...pending.decisions, [id]: approve }
    const next = { ...pending, decisions }
    setPending(next)
    if (pending.previews.some(p => !(p.id in decisions))) return
    setPending(null)
    setActivity(Object.values(decisions).some(Boolean) ? 'Making the change…' : 'Telling the assistant…')
    const results = await runCalls(next.calls, decisions)
    const convo: Msg[] = [...next.convo, { role: 'user', content: results }]
    setMessages(convo)
    run(convo)
  }

  async function attach(file: File) {
    setUploading(true); setError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/admin/assistant/upload', { method: 'POST', body })
      if (!res.ok) throw new Error((await res.text().catch(() => '')) || `HTTP ${res.status}`)
      const a = await res.json() as Attachment
      setAttachments(prev => [...prev, a])
    } catch (e) {
      setError(humanError(e, 'Couldn’t attach that file.'))
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  function ask(text: string) {
    const typed = text.trim()
    if ((!typed && attachments.length === 0) || busy) return
    const question = [
      typed || 'I’ve attached a file.',
      ...attachments.map(a => `[Attached: ${a.name} — file_id: ${a.file_id}]`),
    ].join('\n\n')
    setInput('')
    setAttachments([])
    // A new chat gets its id with its first question, and is saved from then on.
    if (!chatId) {
      const id = crypto.randomUUID()
      setChatId(id)
      setOpenedAt(null)
      setParams({ chat: id })
    }
    const next: Msg[] = [...messages, { role: 'user', content: question }]
    setMessages(next)
    run(next)
  }

  function newChat() {
    if (activity !== null || uploading) return
    setMessages([]); setCost(0); setError(null); setPending(null); setAttachments([])
    setChatId(null); setOpenedAt(null); setSaveNote(null)
    setParams({ chat: null })
  }

  // A failed round leaves the conversation waiting on the model; Retry asks again.
  const last = messages[messages.length - 1]
  const canRetry = !busy && !!error && last?.role === 'user'

  const shownChats = (chats ?? []).filter(c => !hiddenChats.has(c.id))
  // Set only when an old chat is opened (see openChat).
  const stale = !!openedAt

  return (
    <div className="h-full flex">
      {/* Recent chats */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-gray-100 bg-gray-50/50">
        <div className="px-4 pt-8 pb-3">
          <button type="button" onClick={newChat} disabled={activity !== null || uploading}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            + New chat
          </button>
        </div>
        <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Recent chats</p>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {historyReady === false ? (
            <p className="px-2 text-xs leading-relaxed text-gray-500">
              Chats aren’t saved yet. Run <code className="text-[11px]">supabase/assistant_chats.sql</code> in the Supabase SQL Editor once to keep them.
            </p>
          ) : chats === null ? (
            <p className="px-2 text-xs text-gray-400">Loading…</p>
          ) : shownChats.length === 0 ? (
            <p className="px-2 text-xs text-gray-400">No saved chats yet.</p>
          ) : shownChats.map(c => (
            <div key={c.id} className={`group flex items-start gap-1 rounded-lg px-2 py-2 ${c.id === chatId ? 'bg-indigo-50' : 'hover:bg-white'}`}>
              <button type="button" onClick={() => openChat(c.id)} disabled={activity !== null || uploading} className="min-w-0 flex-1 text-left">
                <span className={`block truncate text-sm ${c.id === chatId ? 'font-medium text-indigo-800' : 'text-gray-700'}`}>{c.title || 'Untitled chat'}</span>
                <span className="block text-[11px] text-gray-400">{when(c.updated_at)}</span>
              </button>
              <button type="button" onClick={() => deleteChat(c.id)} title="Delete chat" aria-label={`Delete ${c.title}`}
                className="shrink-0 px-1 text-gray-300 opacity-0 hover:text-gray-600 group-hover:opacity-100">×</button>
            </div>
          ))}
        </div>
        {historyReady && <p className="px-4 pb-4 text-[11px] text-gray-400">Chats are deleted after {keepDays} days without use.</p>}
      </aside>

    <div className="flex-1 min-w-0 h-full flex flex-col">
      <div className="flex items-center justify-between px-8 pt-8 pb-4">
        <div>
          <h1 className="page-title">Assistant</h1>
          <p className="text-sm text-gray-500 mt-1">Ask about candidates, résumés, interviews and jobs. Answers come from the records on file.</p>
        </div>
        {messages.length > 0 && (
          <button type="button" onClick={newChat} disabled={activity !== null || uploading}
            className="lg:hidden text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            New chat
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8">
        <div className="max-w-3xl space-y-5 pb-6">
          {stale && messages.length > 0 && (
            <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              This chat is from {new Date(openedAt!).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}. Records may have changed since — ask again for current details.
            </p>
          )}
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
            <div key={i} className="flex flex-col items-end gap-1.5">
              <div className="max-w-[85%] rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm text-white whitespace-pre-wrap">{t.text}</div>
              {t.files.map(f => (
                <span key={f} className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-700">📎 {f}</span>
              ))}
            </div>
          ) : (
            <div key={i} className="space-y-1.5">
              {t.lookups.length > 0 && (
                <p className="text-[11px] text-gray-400">Steps: {[...new Set(t.lookups)].join(' · ')}</p>
              )}
              {t.text && (
                <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 shadow-sm">
                  <Answer text={t.text} />
                </div>
              )}
            </div>
          ))}

          {pending && (
            <div className="space-y-3">
              {pending.previews.map(card => {
                const decided = pending.decisions[card.id]
                return (
                  <div key={card.id} className={`rounded-xl border px-4 py-3 shadow-sm ${card.error ? 'border-red-200 bg-red-50/50' : 'border-amber-200 bg-amber-50/60'}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{card.error ? `${card.title} — can’t be done` : `Confirm: ${card.title}`}</p>
                    <div className="mt-1.5 space-y-0.5 text-sm text-gray-800">
                      {card.lines.map((l, j) => <p key={j}><Inline text={l} /></p>)}
                      {card.error && <p className="text-red-700">{card.error}</p>}
                    </div>
                    {card.warning && !card.error && <p className="mt-2 text-xs text-amber-800">{card.warning}</p>}
                    <div className="mt-3 flex items-center gap-2">
                      {decided === undefined ? (
                        card.error ? (
                          <button type="button" onClick={() => decide(card.id, false)}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Dismiss</button>
                        ) : (
                          <>
                            <button type="button" onClick={() => decide(card.id, true)}
                              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">Confirm</button>
                            <button type="button" onClick={() => decide(card.id, false)}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                          </>
                        )
                      ) : (
                        <span className="text-xs font-medium text-gray-500">{decided ? 'Confirmed' : 'Cancelled'}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

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
        {(attachments.length > 0 || uploading) && (
          <div className="max-w-3xl mb-2 flex flex-wrap items-center gap-2">
            {attachments.map(a => (
              <span key={a.file_id} className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-700">
                📎 {a.name}
                <button type="button" aria-label={`Remove ${a.name}`} onClick={() => setAttachments(prev => prev.filter(x => x.file_id !== a.file_id))}
                  className="text-gray-400 hover:text-gray-700">×</button>
              </span>
            ))}
            {uploading && <span className="text-xs text-gray-400">Attaching…</span>}
          </div>
        )}
        <div className="max-w-3xl flex items-end gap-2">
          {/* A résumé to add as a candidate, or to put on one. */}
          <input ref={fileInput} type="file" className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={e => { const f = e.target.files?.[0]; if (f) attach(f) }} />
          <button type="button" onClick={() => fileInput.current?.click()} disabled={busy} title="Attach a résumé"
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50">📎</button>
          <textarea value={input} onChange={e => setInput(e.target.value)} rows={1}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input) } }}
            placeholder="Ask about a candidate, a skill, an interview, a job…"
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-300 max-h-40" />
          <button type="submit" disabled={busy || (!input.trim() && attachments.length === 0)}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            Ask
          </button>
        </div>
        {(cost > 0 || saveNote) && (
          <p className="max-w-3xl mt-2 text-[11px] text-gray-400">
            {cost > 0 && `This chat has cost about $${cost < 0.01 ? '0.01' : cost.toFixed(2)} in AI usage.`}
            {saveNote && <span className="ml-1 text-amber-700">{saveNote}</span>}
          </p>
        )}
      </form>
    </div>
    </div>
  )
}

type Turn = { role: 'user'; text: string; files: string[] } | { role: 'assistant'; text: string; lookups: string[] }

/** The conversation as the admin sees it: questions, answers, and what was looked up on the way. */
function turns(messages: Msg[]): Turn[] {
  const out: Turn[] = []
  for (const m of messages) {
    if (m.role === 'user') {
      if (typeof m.content === 'string') {
        // Attached files are named on lines of their own; shown as chips.
        const files: string[] = []
        const text = m.content.split('\n\n').filter(part => {
          const hit = ATTACHMENT_LINE.exec(part.trim())
          if (hit) files.push(hit[1])
          return !hit
        }).join('\n\n')
        out.push({ role: 'user', text, files })
      }
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

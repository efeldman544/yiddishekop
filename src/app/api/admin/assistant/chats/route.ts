import { createClient } from '@/lib/supabase/server'
import { refuseUnlessAdmin } from '@/lib/requireAdmin'

// The admin's saved Assistant chats (supabase/assistant_chats.sql).
//
//   GET            the list, newest first
//   GET ?id=       one chat, in full
//   POST           save a chat: { id, title, messages, cost_usd }
//   DELETE ?id=    delete one
//
// Each admin sees only their own (row-level security). Chats untouched for
// KEEP_DAYS are deleted whenever the list is read: they hold contact details
// and résumé excerpts, and an answer that old is likely out of date anyway.

const KEEP_DAYS = 60
// What one request may carry. A chat bigger than this isn't saved; the page says so.
const MAX_CHARS = 4_000_000

const missingTable = (message?: string) => /assistant_chats|schema cache|does not exist/i.test(message ?? '')
const notSetUp = () => Response.json({ ready: false }, { status: 409 })

export async function GET(req: Request) {
  const refused = await refuseUnlessAdmin()
  if (refused) return refused
  const db = await createClient()
  const id = new URL(req.url).searchParams.get('id')

  if (id) {
    const { data, error } = await db.from('assistant_chats')
      .select('id, title, messages, cost_usd, updated_at').eq('id', id).maybeSingle()
    if (error) return missingTable(error.message) ? notSetUp() : new Response(error.message, { status: 500 })
    if (!data) return new Response('That chat no longer exists.', { status: 404 })
    return Response.json({ ready: true, chat: data })
  }

  const cutoff = new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString()
  const prune = await db.from('assistant_chats').delete().lt('updated_at', cutoff)
  if (prune.error) return missingTable(prune.error.message) ? notSetUp() : new Response(prune.error.message, { status: 500 })

  const { data, error } = await db.from('assistant_chats')
    .select('id, title, cost_usd, updated_at').order('updated_at', { ascending: false }).limit(50)
  if (error) return missingTable(error.message) ? notSetUp() : new Response(error.message, { status: 500 })
  return Response.json({ ready: true, chats: data ?? [], keepDays: KEEP_DAYS })
}

export async function POST(req: Request) {
  const refused = await refuseUnlessAdmin()
  if (refused) return refused
  const raw = await req.text()
  if (raw.length > MAX_CHARS) return new Response('This chat is too long to save. Start a new one.', { status: 413 })
  let body: { id?: unknown; title?: unknown; messages?: unknown; cost_usd?: unknown }
  try { body = JSON.parse(raw) } catch { return new Response('Bad request', { status: 400 }) }
  if (typeof body.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.id) || !Array.isArray(body.messages)) {
    return new Response('Bad request', { status: 400 })
  }

  const db = await createClient()
  const { error } = await db.from('assistant_chats').upsert({
    id: body.id,
    title: (typeof body.title === 'string' ? body.title : '').slice(0, 200),
    messages: body.messages,
    cost_usd: typeof body.cost_usd === 'number' ? body.cost_usd : 0,
    updated_at: new Date().toISOString(),
  })
  if (error) return missingTable(error.message) ? notSetUp() : new Response(error.message, { status: 500 })
  return Response.json({ ready: true, saved: true })
}

export async function DELETE(req: Request) {
  const refused = await refuseUnlessAdmin()
  if (refused) return refused
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return new Response('Bad request', { status: 400 })
  const db = await createClient()
  const { error } = await db.from('assistant_chats').delete().eq('id', id)
  if (error) return missingTable(error.message) ? notSetUp() : new Response(error.message, { status: 500 })
  return Response.json({ ready: true, deleted: true })
}

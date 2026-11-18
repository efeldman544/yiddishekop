import { createClient } from '@/lib/supabase/server'
import { refuseUnlessAdmin } from '@/lib/requireAdmin'
import { fetchAll } from '@/lib/matchPool'
import { checkRedaction } from '@/lib/redactionCheck'

export const maxDuration = 60

// The admin's redaction check: is anything an employer can read on a resume
// that shouldn't be?
//
//   list   every candidate with a resume
//   check  one candidate: get the resume exactly as an employer would, then
//          read the result back with OCR and look for what should be hidden
//
// The checking itself is in src/lib/redactionCheck.ts.

export async function POST(req: Request) {
  const refused = await refuseUnlessAdmin()
  if (refused) return refused

  const body = await req.json().catch(() => null)
  const supabase = await createClient()

  if (body?.stage === 'list') {
    const rows = await fetchAll<{ id: string; full_name: string | null }>((from, to) =>
      supabase.from('candidate_profiles').select('id, full_name')
        .not('resume_url', 'is', null).neq('resume_url', '')
        .order('created_at', { ascending: false }).range(from, to))
    return Response.json({ candidates: rows.map(r => ({ id: r.id, name: r.full_name })) })
  }

  if (body?.stage === 'check' && typeof body.id === 'string') {
    try {
      return Response.json(await checkRedaction(supabase, body.id))
    } catch (e) {
      console.error(`redaction check failed for ${body.id}:`, e)
      return Response.json({ id: body.id, status: 'error', message: e instanceof Error ? e.message.slice(0, 200) : 'The check failed.' })
    }
  }

  return new Response('Unknown stage', { status: 400 })
}

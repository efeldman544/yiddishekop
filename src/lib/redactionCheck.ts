// SERVER ONLY.
//
// Whether anything that should be hidden can still be read on a resume as an
// employer receives it.
//
// Reading it back as pixels is the point. The redactor decides what to cover
// from the PDF's text layer or its own OCR; this looks at the finished pages
// the way a person would, so a miss in either shows up here.

import type { SupabaseClient } from '@supabase/supabase-js'
import { withOcr } from '@/lib/ocr'
import { contactRanges, knownRanges, nameRanges } from '@/lib/redact'
import { knownFromProfile, renderPdfPages, serveResume } from '@/lib/resumeServe'

// Pages read back per resume. Resumes run one or two pages; this bounds the
// time one check can take.
const MAX_PAGES = 3

export type RedactionCheck =
  | { id: string; status: 'leak' | 'surname' | 'ok'; found: string[]; pages: number; unread: boolean }
  | { id: string; status: 'refused' | 'error'; message: string }

type Profile = { id: string; full_name: string | null; resume_url: string | null; email: string | null; phone: string | null; whatsapp: string | null }

export async function checkRedaction(supabase: SupabaseClient, id: string): Promise<RedactionCheck> {
  const { data: cp } = await supabase.from('candidate_profiles')
    .select('id, full_name, resume_url, email, phone, whatsapp').eq('id', id).maybeSingle<Profile>()
  if (!cp) return { id, status: 'error', message: 'Candidate not found.' }

  const served = await serveResume(supabase, id, 'employer')
  if (!served.ok) {
    // Not a leak: employers are shown this message instead of the resume.
    const message = (await served.text().catch(() => '')).slice(0, 300) || `HTTP ${served.status}`
    return { id, status: 'refused', message }
  }

  const pages = await renderPdfPages(new Uint8Array(await served.arrayBuffer()))
  const known = knownFromProfile(cp)
  const contacts = new Set<string>()
  let surname = false
  let readChars = 0
  await withOcr(async read => {
    for (const png of pages.slice(0, MAX_PAGES)) {
      for (const line of await read(png)) {
        readChars += line.text.replace(/\s/g, '').length
        for (const [a, b] of [...contactRanges(line.text), ...knownRanges(line.text, known)]) contacts.add(line.text.slice(a, b))
        if (nameRanges(line.text, cp.full_name).length > 0) surname = true
      }
    }
  })

  return {
    id,
    status: contacts.size > 0 ? 'leak' as const : surname ? 'surname' as const : 'ok' as const,
    // What was read, so the admin can tell a real miss from OCR misreading
    // something harmless as a phone number.
    found: [...contacts].slice(0, 5),
    pages: pages.length,
    // Hardly any text read back means the check itself couldn't see the page.
    unread: readChars < 80,
  }
}

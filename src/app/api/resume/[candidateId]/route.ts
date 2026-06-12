import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PDFParse } from 'pdf-parse'

function redact(text: string): string {
  // Remove email addresses
  text = text.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '')
  // Remove phone numbers (international and local formats)
  text = text.replace(/(\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g, '')
  text = text.replace(/\+[\d\s\-().]{7,20}/g, '')
  // Remove pdf-parse page separators
  text = text.replace(/--\s*\d+\s*of\s*\d+\s*--/g, '')
  // Clean up leftover blank lines from removals
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  const { candidateId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  if (profile?.role === 'employer') {
    const { data: myJobs } = await supabase
      .from('job_requirements')
      .select('id')
      .eq('employer_id', user.id)
    const jobIds = (myJobs ?? []).map((j: { id: string }) => j.id)
    const { data: assignment } = jobIds.length > 0
      ? await supabase
          .from('candidate_job_assignments')
          .select('id')
          .in('job_id', jobIds)
          .eq('candidate_id', candidateId)
          .maybeSingle()
      : { data: null }
    if (!assignment) return new NextResponse('Forbidden', { status: 403 })
  } else if (profile?.role !== 'admin') {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { data: cp } = await supabase
    .from('candidate_profiles')
    .select('resume_url, full_name')
    .eq('id', candidateId)
    .single<{ resume_url: string | null; full_name: string | null }>()

  if (!cp?.resume_url) return new NextResponse('No resume found', { status: 404 })

  // Supabase storage URL → download via client; external link → fetch directly
  const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resumes/`
  let buffer: Buffer
  let contentType = ''
  let pathForExt = cp.resume_url

  if (cp.resume_url.startsWith(storageBase)) {
    const storagePath = cp.resume_url.slice(storageBase.length)
    pathForExt = storagePath
    const { data: fileBlob, error: downloadError } = await supabase.storage.from('resumes').download(storagePath)
    if (downloadError || !fileBlob) return new NextResponse('Failed to fetch resume', { status: 502 })
    contentType = fileBlob.type ?? ''
    buffer = Buffer.from(await fileBlob.arrayBuffer())
  } else if (cp.resume_url.startsWith('http')) {
    // External link (e.g. admin-imported files)
    let res: Response
    try {
      res = await fetch(cp.resume_url, { signal: AbortSignal.timeout(10000) })
    } catch {
      return new NextResponse('Failed to fetch resume from external link', { status: 502 })
    }
    if (!res.ok) return new NextResponse('Failed to fetch resume from external link', { status: 502 })
    contentType = res.headers.get('content-type') ?? ''
    buffer = Buffer.from(await res.arrayBuffer())
  } else {
    return new NextResponse('Invalid resume URL', { status: 500 })
  }

  const looksLikePdf = contentType.includes('pdf')
    || pathForExt.toLowerCase().includes('.pdf')
    || buffer.subarray(0, 5).toString().startsWith('%PDF')

  let text: string
  if (looksLikePdf) {
    try {
      const parser = new PDFParse({ data: buffer })
      const result = await parser.getText()
      text = redact(result.text)
    } catch {
      return new NextResponse('Could not parse PDF', { status: 422 })
    }
  } else {
    return new NextResponse('Only PDF resumes can be viewed in redacted mode', { status: 415 })
  }

  const name = cp.full_name ? `${cp.full_name} — Resume` : 'Resume'

  // Convert plain text to HTML paragraphs with heading detection
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const bodyHtml = escaped
    .split(/\n{2,}/)
    .filter(block => block.trim())
    .map(block => {
      const trimmed = block.trim()
      // Treat as heading if: short (<= 60 chars), no sentence-ending punctuation, all-caps or title-ish
      const isHeading = trimmed.length <= 60 && !/[.?!,;]$/.test(trimmed) && (trimmed === trimmed.toUpperCase() || /^[A-Z][^a-z]{0,3}/.test(trimmed))
      const inner = trimmed.replace(/\n/g, '<br>')
      return isHeading ? `<h2>${inner}</h2>` : `<p>${inner}</p>`
    })
    .join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: #f3f4f6;
      color: #111827;
      padding: 48px 24px;
    }
    .container {
      max-width: 760px;
      margin: 0 auto;
      background: white;
      border-radius: 4px;
      border: 1px solid #d1d5db;
      padding: 56px 64px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .notice {
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-size: 11px;
      color: #9ca3af;
      text-align: center;
      margin-bottom: 36px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    h2 {
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
      margin-top: 28px;
      margin-bottom: 10px;
    }
    p {
      font-size: 14px;
      line-height: 1.8;
      color: #374151;
      margin-bottom: 10px;
    }
    p:last-child { margin-bottom: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="notice">Contact information redacted</div>
    ${bodyHtml}
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

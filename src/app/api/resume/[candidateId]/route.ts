import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PDFDocument } from 'pdf-lib'

export const maxDuration = 60

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const PHONE_RES = [
  /(\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g,
  /\+[\d\s\-().]{7,20}/g,
]

type Rect = { x: number; y: number; w: number; h: number }

// Find character ranges of contact info in a line of text
function contactRanges(line: string): [number, number][] {
  const ranges: [number, number][] = []
  for (const re of [EMAIL_RE, ...PHONE_RES]) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(line)) !== null) {
      if (m[0].length > 0) ranges.push([m.index, m.index + m[0].length])
    }
  }
  return ranges
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

  if (cp.resume_url.startsWith(storageBase)) {
    const storagePath = cp.resume_url.slice(storageBase.length)
    const { data: fileBlob, error: downloadError } = await supabase.storage.from('resumes').download(storagePath)
    if (downloadError || !fileBlob) return new NextResponse('Failed to fetch resume', { status: 502 })
    buffer = Buffer.from(await fileBlob.arrayBuffer())
  } else if (cp.resume_url.startsWith('http')) {
    // Some hosts (e.g. Wix usrfiles) reject non-browser requests, so send
    // browser-like headers and retry once on transient failures
    const fetchExternal = () => fetch(cp.resume_url!, {
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'application/pdf,application/octet-stream,*/*',
      },
    })
    let res: Response | null = null
    let lastError = ''
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        res = await fetchExternal()
        if (res.ok) break
        lastError = `link returned ${res.status}`
        res = null
      } catch (e) {
        lastError = e instanceof Error && e.name === 'TimeoutError' ? 'link timed out' : 'link unreachable'
      }
    }
    if (!res) {
      return new NextResponse(`Failed to fetch resume from external link (${lastError})`, { status: 502 })
    }
    buffer = Buffer.from(await res.arrayBuffer())
  } else {
    return new NextResponse('Invalid resume URL', { status: 500 })
  }

  if (!buffer.subarray(0, 1024).toString('latin1').includes('%PDF')) {
    // Tell the admin what the link actually served so they can fix the URL
    const head = buffer.subarray(0, 512).toString('latin1')
    let kind = 'an unsupported file type'
    if (/<!doctype html|<html/i.test(head)) {
      kind = 'a web page, not a file — the resume link should point directly to the PDF'
    } else if (head.startsWith('PK')) {
      kind = 'a Word document (.docx) — please convert it to PDF'
    }
    return new NextResponse(`This resume link serves ${kind}. Only PDF resumes can be viewed in redacted mode.`, { status: 415 })
  }

  try {
    // pdfjs + node canvas — external packages, imported dynamically (see next.config.ts)
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const { createCanvas } = await import('@napi-rs/canvas')
    const { createRequire } = await import('module')
    // Standard 14 fonts for PDFs that reference them without embedding
    const standardFontDataUrl = createRequire(import.meta.url)
      .resolve('pdfjs-dist/package.json')
      .replace('package.json', 'standard_fonts/')

    const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), standardFontDataUrl }).promise
    const SCALE = 2 // ~144dpi rendering for crisp text
    const out = await PDFDocument.create()

    let totalTextLength = 0

    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum)
      const viewport = page.getViewport({ scale: SCALE })

      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      // @ts-expect-error — @napi-rs/canvas context is API-compatible with pdfjs's expectations
      await page.render({ canvasContext: ctx, viewport }).promise

      // Locate contact info: group text items into lines, regex the joined text,
      // map matched character ranges back to the items they span
      const textContent = await page.getTextContent()
      type Item = { str: string; rect: Rect }
      const items: Item[] = []

      for (const raw of textContent.items) {
        if (!('str' in raw) || !raw.str) continue
        totalTextLength += raw.str.length
        const tx = pdfjs.Util.transform(viewport.transform, raw.transform)
        const fontHeight = Math.hypot(tx[2], tx[3])
        items.push({
          str: raw.str,
          rect: {
            x: tx[4],
            y: tx[5] - fontHeight,
            w: raw.width * SCALE,
            h: fontHeight * 1.25,
          },
        })
      }

      // Group items into visual lines by y position
      const lines = new Map<number, Item[]>()
      for (const item of items) {
        const key = Math.round(item.rect.y / 4)
        if (!lines.has(key)) lines.set(key, [])
        lines.get(key)!.push(item)
      }

      // Collect redaction boxes for this page, merging adjacent ones on the same
      // line into a single clean pill instead of several choppy rectangles
      const boxes: Rect[] = []
      for (const lineItems of lines.values()) {
        lineItems.sort((a, b) => a.rect.x - b.rect.x)
        // Join without separators so contact info split across items still matches
        let joined = ''
        const spans: { start: number; end: number; item: Item }[] = []
        for (const item of lineItems) {
          spans.push({ start: joined.length, end: joined.length + item.str.length, item })
          joined += item.str
        }
        const lineBoxes: Rect[] = []
        for (const [mStart, mEnd] of contactRanges(joined)) {
          for (const span of spans) {
            if (span.end > mStart && span.start < mEnd) {
              lineBoxes.push({ ...span.item.rect })
            }
          }
        }
        // Merge boxes on this line that touch or overlap horizontally
        lineBoxes.sort((a, b) => a.x - b.x)
        for (const b of lineBoxes) {
          const last = boxes[boxes.length - 1]
          if (last && Math.abs(last.y - b.y) < 6 && b.x <= last.x + last.w + 12) {
            last.w = Math.max(last.w, b.x + b.w - last.x)
            last.h = Math.max(last.h, b.h)
          } else {
            boxes.push(b)
          }
        }
      }

      // Soft gray pills over contact info
      for (const r of boxes) {
        const x = r.x - 4, y = r.y - 3, w = r.w + 8, h = r.h + 6
        const radius = Math.min(h / 2, 10)
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.arcTo(x + w, y, x + w, y + h, radius)
        ctx.arcTo(x + w, y + h, x, y + h, radius)
        ctx.arcTo(x, y + h, x, y, radius)
        ctx.arcTo(x, y, x + w, y, radius)
        ctx.closePath()
        ctx.fillStyle = '#eef0f3'
        ctx.fill()
        ctx.strokeStyle = '#d7dbe0'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      const png = canvas.toBuffer('image/png')
      const embedded = await out.embedPng(png)
      // Page size in points = rendered size / SCALE, preserving original dimensions
      const outPage = out.addPage([viewport.width / SCALE, viewport.height / SCALE])
      outPage.drawImage(embedded, { x: 0, y: 0, width: viewport.width / SCALE, height: viewport.height / SCALE })
    }

    await doc.destroy()

    // A scanned PDF has no text layer — we can't locate contact info, so refuse rather than leak
    if (totalTextLength < 50) {
      return new NextResponse('This resume is a scanned image and cannot be auto-redacted', { status: 422 })
    }

    const pdfBytes = await out.save()
    const name = (cp.full_name ?? 'Resume').replace(/[^\w\s.\-]/g, '')

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${name} - Resume (redacted).pdf"`,
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Resume redaction failed:', msg)
    if (/password|encrypt/i.test(msg)) {
      return new NextResponse('This PDF is password-protected and cannot be redacted', { status: 422 })
    }
    return new NextResponse(`Could not process PDF (${msg.slice(0, 200)})`, { status: 422 })
  }
}

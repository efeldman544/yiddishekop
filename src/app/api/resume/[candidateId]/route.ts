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

// Convert a .docx to PDF: mammoth → styled HTML → headless Chromium print.
// The result flows through the same pdfjs redaction pipeline as native PDFs.
async function docxToPdf(docx: Buffer): Promise<Buffer> {
  const mammoth = (await import('mammoth')).default
  const { value: html } = await mammoth.convertToHtml({ buffer: docx })

  const chromium = (await import('@sparticuz/chromium')).default
  const puppeteer = await import('puppeteer-core')
  // CHROME_EXECUTABLE_PATH lets local dev point at an installed Chrome;
  // on Vercel @sparticuz/chromium unpacks its own binary to /tmp
  const executablePath = process.env.CHROME_EXECUTABLE_PATH || await chromium.executablePath()
  const browser = await puppeteer.launch({ args: chromium.args, executablePath, headless: true })
  try {
    const page = await browser.newPage()
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8"><style>
        body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 1.45; color: #111; margin: 0; }
        h1, h2, h3 { line-height: 1.25; margin: 0.6em 0 0.3em; }
        p { margin: 0.35em 0; }
        ul, ol { margin: 0.35em 0; padding-left: 1.4em; }
        table { border-collapse: collapse; margin: 0.5em 0; }
        td, th { border: 1px solid #ccc; padding: 3px 8px; vertical-align: top; }
        img { max-width: 100%; }
      </style></head><body>${html}</body></html>`,
      { waitUntil: 'load' },
    )
    const pdf = await page.pdf({
      format: 'letter',
      margin: { top: '0.75in', bottom: '0.75in', left: '0.8in', right: '0.8in' },
      printBackground: true,
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

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
      const hint = lastError.includes('403')
        ? `The resume link is access-restricted (${lastError}). Upload the file directly to storage or use a publicly accessible link.`
        : `Failed to fetch resume from external link (${lastError}).`
      return new NextResponse(hint, { status: 502 })
    }
    buffer = Buffer.from(await res.arrayBuffer())
  } else {
    return new NextResponse('Invalid resume URL', { status: 500 })
  }

  if (!buffer.subarray(0, 1024).toString('latin1').includes('%PDF')) {
    const head = buffer.subarray(0, 512).toString('latin1')
    if (head.startsWith('PK')) {
      // Word document — convert to PDF, then redact it like any other PDF
      try {
        buffer = await docxToPdf(buffer)
      } catch (e) {
        console.error('docx conversion failed:', e)
        return new NextResponse('Could not convert this Word document to PDF', { status: 422 })
      }
    } else if (head.startsWith('\xD0\xCF\x11\xE0')) {
      return new NextResponse('This resume is a legacy .doc file — please re-save it as .docx or PDF', { status: 415 })
    } else if (/<!doctype html|<html/i.test(head)) {
      return new NextResponse('This resume link serves a web page, not a file — the link should point directly to the document.', { status: 415 })
    } else {
      return new NextResponse('This resume link serves an unsupported file type. Only PDF and Word resumes are supported.', { status: 415 })
    }
  }

  try {
    // pdfjs + node canvas — external packages, imported dynamically (see next.config.ts)
    // pdfjs 6 draws glyphs through Path2D/DOMMatrix, which Node lacks —
    // @napi-rs/canvas provides compatible ones, set before pdfjs loads
    const { createCanvas, Path2D, DOMMatrix, ImageData } = await import('@napi-rs/canvas')
    const g = globalThis as Record<string, unknown>
    g.Path2D ??= Path2D
    g.DOMMatrix ??= DOMMatrix
    g.ImageData ??= ImageData
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const fs = await import('node:fs')
    const nodePath = await import('node:path')
    // Locate pdfjs's bundled standard fonts + CID-to-Unicode CMaps on disk.
    // We must NOT use createRequire(import.meta.url).resolve('pdfjs-dist/package.json'):
    // Turbopack statically folds that call into pdfjs's numeric module id, so
    // `pkg.replace('package.json', ...)` compiled to `55876.replace(...)` and threw
    // "55876.replace is not a function" on EVERY resume. Anchor on the filesystem
    // instead — these dirs are shipped via outputFileTracingIncludes (next.config.ts).
    const pdfjsAsset = (sub: string): string | undefined => {
      for (const base of [
        nodePath.join(process.cwd(), 'node_modules/pdfjs-dist'),
        nodePath.join(process.cwd(), '.next/server/node_modules/pdfjs-dist'),
      ]) {
        const dir = nodePath.join(base, sub)
        if (fs.existsSync(dir)) return dir + '/'
      }
      return undefined
    }
    const standardFontDataUrl = pdfjsAsset('standard_fonts')
    const cMapUrl = pdfjsAsset('cmaps')

    const doc = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      standardFontDataUrl,
      cMapUrl,
      cMapPacked: true,
    }).promise
    const SCALE = 2 // ~144dpi rendering for crisp text
    const out = await PDFDocument.create()

    let totalTextLength = 0

    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      // getPage() can trigger font-table parsing; keep it inside a guard so a
      // bad page doesn't abort the whole document
      let page: Awaited<ReturnType<typeof doc.getPage>>
      try {
        page = await doc.getPage(pageNum)
      } catch (pageErr) {
        console.warn(`pdfjs getPage warning page ${pageNum}:`, pageErr)
        continue
      }
      const viewport = page.getViewport({ scale: SCALE })

      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      try {
        // @ts-expect-error — @napi-rs/canvas context is API-compatible with pdfjs's expectations
        await page.render({ canvasContext: ctx, viewport }).promise
      } catch (renderErr) {
        console.warn(`pdfjs render warning page ${pageNum}:`, renderErr)
      }

      // Locate contact info: group text items into lines, regex the joined text,
      // map matched character ranges back to the items they span.
      // If the text layer can't be read we can't locate contact info on this
      // page, so refuse rather than risk serving it unredacted.
      let textContent: Awaited<ReturnType<typeof page.getTextContent>>
      try {
        textContent = await page.getTextContent()
      } catch (textErr) {
        console.error(`text extraction failed on page ${pageNum}:`, textErr)
        return new NextResponse('This PDF has corrupted font data and cannot be auto-redacted — please re-save or re-print it as a fresh PDF', { status: 422 })
      }
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

    await doc.loadingTask.destroy()

    // A scanned PDF has no text layer — we can't locate contact info, so refuse rather than leak
    if (totalTextLength < 50) {
      return new NextResponse('This resume is a scanned image and cannot be auto-redacted', { status: 422 })
    }

    const pdfBytes = await out.save()
    const name = String(cp.full_name ?? 'Resume').replace(/[^\w\s.\-]/g, '')

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${name} - Resume (redacted).pdf"`,
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const stack = e instanceof Error && e.stack ? e.stack : ''
    console.error('Resume redaction failed:', stack || msg)
    if (/password|encrypt/i.test(msg)) {
      return new NextResponse('This PDF is password-protected and cannot be redacted', { status: 422 })
    }
    // Diagnostic detail: which build served this and where it threw, so
    // failures are traceable to an exact line instead of a guess
    const build = (process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev').slice(0, 7)
    const frames = stack.split('\n').slice(1, 4).map(f => f.trim()).join(' | ')
    return new NextResponse(
      `Could not process PDF (${msg.slice(0, 200)}) [build ${build}] ${frames.slice(0, 500)}`,
      { status: 422 },
    )
  }
}

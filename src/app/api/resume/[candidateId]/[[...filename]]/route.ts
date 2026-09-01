import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { resumeFileName } from '@/lib/resumeUrl'
import { contactRanges, findRedactionBoxes, unredactedContacts, type Rect, type TextItem } from '@/lib/redact'

export const maxDuration = 60


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

// OCR-redact an image resume (JPG/PNG): run tesseract to locate emails/phones, draw
// gray pills over them on canvas, then wrap in a PDF. Falls back to a warning stamp
// if OCR errors out.
async function imageToRedactedPdf(img: Buffer): Promise<{ pdf: Buffer; ocrFailed: boolean }> {
  type OcrBox = { x: number; y: number; w: number; h: number }
  let ocrBoxes: OcrBox[] = []
  let ocrFailed = false

  try {
    const { createWorker } = await import('tesseract.js')
    // OEM 1 = LSTM_ONLY (fast, accurate for printed text).
    // cachePath /tmp persists the downloaded traineddata across warm Lambda invocations.
    const worker = await createWorker('eng', 1, { cachePath: '/tmp', logger: () => {} })
    try {
      const { data } = await worker.recognize(img)
      type TWord = { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }
      const words = (data as unknown as { words: TWord[] }).words

      // Group words into visual lines by comparing y-center proximity
      const lines: TWord[][] = []
      for (const word of [...words].sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0)) {
        const midY = (word.bbox.y0 + word.bbox.y1) / 2
        const lineH = word.bbox.y1 - word.bbox.y0
        const existing = lines.find(l => Math.abs((l[0].bbox.y0 + l[0].bbox.y1) / 2 - midY) < lineH * 0.7)
        if (existing) existing.push(word)
        else lines.push([word])
      }

      for (const line of lines) {
        line.sort((a, b) => a.bbox.x0 - b.bbox.x0)
        let joined = ''
        const spans: { start: number; end: number; bbox: TWord['bbox'] }[] = []
        for (const w of line) {
          if (joined) joined += ' '
          spans.push({ start: joined.length, end: joined.length + w.text.length, bbox: w.bbox })
          joined += w.text
        }
        for (const [mStart, mEnd] of contactRanges(joined)) {
          const hit = spans.filter(s => s.end > mStart && s.start < mEnd)
          if (hit.length > 0) {
            ocrBoxes.push({
              x: Math.min(...hit.map(s => s.bbox.x0)),
              y: Math.min(...hit.map(s => s.bbox.y0)),
              w: Math.max(...hit.map(s => s.bbox.x1)) - Math.min(...hit.map(s => s.bbox.x0)),
              h: Math.max(...hit.map(s => s.bbox.y1)) - Math.min(...hit.map(s => s.bbox.y0)),
            })
          }
        }
      }
    } finally {
      await worker.terminate()
    }
  } catch (ocrErr) {
    console.warn('OCR redaction failed, serving with notice:', ocrErr)
    ocrFailed = true
  }

  // Draw redaction boxes on a canvas copy of the image
  const { createCanvas, loadImage } = await import('@napi-rs/canvas')
  const image = await loadImage(img)
  const canvas = createCanvas(image.width, image.height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0)

  const PAD = 5
  for (const b of ocrBoxes) {
    const x = b.x - PAD, y = b.y - PAD, bw = b.w + PAD * 2, bh = b.h + PAD * 2
    const r = Math.min(bh / 2, 8)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + bw, y, x + bw, y + bh, r)
    ctx.arcTo(x + bw, y + bh, x, y + bh, r)
    ctx.arcTo(x, y + bh, x, y, r)
    ctx.arcTo(x, y, x + bw, y, r)
    ctx.closePath()
    ctx.fillStyle = '#eef0f3'
    ctx.fill()
    ctx.strokeStyle = '#d7dbe0'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  const pngBuf = canvas.toBuffer('image/png')

  // Embed in a letter-sized PDF, fitting the image proportionally
  const pdf = await PDFDocument.create()
  const embedded = await pdf.embedPng(pngBuf)
  const scale = Math.min(612 / image.width, 792 / image.height, 1)
  const pw = image.width * scale
  const ph = image.height * scale
  const page = pdf.addPage([pw, ph])
  page.drawImage(embedded, { x: 0, y: 0, width: pw, height: ph })

  if (ocrFailed) {
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    page.drawRectangle({ x: 0, y: ph - 24, width: pw, height: 24, color: rgb(0.98, 0.93, 0.73) })
    page.drawText('Image resume — contact information could not be redacted automatically', {
      x: 8, y: ph - 16, size: 8, font, color: rgb(0.45, 0.35, 0.05),
    })
  }

  return { pdf: Buffer.from(await pdf.save()), ocrFailed }
}

export async function GET(
  _request: NextRequest,
  // `filename` is a decorative trailing segment so browsers name the saved
  // file after the candidate (see src/lib/resumeUrl.ts); it is never read.
  { params }: { params: Promise<{ candidateId: string; filename?: string[] }> }
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

  // Employers see redacted resumes without needing an assignment first —
  // that's the point of browsing. Everything below guarantees the redaction, and
  // refuses rather than serving anything it can't verify. Names are handled the
  // same way as on browse: the resume is served under a redacted filename.
  const isAdmin = profile?.role === 'admin'
  const isEmployer = profile?.role === 'employer'
  if (!isAdmin && !isEmployer) return new NextResponse('Forbidden', { status: 403 })

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
    // Some hosts (Wix, Squarespace, many CDNs) block hotlinked/non-browser
    // fetches with a 403. Sending a full set of browser-like headers — crucially
    // a Referer matching the file's own origin — defeats most of that protection.
    let origin = ''
    try { origin = new URL(cp.resume_url).origin } catch {}
    const fetchExternal = () => fetch(cp.resume_url!, {
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'application/pdf,image/avif,image/webp,image/png,image/jpeg,application/octet-stream,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        ...(origin ? { 'Referer': origin + '/' } : {}),
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
        ? `This resume is hosted on an external site that blocked our server (${lastError}). Ask the candidate to re-upload their resume directly through their profile — that stores it securely and lets it load normally.`
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
    } else if (head.startsWith('\xFF\xD8\xFF') || head.startsWith('\x89PNG')) {
      // Image resume (JPG/PNG) — serve it as a viewable, stamped PDF directly.
      // No text layer means nothing to redact, so we skip the pdfjs pipeline.
      try {
        const { pdf: imgPdf, ocrFailed } = await imageToRedactedPdf(buffer)
        // A photo with unreadable text can't be redacted, so an employer must
        // not receive it — there is no way to know what is on it.
        if (ocrFailed && !isAdmin) {
          return new NextResponse(
            "This resume is a photo, and we can't automatically hide the candidate's contact "
            + 'details on it. Ask us for an introduction and we\'ll share it with you directly.',
            { status: 422 },
          )
        }
        const name = resumeFileName(cp.full_name)
        return new NextResponse(Buffer.from(imgPdf), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${name}"`,
            'Cache-Control': 'private, max-age=300',
          },
        })
      } catch (e) {
        console.error('image conversion failed:', e)
        return new NextResponse('Could not open this image resume. Progressive JPEGs are not supported — please re-save it as a standard JPG, PNG, or PDF.', { status: 422 })
      }
    } else if (head.startsWith('\xD0\xCF\x11\xE0')) {
      return new NextResponse('This resume is a legacy .doc file — please re-save it as .docx or PDF', { status: 415 })
    } else if (/<!doctype html|<html/i.test(head)) {
      return new NextResponse('This resume link serves a web page, not a file — the link should point directly to the document.', { status: 415 })
    } else {
      return new NextResponse('This resume link serves an unsupported file type. Only PDF, Word, and image resumes are supported.', { status: 415 })
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
    let leaked = false

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
      const items: TextItem[] = []

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

      const boxes: Rect[] = findRedactionBoxes(items)

      // A miss must never be silent. If anything still reads as contact info
      // after the boxes are placed, say so on the page rather than handing over
      // an address nobody realises is there.
      const missed = unredactedContacts(items, boxes)
      if (missed.length > 0) {
        console.error(`redaction miss on page ${pageNum}: ${missed.length} item(s)`)
        leaked = true
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

    // Scanned PDFs have no extractable text, so we can't locate and redact contact info.
    // Rather than refusing to serve the resume at all, stamp a visible notice on the first
    // page and serve the rendered image as-is so employers can still read the resume.
    if ((totalTextLength < 50 || leaked) && !isAdmin) {
      return new NextResponse(
        "We can't automatically hide this candidate's contact details on this resume — "
        + "it's a scan or an image rather than text. Ask us for an introduction and we'll "
        + 'share it with you directly.',
        { status: 422 },
      )
    }

    if (totalTextLength < 50 || leaked) {
      const firstPage = out.getPages()[0]
      const { width, height } = firstPage.getSize()
      const font = await out.embedFont(StandardFonts.Helvetica)
      firstPage.drawRectangle({ x: 0, y: height - 28, width, height: 28, color: rgb(0.98, 0.93, 0.73) })
      firstPage.drawText(
        leaked
          ? 'Contact details on this resume may not be fully redacted — please do not contact the candidate directly'
          : 'Scanned document — contact information could not be redacted automatically',
        { x: 10, y: height - 18, size: 9, font, color: rgb(0.45, 0.35, 0.05) },
      )
    }

    const pdfBytes = await out.save()
    const name = resumeFileName(cp.full_name)

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${name}"`,
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

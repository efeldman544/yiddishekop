import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { PDFDocument } from 'pdf-lib'
import { resumeFileName } from '@/lib/resumeUrl'
import {
  contactRanges, emailRanges, findRedactionBoxes, knownRanges, nameMentioned, nameRanges,
  unredactedContacts, type KnownContacts, type Rect, type TextItem,
} from '@/lib/redact'
import { sniffImage } from '@/lib/resumeContent'
import { openOcr, withOcr, type OcrLine } from '@/lib/ocr'

// SERVER ONLY.
//
// Everything between "this candidate's resume" and the file an employer is
// handed.

export type Viewer = 'admin' | 'employer'

const REFUSED_MESSAGE =
  "We can't automatically hide this candidate's contact details on this resume. "
  + "Ask us for an introduction and we'll share it with you directly."

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

/** The resume file, or a response explaining why it couldn't be fetched. */
export async function downloadResume(db: SupabaseClient, resumeUrl: string): Promise<Buffer | NextResponse> {
  // Supabase storage URL → download via client; external link → fetch directly
  const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resumes/`
  if (resumeUrl.startsWith(storageBase)) {
    const storagePath = resumeUrl.slice(storageBase.length)
    const { data: fileBlob, error: downloadError } = await db.storage.from('resumes').download(storagePath)
    if (downloadError || !fileBlob) return new NextResponse('Failed to fetch resume', { status: 502 })
    return Buffer.from(await fileBlob.arrayBuffer())
  }
  if (resumeUrl.startsWith('http')) {
    // Some hosts (Wix, Squarespace, many CDNs) block hotlinked/non-browser
    // fetches with a 403. Sending a full set of browser-like headers — crucially
    // a Referer matching the file's own origin — defeats most of that protection.
    let origin = ''
    try { origin = new URL(resumeUrl).origin } catch {}
    const fetchExternal = () => fetch(resumeUrl, {
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
    return Buffer.from(await res.arrayBuffer())
  }
  return new NextResponse('Invalid resume URL', { status: 500 })
}

function drawPill(ctx: { beginPath(): void; moveTo(x: number, y: number): void; arcTo(a: number, b: number, c: number, d: number, r: number): void; closePath(): void; fill(): void; stroke(): void; fillStyle: unknown; strokeStyle: unknown; lineWidth: number }, x: number, y: number, w: number, h: number) {
  const r = Math.min(h / 2, 10)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  ctx.fillStyle = '#eef0f3'
  ctx.fill()
  ctx.strokeStyle = '#d7dbe0'
  ctx.lineWidth = 1.5
  ctx.stroke()
}

/**
 * Boxes for everything on some OCR'd lines that should be hidden: anything
 * that looks like an email or phone number, the candidate's own email and
 * phone however OCR mangled them, and their surname.
 *
 * `leaked` is the check that follows: any word with an @ in front of a domain
 * that no box covers means something was missed.
 */
function coverOcrLines(lines: OcrLine[], fullName: string | null, known: KnownContacts): { boxes: Rect[]; leaked: boolean } {
  const PAD = 5
  const boxes: Rect[] = []
  for (const line of lines) {
    for (const [mStart, mEnd] of [...contactRanges(line.text), ...nameRanges(line.text, fullName), ...knownRanges(line.text, known)]) {
      const hit = line.spans.filter(s => s.end > mStart && s.start < mEnd)
      if (hit.length === 0) continue
      const x0 = Math.min(...hit.map(s => s.word.bbox.x0))
      const y0 = Math.min(...hit.map(s => s.word.bbox.y0))
      boxes.push({
        x: x0 - PAD, y: y0 - PAD,
        w: Math.max(...hit.map(s => s.word.bbox.x1)) - x0 + PAD * 2,
        h: Math.max(...hit.map(s => s.word.bbox.y1)) - y0 + PAD * 2,
      })
    }
  }

  const inBox = (b: { x0: number; y0: number; x1: number; y1: number }) => {
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2
    return boxes.some(r => cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h)
  }
  let leaked = false
  for (const line of lines) {
    // Every word that is part of an address, or carries an @ in front of
    // something with a dot in it — a piece of an address the pattern didn't
    // recognise as whole.
    const suspects = new Set<OcrLine['spans'][number]>()
    for (const [a, b] of emailRanges(line.text)) for (const s of line.spans) if (s.end > a && s.start < b) suspects.add(s)
    line.spans.forEach((s, i) => {
      const next = line.spans[i + 1]?.word.text ?? ''
      if (/@/.test(s.word.text) && /\.[a-z]{2,}/i.test(s.word.text + next)) suspects.add(s)
    })
    for (const s of suspects) {
      if (!inBox(s.word.bbox)) { leaked = true; console.error('OCR redaction miss:', s.word.text.length, 'chars') }
    }
  }
  return { boxes, leaked }
}

export type ImageResult = {
  pdf: Buffer
  /** OCR crashed, or read too little of the page to trust. */
  unreadable: boolean
  /** Something still reads as contact details after the boxes were drawn. */
  leaked: boolean
}

// Less than this much text read off the whole image means OCR didn't really
// read it — a blurry photo, a design it couldn't make sense of — and nothing
// can be said about what is on it.
const MIN_OCR_TEXT = 80

/**
 * Cover contact details on a photographed or scanned resume.
 *
 * Read with OCR in both colour schemes, so white text in a dark sidebar is
 * seen as well as dark text on white. Covered: anything that looks like an
 * email or phone number, the candidate's own email and phone wherever they
 * appear however OCR mangled them, and their surname.
 *
 * Then checked, the way PDFs are: any word with an @ in front of a domain that
 * no box covers means something was missed. Images had no such check, so a
 * miss went out unnoticed.
 */
export async function redactImage(img: Buffer, fullName: string | null, known: KnownContacts): Promise<ImageResult> {
  const boxes: Rect[] = []
  let lines: OcrLine[] = []
  let unreadable = false

  try {
    lines = await withOcr(read => read(img))
  } catch (ocrErr) {
    console.warn('OCR failed:', ocrErr)
    unreadable = true
  }

  const covered = coverOcrLines(lines, fullName, known)
  boxes.push(...covered.boxes)
  const leaked = covered.leaked

  const readChars = lines.reduce((n, l) => n + l.text.replace(/\s/g, '').length, 0)
  if (!unreadable && readChars < MIN_OCR_TEXT) unreadable = true

  const { createCanvas, loadImage } = await import('@napi-rs/canvas')
  const image = await loadImage(img)
  const canvas = createCanvas(image.width, image.height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0)
  for (const b of boxes) drawPill(ctx as unknown as Parameters<typeof drawPill>[0], b.x, b.y, b.w, b.h)

  const pdf = await PDFDocument.create()
  const embedded = await pdf.embedPng(canvas.toBuffer('image/png'))
  const scale = Math.min(612 / image.width, 792 / image.height, 1)
  const page = pdf.addPage([image.width * scale, image.height * scale])
  page.drawImage(embedded, { x: 0, y: 0, width: image.width * scale, height: image.height * scale })
  return { pdf: Buffer.from(await pdf.save()), unreadable, leaked }
}

export type PdfResult = {
  out: PDFDocument
  /** Characters in the text layer, across every page. */
  textLength: number
  /** Characters read by OCR, across the pages that were read that way. */
  ocrLength: number
  leaked: boolean
  /**
   * Whether the text layer says anything identifying: the candidate's name, or
   * something that is or looks like their contact details. A text layer with
   * none of those doesn't match what the page shows — a design tool's own
   * encoding, or details drawn as a picture — so what it does or doesn't find
   * proves nothing.
   */
  anchored: boolean
}

export async function redactPdf(buffer: Buffer, fullName: string | null, known: KnownContacts): Promise<PdfResult | NextResponse> {
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

  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    standardFontDataUrl: pdfjsAsset('standard_fonts'),
    cMapUrl: pdfjsAsset('cmaps'),
    cMapPacked: true,
  }).promise
  const SCALE = 2 // ~144dpi rendering for crisp text
  const out = await PDFDocument.create()

  let textLength = 0
  let ocrLength = 0
  let leaked = false
  let anchored = false
  // For pages with pictures on them; only started if one has.
  const ocr = openOcr()

  try {
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
        textLength += raw.str.length
        const tx = pdfjs.Util.transform(viewport.transform, raw.transform)
        const fontHeight = Math.hypot(tx[2], tx[3])
        items.push({ str: raw.str, rect: { x: tx[4], y: tx[5] - fontHeight, w: raw.width * SCALE, h: fontHeight * 1.25 } })
      }

      const pageText = items.map(i => i.str).join(' ')
      const pageTextLength = items.reduce((n, i) => n + i.str.length, 0)
      if (!anchored && (nameMentioned(pageText, fullName) || contactRanges(pageText).length > 0 || knownRanges(pageText, known).length > 0)) {
        anchored = true
      }

      const boxes: Rect[] = findRedactionBoxes(items, fullName, known)

      // A miss must never be silent. If anything still reads as contact info
      // after the boxes are placed, say so rather than handing over an address
      // nobody realises is there.
      const missed = unredactedContacts(items, boxes)
      if (missed.length > 0) {
        console.error(`redaction miss on page ${pageNum}: ${missed.length} item(s)`)
        leaked = true
      }

      for (const r of boxes) drawPill(ctx as unknown as Parameters<typeof drawPill>[0], r.x - 4, r.y - 3, r.w + 8, r.h + 6)

      // The text layer only knows about text. A phone number or email that is
      // part of a picture — a Canva background, a pasted screenshot, a logo
      // with contact details, a scan — isn't in it, and went out uncovered. So
      // a page with any picture on it is also read with OCR, after the boxes
      // above are drawn, and whatever is still readable gets covered too. So
      // is a page with next to no text layer: a scan, or text exported as
      // shapes, which the text layer can't see either.
      if (pageTextLength < 50 || await hasPictures(page, pdfjs.OPS)) {
        let lines: OcrLine[]
        try {
          lines = await ocr.read(canvas.toBuffer('image/png'))
        } catch (ocrErr) {
          // Can't tell what the pictures say: treat it as a miss, which
          // refuses it to employers, rather than assume they say nothing.
          console.error(`OCR failed on page ${pageNum}:`, ocrErr)
          lines = []
          leaked = true
        }
        ocrLength += lines.reduce((n, l) => n + l.text.replace(/\s/g, '').length, 0)
        const covered = coverOcrLines(lines, fullName, known)
        if (covered.leaked) leaked = true
        for (const r of covered.boxes) drawPill(ctx as unknown as Parameters<typeof drawPill>[0], r.x, r.y, r.w, r.h)
      }

      const embedded = await out.embedPng(canvas.toBuffer('image/png'))
      // Page size in points = rendered size / SCALE, preserving original dimensions
      const outPage = out.addPage([viewport.width / SCALE, viewport.height / SCALE])
      outPage.drawImage(embedded, { x: 0, y: 0, width: viewport.width / SCALE, height: viewport.height / SCALE })
    }
  } finally {
    await ocr.close()
  }

  await doc.loadingTask.destroy()
  return { out, textLength, ocrLength, leaked, anchored }
}

/** Whether a PDF page draws any picture, however small. */
async function hasPictures(
  page: { getOperatorList(): Promise<{ fnArray: number[] }> },
  OPS: Record<string, number>,
): Promise<boolean> {
  const pictureOps = new Set(Object.entries(OPS).filter(([name]) => /^paint.*Image/.test(name)).map(([, op]) => op))
  try {
    const { fnArray } = await page.getOperatorList()
    return fnArray.some(op => pictureOps.has(op))
  } catch {
    // Couldn't list what the page draws: read it, to be safe.
    return true
  }
}

/**
 * The résumé exactly as it was uploaded, for an admin.
 *
 * Admins used to get everything but photos through the employer pipeline —
 * converted, redacted, read with OCR — so any step that failed (an old .doc,
 * a Word file that wouldn't convert, a PDF with broken fonts or a password,
 * a slow scan) refused the admin as well. An admin can see the candidate's
 * details anyway, so none of that is needed: they get the file. "As
 * employers see it" (?as=employer) still shows the redacted copy.
 */
async function serveOriginal(db: SupabaseClient, resumeUrl: string, fullName: string | null): Promise<NextResponse> {
  const fetched = await downloadResume(db, resumeUrl)
  if (fetched instanceof NextResponse) {
    // A résumé hosted elsewhere that blocked our server: send the admin's own
    // browser to it instead, which the site usually lets through.
    const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resumes/`
    if (/^https?:\/\//i.test(resumeUrl) && !resumeUrl.startsWith(storageBase)) return NextResponse.redirect(resumeUrl)
    return fetched
  }
  const buffer = fetched
  const head = buffer.subarray(0, 1024).toString('latin1')
  const first = resumeFileName(fullName).replace(' (redacted).pdf', '')
  const send = (body: Buffer, type: string, disposition: 'inline' | 'attachment', ext: string) =>
    new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': type,
        'Content-Disposition': `${disposition}; filename="${first}.${ext}"`,
        // Never cached anywhere shared: this is the unredacted original.
        'Cache-Control': 'private, no-store',
      },
    })

  if (head.includes('%PDF')) return send(buffer, 'application/pdf', 'inline', 'pdf')
  const imageType = sniffImage(buffer) ?? (/^[\s\S]{4}ftyp(heic|heix|mif1|hevc)/.test(head) ? 'image/heic' : null)
  if (imageType) return send(buffer, imageType, 'inline', imageType.split('/')[1])
  if (head.startsWith('PK')) {
    // Shown as a PDF when it converts, so it opens in the browser; otherwise
    // the Word file itself, to open in Word.
    try {
      return send(await docxToPdf(buffer), 'application/pdf', 'inline', 'pdf')
    } catch (e) {
      console.error('docx conversion failed, sending the original:', e)
      return send(buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'attachment', 'docx')
    }
  }
  if (head.startsWith('\xD0\xCF\x11\xE0')) return send(buffer, 'application/msword', 'attachment', 'doc')
  if (/<!doctype html|<html/i.test(head) && /^https?:\/\//i.test(resumeUrl)) return NextResponse.redirect(resumeUrl)
  return send(buffer, 'application/octet-stream', 'attachment', 'bin')
}

function pdfResponse(bytes: Uint8Array, fullName: string | null): NextResponse {
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${resumeFileName(fullName)}"`,
      'Cache-Control': 'private, max-age=300',
    },
  })
}

/** A candidate's own contact details, from their profile. */
export function knownFromProfile(cp: { email?: string | null; phone?: string | null; whatsapp?: string | null }): KnownContacts {
  return {
    emails: [cp.email].filter((v): v is string => !!v && v.includes('@')),
    phones: [cp.phone, cp.whatsapp].filter((v): v is string => !!v && /\d{7,}/.test(v.replace(/\D/g, ''))),
  }
}

/**
 * The resume as `viewer` should receive it.
 *
 * Employers get it redacted, and are refused it when the redaction can't be
 * shown to have worked. An admin gets photographed resumes as uploaded, and
 * everything else redacted with a banner where an employer would have been
 * refused.
 */
export async function serveResume(db: SupabaseClient, candidateId: string, viewer: Viewer): Promise<NextResponse> {
  const isAdmin = viewer === 'admin'

  const { data: cp } = await db
    .from('candidate_profiles')
    .select('resume_url, full_name, email, phone, whatsapp')
    .eq('id', candidateId)
    .maybeSingle<{ resume_url: string | null; full_name: string | null; email: string | null; phone: string | null; whatsapp: string | null }>()
  if (!cp?.resume_url) return new NextResponse('No resume found', { status: 404 })
  if (isAdmin) return serveOriginal(db, cp.resume_url, cp.full_name)
  const known = knownFromProfile(cp)

  const fetched = await downloadResume(db, cp.resume_url)
  if (fetched instanceof NextResponse) return fetched
  let buffer = fetched

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
      try {
        const result = await redactImage(buffer, cp.full_name, known)
        // An image whose text couldn't be read, or which still shows contact
        // details after covering, must not reach an employer: there is no way
        // to vouch for what is on it.
        if (result.unreadable || result.leaked) return new NextResponse(REFUSED_MESSAGE, { status: 422 })
        return pdfResponse(result.pdf, cp.full_name)
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
    const result = await redactPdf(buffer, cp.full_name, known)
    if (result instanceof NextResponse) return result
    const { out, textLength, ocrLength, leaked, anchored } = result

    // No text layer to speak of: a scan, or a design exported as one picture.
    // Every such page was read with OCR above, and that is what it is judged
    // by, the way photographed resumes are — served if OCR could read it and
    // nothing still reads as contact details.
    const scanned = textLength < 50 && ocrLength < MIN_OCR_TEXT
    const unverified = textLength >= 50 && !anchored
    // Only employers get this far; anything that can't be vouched for is refused.
    if (scanned || leaked || unverified) return new NextResponse(REFUSED_MESSAGE, { status: 422 })
    return pdfResponse(await out.save(), cp.full_name)
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

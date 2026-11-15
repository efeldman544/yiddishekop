import type { SupabaseClient } from '@supabase/supabase-js'

// SERVER ONLY.
//
// Getting a resume into a form a model can read, whatever it was uploaded as.
//
// Matching used to extract text from PDFs and Word files and nothing else, so
// a candidate whose resume was a photo or a scan contributed no resume at all
// to their score — silently, since a failed extraction and a missing resume
// both came back as null. Here every outcome is named: text, an image to be
// read as a picture, a scan to be read page by page, nothing on file, or
// unreadable with the reason, so the last can be listed for chasing.

export type ImageType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

export type ResumeContent =
  | { kind: 'none' }
  | { kind: 'text'; text: string; note?: string }
  | { kind: 'image'; mediaType: ImageType; data: Buffer }
  | { kind: 'pdf-scan'; data: Buffer }
  | { kind: 'unreadable'; note: string }

// A resume is a page or two. Anything past this is a mistaken upload — a
// portfolio, a book — and is cut with a note rather than sent whole.
const MAX_TEXT_CHARS = 60_000
// Less text than this from a PDF means there is no real text layer: it is a
// scan with a stray page number, and should be read as pictures.
const MIN_PDF_TEXT_CHARS = 200
const MAX_SCAN_BYTES = 10 * 1024 * 1024
// The API refuses an image over 5 MB once encoded. Encoding adds a third.
const MAX_RAW_IMAGE_BYTES = 3_600_000
// Past this on the long edge the model downscales anyway, so sending more is
// paying to upload pixels it will not look at.
const MAX_IMAGE_EDGE = 1568

export function sniffImage(buffer: Buffer): ImageType | null {
  const head = buffer.subarray(0, 12)
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'image/jpeg'
  if (head.subarray(0, 4).toString('latin1') === '\x89PNG') return 'image/png'
  if (head.subarray(0, 4).toString('latin1') === 'RIFF' && head.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp'
  if (head.subarray(0, 3).toString('latin1') === 'GIF') return 'image/gif'
  return null
}

/** The file behind a resume_url, or why it couldn't be fetched. */
export async function fetchResumeBytes(
  db: SupabaseClient,
  resumeUrl: string,
): Promise<{ buffer: Buffer } | { error: string }> {
  const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resumes/`
  try {
    if (resumeUrl.startsWith(storageBase)) {
      const storagePath = decodeURIComponent(resumeUrl.slice(storageBase.length))
      const { data, error } = await db.storage.from('resumes').download(storagePath)
      if (error || !data) return { error: 'the stored file could not be downloaded' }
      return { buffer: Buffer.from(await data.arrayBuffer()) }
    }
    if (resumeUrl.startsWith('http')) {
      // External link (the old imported files). Some hosts reject anything
      // that doesn't look like a browser.
      const res = await fetch(resumeUrl, {
        signal: AbortSignal.timeout(12_000),
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          'Accept': 'application/pdf,image/*,application/octet-stream,*/*',
        },
      })
      if (!res.ok) return { error: `the link returned ${res.status}` }
      return { buffer: Buffer.from(await res.arrayBuffer()) }
    }
    return { error: 'the resume link is not a web address' }
  } catch (e) {
    const timedOut = e instanceof Error && e.name === 'TimeoutError'
    return { error: timedOut ? 'the link timed out' : 'the link could not be reached' }
  }
}

function capped(text: string): { text: string; note?: string } {
  const clean = text.replace(/\u0000/g, '').trim()
  if (clean.length <= MAX_TEXT_CHARS) return { text: clean }
  return {
    text: clean.slice(0, MAX_TEXT_CHARS),
    note: `only the first ${MAX_TEXT_CHARS.toLocaleString('en-US')} characters of a very long file were read`,
  }
}

/** Shrink a photo to what the model will actually look at. */
async function prepareImage(buffer: Buffer, type: ImageType): Promise<ResumeContent> {
  try {
    const { createCanvas, loadImage } = await import('@napi-rs/canvas')
    const image = await loadImage(buffer)
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.width, image.height))
    if (scale < 1 || buffer.length > MAX_RAW_IMAGE_BYTES) {
      const canvas = createCanvas(Math.round(image.width * scale), Math.round(image.height * scale))
      const ctx = canvas.getContext('2d')
      // JPEG has no transparency, so a transparent PNG would come out black.
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      return { kind: 'image', mediaType: 'image/jpeg', data: canvas.toBuffer('image/jpeg', 88) }
    }
  } catch {
    // The canvas library can't open some files a browser can — progressive
    // JPEGs among them. The model reads those fine, so fall through and send
    // the original if it is small enough.
  }
  if (buffer.length <= MAX_RAW_IMAGE_BYTES) return { kind: 'image', mediaType: type, data: buffer }
  return { kind: 'unreadable', note: 'the image is too large to read and could not be resized' }
}

/** Classify a file's bytes and get them ready. Split out so it can be tested without a network. */
export async function classifyResume(buffer: Buffer): Promise<ResumeContent> {
  if (buffer.length === 0) return { kind: 'unreadable', note: 'the file is empty' }

  const head = buffer.subarray(0, 1024).toString('latin1')

  if (head.includes('%PDF')) {
    let text = ''
    try {
      // Dynamic import — pdf-parse pulls in native canvas deps that can fail
      // to load at module level on Vercel.
      const { PDFParse } = await import('pdf-parse')
      const parser = new PDFParse({ data: new Uint8Array(buffer) })
      text = (await parser.getText()).text ?? ''
    } catch {
      text = ''
    }
    if (text.trim().length >= MIN_PDF_TEXT_CHARS) return { kind: 'text', ...capped(text) }
    if (buffer.length > MAX_SCAN_BYTES) {
      return { kind: 'unreadable', note: 'a scanned PDF too large to read' }
    }
    return { kind: 'pdf-scan', data: buffer }
  }

  if (head.startsWith('PK')) {
    try {
      const mammoth = (await import('mammoth')).default
      const { value } = await mammoth.extractRawText({ buffer })
      if (value.trim()) return { kind: 'text', ...capped(value) }
      return { kind: 'unreadable', note: 'the Word document has no text in it' }
    } catch {
      return { kind: 'unreadable', note: 'the Word document could not be opened' }
    }
  }

  const imageType = sniffImage(buffer)
  if (imageType) return prepareImage(buffer, imageType)

  if (head.startsWith('\xD0\xCF\x11\xE0')) {
    return { kind: 'unreadable', note: 'an old .doc file — it needs re-saving as .docx or PDF' }
  }
  if (/<!doctype html|<html/i.test(head)) {
    return { kind: 'unreadable', note: 'the link opens a web page, not a file' }
  }
  return { kind: 'unreadable', note: 'a file type that can’t be read' }
}

export async function loadResume(db: SupabaseClient, resumeUrl: string | null | undefined): Promise<ResumeContent> {
  if (!resumeUrl) return { kind: 'none' }
  const fetched = await fetchResumeBytes(db, resumeUrl)
  if ('error' in fetched) return { kind: 'unreadable', note: fetched.error }
  return classifyResume(fetched.buffer)
}

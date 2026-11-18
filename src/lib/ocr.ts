// SERVER ONLY.
//
// Reading the words off a picture of a page.
//
// Every image is read twice: as it is, and with its colours inverted. OCR is
// built for dark text on a light page, and resume templates love the
// opposite — white contact details in a dark sidebar. Reading the inverted
// copy as well means text in either colour scheme is seen by one pass or the
// other. Both passes' words are returned, each in its own set of lines, with
// boxes in the original image's pixels (an inverted copy has the same
// dimensions).

export type OcrWord = { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }
/** One visual line: its words left to right, and their text joined with spaces. */
export type OcrLine = { words: OcrWord[]; text: string; spans: { start: number; end: number; word: OcrWord }[] }
export type ReadPage = (image: Buffer) => Promise<OcrLine[]>

function toLines(words: OcrWord[]): OcrLine[] {
  const lines: OcrWord[][] = []
  for (const word of [...words].sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0)) {
    if (!word.text?.trim()) continue
    const midY = (word.bbox.y0 + word.bbox.y1) / 2
    const lineH = word.bbox.y1 - word.bbox.y0
    const existing = lines.find(l => Math.abs((l[0].bbox.y0 + l[0].bbox.y1) / 2 - midY) < lineH * 0.7)
    if (existing) existing.push(word)
    else lines.push([word])
  }
  return lines.map(line => {
    line.sort((a, b) => a.bbox.x0 - b.bbox.x0)
    let text = ''
    const spans: OcrLine['spans'] = []
    for (const word of line) {
      if (text) text += ' '
      spans.push({ start: text.length, end: text.length + word.text.length, word })
      text += word.text
    }
    return { words: line, text, spans }
  })
}

async function inverted(image: Buffer): Promise<Buffer> {
  const { createCanvas, loadImage } = await import('@napi-rs/canvas')
  const img = await loadImage(image)
  const canvas = createCanvas(img.width, img.height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  ctx.globalCompositeOperation = 'difference'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, img.width, img.height)
  return canvas.toBuffer('image/png')
}

/**
 * An OCR reader whose engine only starts on the first page it reads.
 *
 * Starting one loads its model, which is the slow part, so a caller reading
 * several pages shares one engine, and a caller that may read nothing at all
 * pays nothing. `close` must be called either way.
 */
export function openOcr(): { read: ReadPage; close: () => Promise<void> } {
  let started: Promise<Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>>> | null = null
  const start = async () => {
    const { createWorker, PSM } = await import('tesseract.js')
    // OEM 1 = LSTM only. /tmp keeps the downloaded model across warm
    // invocations. TESSERACT_LANG_PATH is only for running this where the
    // usual download address can't be reached.
    const worker = await createWorker('eng', 1, {
      cachePath: '/tmp',
      logger: () => {},
      ...(process.env.TESSERACT_LANG_PATH ? { langPath: process.env.TESSERACT_LANG_PATH } : {}),
    })
    // Sparse-text mode: find as much text as possible, in no particular order.
    // The default assumes a page of running text, and on a designed resume it
    // skipped the big name heading entirely — so the surname in it was left
    // showing — while reading the small print fine.
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT })
    return worker
  }
  return {
    async read(image) {
      const worker = await (started ??= start())
      const out: OcrLine[] = []
      for (const pass of [image, await inverted(image)]) {
        const { data } = await worker.recognize(pass, {}, { blocks: true })
        const words = ((data as unknown as { blocks?: { paragraphs: { lines: { words: OcrWord[] }[] }[] }[] }).blocks ?? [])
          .flatMap(b => b.paragraphs.flatMap(p => p.lines.flatMap(l => l.words)))
        out.push(...toLines(words))
      }
      return out
    },
    async close() {
      if (!started) return
      const worker = await started.catch(() => null)
      await worker?.terminate()
    },
  }
}

/** Run `fn` with a reader that OCRs a page image in both colour schemes. */
export async function withOcr<T>(fn: (read: ReadPage) => Promise<T>): Promise<T> {
  const ocr = openOcr()
  try {
    return await fn(ocr.read)
  } finally {
    await ocr.close()
  }
}

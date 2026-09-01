// Finding contact details in a PDF's text layer, so they can be covered before
// an employer sees the page.
//
// Extracted from the resume route so the part that decides *what* gets covered
// can be tested directly against awkward layouts, rather than only by looking
// at a rendered PDF and hoping.

export type Rect = { x: number; y: number; w: number; h: number }
export type TextItem = { str: string; rect: Rect }

// Built fresh per call. These are stateful with /g — sharing one instance across
// calls leaks `lastIndex` between them and makes matching depend on what was
// scanned previously.
function contactPatterns(): RegExp[] {
  return [
    /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    /(\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g,
    /\+[\d\s\-().]{7,20}/g,
  ]
}

/** Character ranges of contact info within a line of text. */
export function contactRanges(line: string): [number, number][] {
  const ranges: [number, number][] = []
  for (const re of contactPatterns()) {
    let m: RegExpExecArray | null
    while ((m = re.exec(line)) !== null) {
      if (m[0].length > 0) ranges.push([m.index, m.index + m[0].length])
    }
  }
  return ranges
}

/**
 * Group text items into visual lines.
 *
 * This used to bucket by `Math.round(y / 4)`, which silently split a line
 * whenever two items straddled a bucket edge — a two-point difference in
 * baseline, which is normal when an email sits beside a label in a different
 * size. The halves were then scanned separately, so "daniella.brown" and
 * "@gmail.com" each matched nothing and the address was served in the clear.
 *
 * Comparing against the line's own centre and height has no edges to straddle.
 */
export function groupIntoLines(items: TextItem[]): TextItem[][] {
  const lines: { centre: number; height: number; items: TextItem[] }[] = []

  for (const item of [...items].sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x)) {
    const centre = item.rect.y + item.rect.h / 2
    const height = item.rect.h || 1
    const line = lines.find(l => Math.abs(l.centre - centre) < Math.max(l.height, height) * 0.6)
    if (line) {
      line.items.push(item)
      // Track the tallest item, so a big heading doesn't get split from the
      // small text sitting on the same baseline.
      line.height = Math.max(line.height, height)
    } else {
      lines.push({ centre, height, items: [item] })
    }
  }

  for (const l of lines) l.items.sort((a, b) => a.rect.x - b.rect.x)
  return lines.map(l => l.items)
}

/** The text of a line as the regexes see it, with the span each item occupies. */
function joinLine(line: TextItem[]) {
  let text = ''
  const spans: { start: number; end: number; item: TextItem }[] = []
  for (const item of line) {
    // Joined without separators so an address split across items still reads as
    // one string.
    spans.push({ start: text.length, end: text.length + item.str.length, item })
    text += item.str
  }
  return { text, spans }
}

/** Boxes covering every piece of contact info found in the page's text. */
export function findRedactionBoxes(items: TextItem[]): Rect[] {
  const boxes: Rect[] = []

  for (const line of groupIntoLines(items)) {
    const { text, spans } = joinLine(line)

    const lineBoxes: Rect[] = []
    for (const [start, end] of contactRanges(text)) {
      for (const span of spans) {
        if (span.end > start && span.start < end) lineBoxes.push({ ...span.item.rect })
      }
    }

    // Merge touching boxes into one pill — but only within this line. The merge
    // used to compare against the last box of the previous line too, which
    // stretched a box across unrelated text.
    lineBoxes.sort((a, b) => a.x - b.x)
    const merged: Rect[] = []
    for (const b of lineBoxes) {
      const last = merged[merged.length - 1]
      if (last && Math.abs(last.y - b.y) < 6 && b.x <= last.x + last.w + 12) {
        last.w = Math.max(last.w, b.x + b.w - last.x)
        last.h = Math.max(last.h, b.h)
      } else {
        merged.push(b)
      }
    }
    boxes.push(...merged)
  }

  return boxes
}

function covered(rect: Rect, boxes: Rect[]): boolean {
  const cx = rect.x + rect.w / 2
  const cy = rect.y + rect.h / 2
  return boxes.some(b => cx >= b.x - 1 && cx <= b.x + b.w + 1 && cy >= b.y - 1 && cy <= b.y + b.h + 1)
}

/**
 * Contact details still readable after the boxes are applied.
 *
 * The point is that a redaction miss should never be silent. This re-reads the
 * page the way a person would — every item in reading order, across line
 * boundaries — and reports anything that matches but wasn't covered, so the
 * caller can warn instead of quietly handing over an address.
 */
export function unredactedContacts(items: TextItem[], boxes: Rect[]): string[] {
  const lines = groupIntoLines(items)
  const missed: string[] = []

  // Whole page as one string, so an address broken across two lines is seen.
  let text = ''
  const spans: { start: number; end: number; item: TextItem }[] = []
  for (const line of lines) {
    for (const item of line) {
      spans.push({ start: text.length, end: text.length + item.str.length, item })
      text += item.str
    }
  }

  for (const [start, end] of contactRanges(text)) {
    const touching = spans.filter(s => s.end > start && s.start < end)
    if (touching.length > 0 && !touching.every(s => covered(s.item.rect, boxes))) {
      missed.push(text.slice(start, end))
    }
  }
  return missed
}

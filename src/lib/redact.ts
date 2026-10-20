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

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Where the parts of the candidate's name that have to be hidden appear.
 *
 * Browse shows a first name, so the first name is not what needs hiding — the
 * surname is, and it sits in 28pt at the top of nearly every resume.
 *
 * The ranges returned cover the surname only. The first version of this
 * matched the whole name as one run, which meant the box went over the whole
 * "Daniella Shnider" heading and an employer saw a grey pill where browse had
 * just shown them a first name. Here the run is matched to find the surname
 * reliably — including when the page's text items are glued together as
 * "DaniellaShnider", where a word boundary can't help — but only the part
 * after the given name is handed back.
 *
 * Three shapes, because a name is rarely one tidy item:
 *
 *  - the name in order, hiding everything after the given name
 *  - the name reversed, for the "Shnider, Daniella" heading style
 *  - each part after the first on its own, bounded by letters and digits so a
 *    short surname doesn't fire inside an unrelated word
 *
 * Somebody with no surname on file has nothing here to hide, and gets no
 * boxes.
 */
export function nameRanges(line: string, fullName: string | null | undefined): [number, number][] {
  const parts = String(fullName ?? '').trim().split(/\s+/)
    .map(p => p.replace(/[^\p{L}'\-]/gu, ''))
    .filter(p => p.length >= 2)
  if (parts.length < 2) return []

  const given = escapeRe(parts[0])
  const rest = parts.slice(1).map(escapeRe)
  // What may sit between two parts of a name as it's written on a page:
  // nothing at all, a space, a comma, a full stop, a hyphen.
  const GAP = "[\\s.,'\\-]*"

  // Each pattern brackets the given name so it can be excluded from the range.
  // `hide` says which side of the match to keep.
  const patterns: { re: RegExp; hide: 'after' | 'before' | 'all' }[] = [
    { re: new RegExp(`(${given}${GAP})(${rest.join(GAP)})`, 'giu'), hide: 'after' },
    { re: new RegExp(`(${[...rest].reverse().join(GAP)})(${GAP}${given})`, 'giu'), hide: 'before' },
    ...rest.map(p => ({
      re: new RegExp(`(?<![\\p{L}\\p{N}])${p}(?![\\p{L}\\p{N}])`, 'giu'),
      hide: 'all' as const,
    })),
  ]

  const ranges: [number, number][] = []
  for (const { re, hide } of patterns) {
    let m: RegExpExecArray | null
    while ((m = re.exec(line)) !== null) {
      if (m[0].length === 0) { re.lastIndex++; continue }
      const start = hide === 'after' ? m.index + m[1].length : m.index
      const end = hide === 'before' ? m.index + m[1].length : m.index + m[0].length
      if (end > start) ranges.push([start, end])
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

type Span = { start: number; end: number; item: TextItem }

/** The text of some items as the regexes see it, with each item's span in it. */
function join(items: TextItem[]): { text: string; spans: Span[] } {
  let text = ''
  const spans: Span[] = []
  for (const item of items) {
    // Joined without separators so an address split across items still reads as
    // one string.
    spans.push({ start: text.length, end: text.length + item.str.length, item })
    text += item.str
  }
  return { text, spans }
}

/**
 * Every stretch of the page the patterns should be run over: each line, and
 * each line with the one after it.
 *
 * The pairs matter. A narrow column wraps an address across a line break, so
 * "Daniellashnider@y" sits on one line and "ahoo.com" on the next, and neither
 * half matches anything on its own — the first has no dot after the @, the
 * second has no @ at all. Scanning a line at a time, as the boxes used to,
 * covered neither, and the address was served in full.
 *
 * Boxes and the safety net below both read these, so anything the net can see
 * is something the boxes have already had a chance to cover.
 */
function scanWindows(items: TextItem[]): { text: string; spans: Span[] }[] {
  const lines = groupIntoLines(items)
  const windows = lines.map(line => join(line))
  for (let i = 0; i + 1 < lines.length; i++) {
    windows.push(join([...lines[i], ...lines[i + 1]]))
  }
  return windows
}

/**
 * The part of an item's box covering characters `start`..`end` of the line.
 *
 * Contact details take the whole item — covering a word of ordinary text
 * beside an address costs nothing, and a box that stops short of a digit does.
 * A name can't afford that: the surname often shares one text item with the
 * given name, and browse has already shown that given name, so blanking the
 * whole heading hides something the employer is meant to see.
 *
 * The split is proportional to character count, which is approximate in a
 * proportional font, so it errs outward by half a character at each end. Half
 * a surname showing is the failure that matters here.
 */
function partOfItem(span: Span, start: number, end: number): Rect {
  const rect = span.item.rect
  const len = span.end - span.start
  const from = Math.max(0, start - span.start)
  const to = Math.min(len, end - span.start)
  if (len <= 0 || to <= from || (from <= 0 && to >= len)) return { ...rect }

  // Only a range that runs to the end of the item gets a partial box, and that
  // is the case worth having: "Daniella Shnider" as one heading, where the
  // surname is the tail. Its right edge is the item's own, which is exact, so
  // the only guess is where to start.
  //
  // A surname sitting in the middle of an item takes the whole item instead.
  // Both of its edges would be guesses, and a guess at the far edge left the
  // "r" of "Shnider" showing. Covering "Worked at Shnider & Co" entirely is a
  // bigger box than strictly needed and costs nothing.
  if (to < len) return { ...rect }

  const unit = rect.w / len
  // The guess is proportional to character count, which drifts further the
  // more characters it has to step over, so the slack grows with the distance.
  // It errs into the given name: clipping the tail of "Daniella" is nothing,
  // and starting late would show the front of the surname.
  const slack = 0.5 + 0.08 * from
  const left = Math.max(rect.x, rect.x + unit * (from - slack))
  // pdfjs reports a width the glyphs can slightly overrun — a bold 22pt
  // heading drew a few pixels past it and left the tail of the last letter
  // outside the box — so take an allowance rather than stop on the edge.
  const right = rect.x + rect.w + rect.h * 0.15
  return { x: left, y: rect.y, w: Math.max(right - left, 1), h: rect.h }
}

/**
 * Boxes covering every piece of contact info found in the page's text, and the
 * candidate's own name when one is known.
 */
export function findRedactionBoxes(items: TextItem[], fullName?: string | null): Rect[] {
  const boxes: Rect[] = []

  for (const { text, spans } of scanWindows(items)) {
    const lineBoxes: Rect[] = []

    // Contact details take the whole item they touch; a name takes only its
    // own characters. See partOfItem.
    for (const [start, end] of contactRanges(text)) {
      for (const span of spans) {
        if (span.end > start && span.start < end) lineBoxes.push({ ...span.item.rect })
      }
    }
    for (const [start, end] of nameRanges(text, fullName)) {
      for (const span of spans) {
        if (span.end > start && span.start < end) lineBoxes.push(partOfItem(span, start, end))
      }
    }

    // Merge touching boxes into one pill — but only across a shared baseline.
    // The merge used to compare against the last box of the previous line too,
    // which stretched a box across unrelated text.
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
 * The point is that a redaction miss should never be silent, so this re-reads
 * the page and reports anything that still matches but wasn't covered.
 *
 * Two things keep it from crying wolf, both of which it used to do on almost
 * every resume:
 *
 * The scan runs over one or two lines at a time, not the whole page glued into
 * a single string. Items are joined without separators — that is what catches
 * an address split across items — but joining *every* line that way ran the
 * name straight into the email below it, so the regex matched
 * "Dahanesther.dahan@gmail.comObjective" and the heading at the end of that,
 * being ordinary text, was of course not covered.
 *
 * And a match only counts as a miss if what's left showing is itself contact
 * info. The regex reaches past the address into whatever words sit beside it,
 * so "not every item is covered" catches those neighbours rather than a leak.
 * Re-reading just the uncovered items answers the question that matters: can
 * someone still read an address off this page?
 */
export function unredactedContacts(items: TextItem[], boxes: Rect[]): string[] {
  const missed = new Set<string>()

  // The same stretches the boxes were drawn from, so the two can't disagree
  // about what is on the page. Overlapping windows scan most lines twice; the
  // set dedupes.
  for (const { text, spans } of scanWindows(items)) {
    for (const [start, end] of contactRanges(text)) {
      const touching = spans.filter(s => s.end > start && s.start < end)
      const uncovered = touching.filter(s => !covered(s.item.rect, boxes))
      if (uncovered.length === 0) continue

      const stillReadable = uncovered.map(s => s.item.str).join('')
      if (contactRanges(stillReadable).length > 0) missed.add(stillReadable)
    }
  }

  return [...missed]
}

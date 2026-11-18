// Finding contact details in a PDF's text layer, so they can be covered before
// an employer sees the page.
//
// Extracted from the resume route so the part that decides *what* gets covered
// can be tested directly against awkward layouts, rather than only by looking
// at a rendered PDF and hoping.

export type Rect = { x: number; y: number; w: number; h: number }
export type TextItem = { str: string; rect: Rect }

/** Character ranges of email addresses within a stretch of text. */
export function emailRanges(text: string): [number, number][] {
  // Built fresh per call: a /g regex shared between calls carries `lastIndex`
  // from one to the next.
  const re = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
  const ranges: [number, number][] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) ranges.push([m.index, m.index + m[0].length])
  return ranges
}

// What may sit between the digit groups of a phone number: spaces, dots,
// hyphens, brackets round an area code — and every dash a word processor
// substitutes for a hyphen. The pattern this replaced accepted one plain
// hyphen, dot or space and nothing else, so "053 – 540 – 2523" with en-dashes,
// as Word types it, went out on a resume uncovered and unnoticed.
const PHONE_GLUE = '\\s.()\\-\\u2010-\\u2015\\u2212'
const MAX_GLUE = 4
const YEAR = /^(19|20)\d\d$/

/**
 * Character ranges of phone numbers within a stretch of text.
 *
 * Any format, by counting digits rather than matching a layout: groups of
 * digits joined by short runs of the characters above, 9 to 15 digits in all
 * (8 after a +), which is every national and international number in use.
 * Where a run of digits holds more than that — a date range sitting next to a
 * number — the best number inside it is taken, preferring the stretch with
 * fewest year-like groups, so "2018 – 2021 053 540 2523" gives up the phone and
 * not the dates.
 *
 * Two guards against dates: a stretch with two year-like groups is never a
 * phone ("05.2020 – 06.2021"), and nor is one ending in a group of fewer than
 * three digits ("2018 – 2021, 2 years").
 */
export function phoneRanges(text: string): [number, number][] {
  const run = new RegExp(`\\d[\\d${PHONE_GLUE}]*\\d|\\d`, 'g')
  const glue = new RegExp(`^[${PHONE_GLUE}]{1,${MAX_GLUE}}$`)
  const ranges: [number, number][] = []

  let m: RegExpExecArray | null
  while ((m = run.exec(text)) !== null) {
    // The digit groups in this run, broken wherever the glue between two
    // groups is too long to be part of one number.
    const pieces: { start: number; end: number; digits: string }[][] = [[]]
    const group = /\d+/g
    let g: RegExpExecArray | null
    let prevEnd = -1
    while ((g = group.exec(m[0])) !== null) {
      const start = m.index + g.index
      const between = prevEnd < 0 ? '' : text.slice(prevEnd, start)
      if (prevEnd >= 0 && !glue.test(between)) pieces.push([])
      pieces[pieces.length - 1].push({ start, end: start + g[0].length, digits: g[0] })
      prevEnd = start + g[0].length
    }

    for (const groups of pieces) {
      const used = new Set<number>()
      for (;;) {
        let best: { i: number; j: number; years: number; digits: number } | null = null
        for (let i = 0; i < groups.length; i++) {
          if (used.has(i)) continue
          let digits = 0
          let years = 0
          for (let j = i; j < groups.length && !used.has(j); j++) {
            digits += groups[j].digits.length
            if (YEAR.test(groups[j].digits)) years++
            if (digits > 15) break
            const plus = text[groups[i].start - 1] === '+'
            if (digits < (plus ? 8 : 9) || years >= 2 || groups[j].digits.length < 3) continue
            const better = !best
              || years < best.years
              || (years === best.years && digits > best.digits)
            if (better) best = { i, j, years, digits }
          }
        }
        if (!best) break
        for (let k = best.i; k <= best.j; k++) used.add(k)
        // Take in a + or opening bracket written directly before the number.
        let start = groups[best.i].start
        while (start > 0 && /[+(]/.test(text[start - 1])) start--
        ranges.push([start, groups[best.j].end])
      }
    }
  }
  return ranges
}

/** Character ranges of contact info within a line of text: emails and phone numbers. */
export function contactRanges(line: string): [number, number][] {
  return [...emailRanges(line), ...phoneRanges(line)]
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

  // Headings are often letter-spaced, and the PDF then holds the name as
  // "S A MU I L L" rather than "SAMUILL". A name matched only as written never
  // saw the surname in that heading, so it was left showing. Each part is
  // matched with up to two spaces allowed between its letters.
  const spaced = (part: string) => [...part].map(escapeRe).join('\\s{0,2}')
  const given = spaced(parts[0])
  const rest = parts.slice(1).map(spaced)
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

type Window = { text: string; spans: Span[]; ranges: [number, number][]; single: boolean }

/**
 * Every stretch of the page to look for contact details in, with what was
 * found in each: each line, and each line with the one after it.
 *
 * The pairs are there for one thing. A narrow column wraps an address across
 * a line break, so "Daniellashnider@y" sits on one line and "ahoo.com" on the
 * next, and neither half is an address on its own.
 *
 * They are joined without a space, because a space would split the address.
 * That also glued an address at the end of one line straight onto the first
 * word of the next — "oroli.samuill@gmail.comHighly" — and the address pattern
 * swallowed the word, so the whole first line of a summary went under a box.
 * So a pair now contributes only what single lines can't see: an email that
 * actually crosses the break and that isn't simply an address already
 * complete on one line with a word stuck to it. Phone numbers are not looked
 * for across lines at all; a number split over two lines is rare, and a date
 * range at the end of one line beside the dates on the next is not.
 *
 * Boxes and the safety net both read these, so anything the net can see is
 * something the boxes have already had a chance to cover.
 */
function scanWindows(items: TextItem[]): Window[] {
  const lines = groupIntoLines(items)
  const windows: Window[] = lines.map(line => {
    const { text, spans } = join(line)
    return { text, spans, ranges: contactRanges(text), single: true }
  })
  for (let i = 0; i + 1 < lines.length; i++) {
    const a = join(lines[i]).text
    const { text, spans } = join([...lines[i], ...lines[i + 1]])
    const breakAt = a.length
    const whole = [
      ...emailRanges(a),
      ...emailRanges(text.slice(breakAt)).map(([s0, e0]) => [s0 + breakAt, e0 + breakAt] as [number, number]),
    ]
    const ranges = emailRanges(text).filter(([s0, e0]) =>
      s0 < breakAt && e0 > breakAt
      && !whole.some(([ws, we]) => ws >= s0 && we <= e0))
    windows.push({ text, spans, ranges, single: false })
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

  for (const { text, spans, ranges, single } of scanWindows(items)) {
    const lineBoxes: Rect[] = []

    // Contact details take the whole item they touch; a name takes only its
    // own characters. See partOfItem.
    for (const [start, end] of ranges) {
      for (const span of spans) {
        if (span.end > start && span.start < end) lineBoxes.push({ ...span.item.rect })
      }
    }
    // A name is looked for one line at a time: the surname on its own is
    // matched wherever it appears, so a pair would only add ways to be wrong.
    for (const [start, end] of single ? nameRanges(text, fullName) : []) {
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
  for (const { spans, ranges } of scanWindows(items)) {
    for (const [start, end] of ranges) {
      const touching = spans.filter(s => s.end > start && s.start < end)
      const uncovered = touching.filter(s => !covered(s.item.rect, boxes))
      if (uncovered.length === 0) continue

      const stillReadable = uncovered.map(s => s.item.str).join('')
      if (contactRanges(stillReadable).length > 0) missed.add(stillReadable)
    }
  }

  return [...missed]
}

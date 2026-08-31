// Imported text sometimes arrives mis-decoded: an en-dash written as
// Windows-1252 0x96 isn't valid UTF-8, so it reaches us as U+FFFD ("5<62>7
// years"). Repair the common cases rather than showing a replacement glyph.
//
// Lives in its own module because both the display helpers and the taxonomy
// need it, and importing one from the other would make a cycle.
export function cleanText(v: string | null | undefined): string | null {
  let t = (v ?? '')
  if (!t) return null
  t = t
    // Classic UTF-8-read-as-Latin-1 sequences
    .replace(/\u00e2\u0080\u0093/g, '\u2013')
    .replace(/\u00e2\u0080\u0094/g, '\u2014')
    .replace(/\u00e2\u0080\u0099/g, '\u2019')
    .replace(/\u00e2\u0080\u009c|\u00e2\u0080\u009d/g, '"')
    .replace(/\u00c2/g, '')
    // A replacement char between digits was a dash: "5<>7 years"
    .replace(/(\d)\s*\uFFFD\s*(\d)/g, '$1\u2013$2')
    // Anything left is unrecoverable noise
    .replace(/\uFFFD/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return t || null
}

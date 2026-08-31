/**
 * A `?next=` value is attacker-controllable — anyone can hand out a link to our
 * own signup page carrying someone else's destination. Only same-site paths are
 * allowed through, so the redirect can never leave the site.
 *
 * Rejected: absolute URLs ("https://evil.test"), protocol-relative ones
 * ("//evil.test", which a browser treats as absolute), and backslash variants
 * some parsers normalise into slashes.
 */
export function safeNextPath(next: string | null | undefined, fallback: string): string {
  if (!next) return fallback
  const v = next.trim()
  if (!v.startsWith('/')) return fallback
  if (v.startsWith('//') || v.startsWith('/\\')) return fallback
  return v
}

import crypto from 'crypto'

// SERVER ONLY.

/**
 * A token that lets its holder play one signed video, for an hour.
 *
 * Mux uses the same token for a video's text tracks as for the video itself,
 * so this is also what fetching a transcript needs. Returns null when the
 * signing keys aren't configured.
 */
export function signPlaybackToken(playbackId: string): string | null {
  const keyId = process.env.MUX_SIGNING_KEY_ID
  const privateKeyB64 = process.env.MUX_SIGNING_PRIVATE_KEY
  if (!keyId || !privateKeyB64) return null

  const privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf8')
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: keyId })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    sub: playbackId,
    aud: 'v',
    exp: Math.floor(Date.now() / 1000) + 3600,
    kid: keyId,
  })).toString('base64url')

  const message = `${header}.${payload}`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(message)
  return `${message}.${sign.sign(privateKey, 'base64url')}`
}

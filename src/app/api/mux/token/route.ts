import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const playbackId = searchParams.get('playbackId')
  if (!playbackId) return new Response('Missing playbackId', { status: 400 })

  const keyId = process.env.MUX_SIGNING_KEY_ID
  const privateKeyB64 = process.env.MUX_SIGNING_PRIVATE_KEY
  if (!keyId || !privateKeyB64) return new Response('Signing keys not configured', { status: 500 })

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
  const signature = sign.sign(privateKey, 'base64url')

  return NextResponse.json({ token: `${message}.${signature}` })
}

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function verifyCalendlySignature(rawBody: string, header: string): boolean {
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')))
  const timestamp = parts['t']
  const signature = parts['v1']
  if (!timestamp || !signature) return false
  const expected = crypto
    .createHmac('sha256', process.env.CALENDLY_WEBHOOK_SECRET!)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text()

  const sigHeader = req.headers.get('calendly-webhook-signature') ?? ''
  if (!sigHeader || !verifyCalendlySignature(rawBody, sigHeader)) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: any
  try { body = JSON.parse(rawBody) } catch { return new Response('Invalid JSON', { status: 400 }) }

  if (body.event !== 'invitee.created') return new Response('Ignored', { status: 200 })

  const inviteeEmail: string = body.payload?.invitee?.email ?? ''
  const eventUri: string = body.payload?.event?.uri ?? ''
  const startTime: string = body.payload?.event?.start_time ?? ''
  const location = body.payload?.event?.location

  // Extract Zoom meeting ID from location data or join URL
  let zoomMeetingId: string | null = null
  if (location?.type === 'zoom') {
    if (location.data?.id) {
      zoomMeetingId = String(location.data.id)
    } else if (location.join_url) {
      const match = (location.join_url as string).match(/\/j\/(\d+)/)
      if (match) zoomMeetingId = match[1]
    }
  }

  if (!inviteeEmail) return new Response('No invitee email', { status: 400 })

  const supabase = adminClient()

  // Find candidate by email
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', inviteeEmail.trim().toLowerCase())
    .eq('role', 'candidate')
    .single()

  if (!profile?.id) return new Response('No candidate found for this email', { status: 200 })

  // Store booking with zoom meeting ID for later recording lookup
  await supabase.from('screening_bookings').upsert({
    candidate_id: profile.id,
    zoom_meeting_id: zoomMeetingId,
    scheduled_at: startTime || null,
    calendly_event_uri: eventUri || null,
  }, { onConflict: 'zoom_meeting_id' })

  // Mark screening as booked on candidate profile
  await supabase.from('candidate_profiles').update({
    screening_booked: true,
    screening_booked_at: startTime || new Date().toISOString(),
  }).eq('id', profile.id)

  return new Response('OK', { status: 200 })
}

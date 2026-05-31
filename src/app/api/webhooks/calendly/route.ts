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

async function getZoomToken(): Promise<string | null> {
  try {
    const res = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(
            `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
          ).toString('base64'),
        },
      }
    )
    const data = await res.json()
    return data.access_token ?? null
  } catch {
    return null
  }
}

async function createZoomMeeting(startTime: string): Promise<{ join_url: string; id: string } | null> {
  const token = await getZoomToken()
  if (!token) return null
  try {
    const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: 'Screening Call',
        type: 2,
        start_time: startTime,
        duration: 30,
        settings: { waiting_room: false, join_before_host: true },
      }),
    })
    const data = await res.json()
    if (data.join_url && data.id) return { join_url: data.join_url, id: String(data.id) }
    return null
  } catch {
    return null
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

  if (!inviteeEmail) return new Response('No invitee email', { status: 400 })

  // Get join URL from Calendly's Zoom integration, or create one
  let joinUrl: string | null = location?.join_url ?? null
  let zoomMeetingId: string | null = null

  if (location?.type === 'zoom') {
    zoomMeetingId = location.data?.id ? String(location.data.id) : null
    if (!zoomMeetingId && joinUrl) {
      const match = (joinUrl as string).match(/\/j\/(\d+)/)
      if (match) zoomMeetingId = match[1]
    }
  }

  // If Calendly didn't supply a Zoom link, create one via the Zoom API
  if (!joinUrl && startTime) {
    const meeting = await createZoomMeeting(startTime)
    if (meeting) {
      joinUrl = meeting.join_url
      zoomMeetingId = meeting.id
    }
  }

  const supabase = adminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', inviteeEmail.trim().toLowerCase())
    .eq('role', 'candidate')
    .single()

  if (!profile?.id) return new Response('No candidate found for this email', { status: 200 })

  await supabase.from('screening_bookings').upsert({
    candidate_id: profile.id,
    zoom_meeting_id: zoomMeetingId,
    scheduled_at: startTime || null,
    calendly_event_uri: eventUri || null,
    meeting_link: joinUrl,
  }, { onConflict: 'candidate_id' })

  await supabase.from('candidate_profiles').update({
    screening_booked: true,
    screening_booked_at: startTime || new Date().toISOString(),
  }).eq('id', profile.id)

  return new Response('OK', { status: 200 })
}

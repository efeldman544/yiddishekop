import { createClient } from '@supabase/supabase-js'
import Mux from '@mux/mux-node'
import crypto from 'crypto'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

function verifyZoomSignature(rawBody: string, signature: string, timestamp: string): boolean {
  const message = `v0:${timestamp}:${rawBody}`
  const expected = 'v0=' + crypto
    .createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN!)
    .update(message)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export async function POST(req: Request) {
  const rawBody = await req.text()

  let body: any
  try {
    body = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  // 1. Handle Zoom URL validation challenge
  if (body.event === 'endpoint.url_validation') {
    const plainToken = body.payload?.plainToken ?? ''
    const encryptedToken = crypto
      .createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN!)
      .update(plainToken)
      .digest('hex')
    return Response.json({ plainToken, encryptedToken })
  }

  // 2. Verify Zoom signature
  const signature = req.headers.get('x-zm-signature') ?? ''
  const timestamp = req.headers.get('x-zm-request-timestamp') ?? ''
  if (!signature || !timestamp || !verifyZoomSignature(rawBody, signature, timestamp)) {
    return new Response('Unauthorized', { status: 401 })
  }

  // 3. Only handle recording.completed
  if (body.event !== 'recording.completed') {
    return new Response('Ignored', { status: 200 })
  }

  const object = body.payload?.object
  const download_token: string = body.download_token ?? ''

  if (!object) return new Response('Invalid payload', { status: 400 })

  const meetingId: string = String(object.id ?? '')
  const recordingFiles: any[] = object.recording_files ?? []

  // 4. Find MP4 file (prefer shared screen + speaker view)
  const mp4File =
    recordingFiles.find((f) => f.file_type === 'MP4' && f.recording_type === 'shared_screen_with_speaker_view') ??
    recordingFiles.find((f) => f.file_type === 'MP4')

  if (!mp4File?.download_url) {
    return new Response('No MP4 recording found in payload', { status: 400 })
  }

  // 5. Fetch transcript text if available (VTT file, small enough to download here)
  const transcriptFile = recordingFiles.find((f) => f.file_type === 'TRANSCRIPT')
  let transcriptText: string | null = null
  if (transcriptFile?.download_url) {
    try {
      const res = await fetch(`${transcriptFile.download_url}?access_token=${download_token}`)
      if (res.ok) transcriptText = await res.text()
    } catch {}
  }

  // 6. Get Zoom OAuth token
  const tokenRes = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64'),
      },
    }
  )
  const { access_token } = await tokenRes.json()

  // 7. Fetch past meeting participants to find the candidate
  const participantsRes = await fetch(
    `https://api.zoom.us/v2/past_meetings/${meetingId}/participants`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  )
  const participantsData = await participantsRes.json()
  const participants: { email?: string; user_email?: string; name?: string }[] = participantsData.participants ?? []

  const hostEmail: string = object.host_email ?? ''
  const nonHostParticipants = participants.filter(p => {
    const email = p.email || p.user_email || ''
    return email.toLowerCase() !== hostEmail.toLowerCase()
  })

  const supabase = adminClient()
  let candidateId: string | null = null

  // 8a. Fallback 1 — match by participant email
  const candidateEmail = nonHostParticipants
    .map(p => p.email || p.user_email || '')
    .find(email => email)

  if (candidateEmail) {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', candidateEmail.toLowerCase())
      .eq('role', 'candidate')
      .single()
    if (data?.id) candidateId = data.id
  }

  // 8b. Fallback 2 — match by participant display name
  if (!candidateId) {
    for (const p of nonHostParticipants) {
      if (!p.name) continue
      const { data } = await supabase
        .from('candidate_profiles')
        .select('id')
        .ilike('full_name', p.name.trim())
        .single()
      if (data?.id) { candidateId = data.id; break }
    }
  }

  // 8c. Fallback 3 — save as unassigned so admin can manually link it
  // candidateId stays null, recording still gets saved

  // 9. Send to Mux for permanent storage (Zoom download tokens expire ~60 min)
  const mp4Url = `${mp4File.download_url}?access_token=${download_token}`
  let mux_asset_id: string | null = null
  let mux_playback_id: string | null = null
  try {
    const asset = await mux.video.assets.create({
      inputs: [{ url: mp4Url }],
      playback_policy: ['signed'],
    })
    mux_asset_id = asset.id
    mux_playback_id = asset.playback_ids?.[0]?.id ?? null
  } catch {
    // Mux failed — still save the raw URL as fallback
  }

  // 10. Save to videos table (candidate_id may be null if no match found)
  const { error } = await supabase.from('videos').insert({
    candidate_id: candidateId,
    mux_asset_id,
    mux_playback_id,
    url: mux_asset_id ? null : mp4Url,
    transcript: transcriptText,
    zoom_meeting_id: meetingId,
    approved: true,
  })

  if (error) return new Response(`DB insert failed: ${error.message}`, { status: 500 })

  return new Response('OK', { status: 200 })
}

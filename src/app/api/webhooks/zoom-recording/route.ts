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

  const supabase = adminClient()

  // Zoom retries webhooks that don't answer within a few seconds, and this
  // handler does slow work (Mux ingest, AI matching) — dedupe by meeting id so
  // a retry never ingests the same recording twice
  const { data: alreadySaved } = await supabase
    .from('videos')
    .select('id')
    .eq('zoom_meeting_id', meetingId)
    .limit(1)
  if (alreadySaved?.length) {
    return new Response('Already processed', { status: 200 })
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

  let candidateId: string | null = null

  // 6. Match tier 1 — the deterministic link. When the screening call was
  // booked through Calendly, the calendly webhook already stored
  // zoom_meeting_id → candidate_id in screening_bookings. If that row exists,
  // we KNOW who this recording belongs to — no guessing.
  const { data: bookings } = await supabase
    .from('screening_bookings')
    .select('candidate_id')
    .eq('zoom_meeting_id', meetingId)
    .limit(1)
  if (bookings?.[0]?.candidate_id) candidateId = bookings[0].candidate_id

  // 7. Fetch past meeting participants (used by tiers 2–4). Tolerate failure —
  // matching falls through to the meeting topic.
  let nonHostParticipants: { email?: string; user_email?: string; name?: string }[] = []
  if (!candidateId) {
    try {
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
      const participantsRes = await fetch(
        `https://api.zoom.us/v2/past_meetings/${meetingId}/participants`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      )
      const participantsData = await participantsRes.json()
      const participants: { email?: string; user_email?: string; name?: string }[] = participantsData.participants ?? []
      const hostEmail: string = object.host_email ?? ''
      nonHostParticipants = participants.filter(p => {
        const email = p.email || p.user_email || ''
        return email.toLowerCase() !== hostEmail.toLowerCase()
      })
    } catch {
      // participants unavailable — tiers below use what they have
    }
  }

  // 8a. Match tier 2 — participant emails (all of them, case-insensitive,
  // against both profiles and candidate_profiles)
  if (!candidateId) {
    const emails = nonHostParticipants
      .map(p => (p.email || p.user_email || '').trim())
      .filter(Boolean)
    for (const email of emails) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', email)
        .eq('role', 'candidate')
        .limit(1)
      if (prof?.[0]?.id) { candidateId = prof[0].id; break }
      const { data: cp } = await supabase
        .from('candidate_profiles')
        .select('id')
        .ilike('email', email)
        .limit(1)
      if (cp?.[0]?.id) { candidateId = cp[0].id; break }
    }
  }

  // 8b. Match tier 3 — exact display-name match (all participants;
  // limit(1) instead of single() so multiple same-named rows don't error out)
  if (!candidateId) {
    for (const p of nonHostParticipants) {
      if (!p.name) continue
      const { data } = await supabase
        .from('candidate_profiles')
        .select('id')
        .ilike('full_name', p.name.trim())
        .limit(1)
      if (data?.[0]?.id) { candidateId = data[0].id; break }
    }
  }

  // 8c. Match tier 4 — AI name match on participant display names + meeting
  // topic (handles nicknames/transliterations). Only a high-confidence match
  // auto-attaches; anything less stays unassigned for admin review.
  if (!candidateId) {
    const nameHints = [
      ...nonHostParticipants.map(p => p.name?.trim()).filter(Boolean),
      object.topic ? `meeting topic: ${object.topic}` : null,
    ].filter(Boolean).join(' | ')
    if (nameHints) {
      try {
        const { data: allProfiles } = await supabase
          .from('candidate_profiles')
          .select('id, full_name')
          .order('full_name')
        const { aiMatchNamesToCandidates } = await import('@/lib/aiNameMatch')
        const results = await aiMatchNamesToCandidates(
          [{ id: 'recording', name: nameHints }],
          (allProfiles ?? []) as { id: string; full_name: string | null }[],
        )
        if (results[0]?.confidence === 'high' && results[0].candidateId) {
          candidateId = results[0].candidateId
        }
      } catch {
        // AI unavailable — recording stays unassigned for manual review
      }
    }
  }

  // 8d. No match — save as unassigned so admin can link it on the Videos page

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

  // 11. Auto-mark candidate as interviewed when recording arrives
  if (candidateId) {
    await supabase.from('candidate_profiles').update({
      interviewed: true,
      interviewed_at: new Date().toISOString(),
    }).eq('id', candidateId)
  }

  return new Response('OK', { status: 200 })
}

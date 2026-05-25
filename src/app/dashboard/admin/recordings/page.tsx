import { createClient } from '@/lib/supabase/server'
import RecordingsClient, { type UnassignedRecording, type CandidateOption } from './RecordingsClient'

export default async function AdminRecordingsPage() {
  const supabase = await createClient()

  const [{ data: recordings }, { data: candidates }] = await Promise.all([
    supabase
      .from('videos')
      .select('id, zoom_meeting_id, mux_playback_id, url, transcript, created_at')
      .is('candidate_id', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('candidate_profiles')
      .select('id, full_name, email')
      .order('full_name'),
  ])

  return (
    <RecordingsClient
      initialRecordings={(recordings as UnassignedRecording[]) ?? []}
      candidates={(candidates as CandidateOption[]) ?? []}
    />
  )
}

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type UnassignedRecording = {
  id: string
  zoom_meeting_id: string | null
  mux_playback_id: string | null
  url: string | null
  transcript: string | null
  created_at: string
}

export type CandidateOption = {
  id: string
  full_name: string | null
  email: string | null
}

export default function RecordingsClient({
  initialRecordings,
  candidates,
}: {
  initialRecordings: UnassignedRecording[]
  candidates: CandidateOption[]
}) {
  const [recordings, setRecordings] = useState(initialRecordings)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [assigning, setAssigning] = useState<string | null>(null)
  const [transcriptOpen, setTranscriptOpen] = useState<string | null>(null)

  async function handleAssign(recordingId: string) {
    const candidateId = selected[recordingId]
    if (!candidateId) return
    setAssigning(recordingId)
    const supabase = createClient()
    const { error } = await supabase
      .from('videos')
      .update({ candidate_id: candidateId })
      .eq('id', recordingId)
    if (!error) setRecordings(prev => prev.filter(r => r.id !== recordingId))
    setAssigning(null)
  }

  return (
    <main className="px-8 py-8 space-y-5 overflow-auto">
      <div className="flex items-end justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-950 tracking-tight">Unassigned Recordings</h2>
        <span className="text-sm text-gray-400 mb-1">{recordings.length} total</span>
      </div>

      {recordings.length === 0 ? (
        <div className="text-sm text-gray-400 py-12 text-center">No unassigned recordings.</div>
      ) : (
        <div className="space-y-3">
          {recordings.map(rec => (
            <div key={rec.id} className="w-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-950">
                      {new Date(rec.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {rec.zoom_meeting_id && (
                      <p className="text-xs text-gray-400">Zoom meeting ID: {rec.zoom_meeting_id}</p>
                    )}
                    {rec.mux_playback_id && (
                      <p className="text-xs text-gray-400">Mux playback ID: {rec.mux_playback_id}</p>
                    )}
                    {rec.transcript && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => setTranscriptOpen(prev => prev === rec.id ? null : rec.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          {transcriptOpen === rec.id ? 'Hide transcript' : 'Show transcript'}
                        </button>
                        {transcriptOpen === rec.id && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                            {rec.transcript}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={selected[rec.id] ?? ''}
                      onValueChange={v => setSelected(prev => ({ ...prev, [rec.id]: v }))}
                    >
                      <SelectTrigger className="w-52">
                        <SelectValue placeholder="Select candidate..." />
                      </SelectTrigger>
                      <SelectContent>
                        {candidates.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.full_name ?? c.email ?? c.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      disabled={!selected[rec.id] || assigning === rec.id}
                      onClick={() => handleAssign(rec.id)}
                    >
                      {assigning === rec.id ? 'Assigning…' : 'Assign'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

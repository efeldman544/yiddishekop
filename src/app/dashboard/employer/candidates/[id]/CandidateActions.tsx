'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Action = 'request_meeting' | 'pass' | null

type Meeting = {
  scheduled_at: string
  meeting_link: string | null
  notes: string | null
} | null

export default function CandidateActions({
  candidateId,
  assignmentId,
  initialAction,
  initialProposedTimes,
  meeting,
}: {
  candidateId: string
  assignmentId: string
  initialAction: Action
  initialProposedTimes: string[]
  meeting: Meeting
}) {
  const [action, setAction] = useState<Action>(initialAction)
  const [proposedTimes, setProposedTimes] = useState<string[]>(initialProposedTimes)
  const [showForm, setShowForm] = useState(false)
  const [slots, setSlots] = useState<string[]>([''])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('employer-candidate-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'candidate_job_assignments' }, (payload) => {
        const row = payload.new as { id: string; action: string | null; proposed_times: string[] | null }
        if (row.id === assignmentId) {
          setAction((row.action ?? null) as Action)
          setProposedTimes(row.proposed_times ?? [])
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [assignmentId])

  async function handleRequestMeeting() {
    const filled = slots.filter(s => s.trim())
    if (filled.length === 0) { setError('Please add at least one available time.'); return }
    setSaving(true)
    setError(null)
    const supabase = createClient()
    await supabase.from('candidate_job_assignments').update({
      action: 'request_meeting',
      proposed_times: filled.map(s => new Date(s).toISOString()),
    }).eq('id', assignmentId)
    fetch('/api/notifications/meeting-request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidate_id: candidateId }),
    })
    setAction('request_meeting')
    setProposedTimes(filled.map(s => new Date(s).toISOString()))
    setShowForm(false)
    setSaving(false)
  }

  async function handlePass() {
    const next: Action = action === 'pass' ? null : 'pass'
    setSaving(true)
    const supabase = createClient()
    await supabase.from('candidate_job_assignments').update({ action: next, proposed_times: null }).eq('id', assignmentId)
    setAction(next)
    setProposedTimes([])
    setSaving(false)
  }

  async function handleUndo() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('candidate_job_assignments').update({ action: null, proposed_times: null }).eq('id', assignmentId)
    setAction(null)
    setProposedTimes([])
    setShowForm(false)
    setSlots([''])
    setSaving(false)
  }

  return (
    <>
      {meeting && (
        <Card className="border-indigo-200 bg-indigo-50/60">
          <CardHeader><CardTitle className="text-xs font-semibold text-indigo-700 uppercase tracking-widest">Meeting scheduled</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm font-medium text-indigo-900">
              {new Date(meeting.scheduled_at).toLocaleString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
              })}
            </p>
            {meeting.meeting_link && (
              <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 underline underline-offset-4 font-medium">
                Join meeting
              </a>
            )}
            {meeting.notes && <p className="text-xs text-indigo-700 mt-1">{meeting.notes}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Your decision</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Button
              className="flex-1"
              variant={action === 'request_meeting' ? 'default' : 'outline'}
              disabled={saving || !!meeting}
              onClick={() => {
                if (action === 'request_meeting') return
                setShowForm(f => !f)
                setError(null)
              }}
            >
              {action === 'request_meeting' ? 'Meeting requested ✓' : 'Request meeting'}
            </Button>
            <Button
              className="flex-1"
              variant={action === 'pass' ? 'secondary' : 'outline'}
              disabled={saving || !!meeting}
              onClick={handlePass}
            >
              {action === 'pass' ? 'Passed ✓' : 'Pass'}
            </Button>
          </div>

          {action === 'request_meeting' && proposedTimes.length > 0 && !meeting && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Your proposed times:</p>
              {proposedTimes.map((t, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  {new Date(t).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              ))}
              <p className="text-xs text-gray-400 mt-1">Waiting for admin to confirm a time.</p>
            </div>
          )}

          {showForm && !meeting && (
            <div className="border-t border-border pt-3 space-y-3">
              {error && <p className="text-xs text-destructive">{error}</p>}
              <p className="text-xs text-muted-foreground">Add up to 3 times you&apos;re available:</p>
              {slots.map((slot, i) => (
                <div key={i} className="space-y-1">
                  <Label className="text-xs">Option {i + 1}</Label>
                  <Input
                    type="datetime-local"
                    value={slot}
                    onChange={e => setSlots(prev => prev.map((s, j) => j === i ? e.target.value : s))}
                  />
                </div>
              ))}
              {slots.length < 3 && (
                <button
                  type="button"
                  onClick={() => setSlots(prev => [...prev, ''])}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  + Add another time
                </button>
              )}
              <Button onClick={handleRequestMeeting} disabled={saving} className="w-full">
                {saving ? 'Sending...' : 'Submit request'}
              </Button>
            </div>
          )}

          {(action || showForm) && !meeting && (
            <Button variant="ghost" size="sm" onClick={showForm ? () => setShowForm(false) : handleUndo} className="text-muted-foreground">
              {showForm ? 'Cancel' : 'Undo'}
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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
  meeting,
}: {
  candidateId: string
  assignmentId: string
  initialAction: Action
  meeting: Meeting
}) {
  const [action, setAction] = useState<Action>(initialAction)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('employer-candidate-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'candidate_job_assignments' }, (payload) => {
        const row = payload.new as { id: string; action: string | null }
        if (row.id === assignmentId) setAction((row.action ?? null) as Action)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [assignmentId])

  async function handleAction(newAction: Action) {
    const next = action === newAction ? null : newAction
    setSaving(true)
    const supabase = createClient()
    await supabase.from('candidate_job_assignments').update({ action: next }).eq('id', assignmentId)
    if (next === 'request_meeting') {
      fetch('/api/notifications/meeting-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidateId }),
      })
    }
    setAction(next)
    setSaving(false)
  }

  return (
    <>
      {meeting && (
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardHeader><CardTitle className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">Meeting scheduled</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm font-medium text-emerald-900">
              {new Date(meeting.scheduled_at).toLocaleString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
              })}
            </p>
            {meeting.meeting_link && (
              <a
                href={meeting.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-emerald-700 underline underline-offset-4 font-medium"
              >
                Join meeting
              </a>
            )}
            {meeting.notes && (
              <p className="text-xs text-emerald-700 mt-1">{meeting.notes}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Your decision</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              className="flex-1"
              variant={action === 'request_meeting' ? 'default' : 'outline'}
              disabled={saving || !!meeting}
              onClick={() => handleAction('request_meeting')}
            >
              {meeting ? 'Meeting requested ✓' : action === 'request_meeting' ? 'Meeting requested ✓' : 'Request meeting'}
            </Button>
            <Button
              className="flex-1"
              variant={action === 'pass' ? 'secondary' : 'outline'}
              disabled={saving || !!meeting}
              onClick={() => handleAction('pass')}
            >
              {action === 'pass' ? 'Passed ✓' : 'Pass'}
            </Button>
          </div>
          {action && !meeting && (
            <Button variant="ghost" size="sm" onClick={() => handleAction(action)} className="mt-3 text-muted-foreground">
              Undo
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  )
}

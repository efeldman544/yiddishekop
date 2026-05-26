'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

type PendingRequest = {
  assignmentId: string
  candidateId: string
  employerId: string
  candidateName: string
  employerName: string
  jobTitle: string
  requestedAt: string
  proposedTimes: string[]
}

type ScheduledMeeting = {
  assignmentId: string
  candidateName: string
  employerName: string
  scheduledAt: string
  meetingLink: string | null
}

type ScheduleForm = {
  scheduled_at: string
  notes: string
}

export default function MeetingsClient() {
  const [pending, setPending] = useState<PendingRequest[]>([])
  const [scheduled, setScheduled] = useState<ScheduledMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState<ScheduleForm>({ scheduled_at: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const supabase = createClient()

    const { data: assignments } = await supabase
      .from('candidate_job_assignments')
      .select('id, candidate_id, job_id, action, created_at, proposed_times')
      .eq('action', 'request_meeting')
      .order('created_at', { ascending: false })

    const { data: meetings } = await supabase
      .from('meeting_requests')
      .select('assignment_id, candidate_id, employer_id, scheduled_at, meeting_link')
      .order('scheduled_at', { ascending: true })

    const scheduledAssignmentIds = new Set((meetings ?? []).map((m: any) => m.assignment_id))

    const pendingAssignments = (assignments ?? []).filter((a: any) => !scheduledAssignmentIds.has(a.id))

    if (pendingAssignments.length === 0 && (meetings ?? []).length === 0) {
      setLoading(false)
      return
    }

    const candidateIds = [...new Set([
      ...pendingAssignments.map((a: any) => a.candidate_id),
      ...(meetings ?? []).map((m: any) => m.candidate_id),
    ])]

    const jobIds = [...new Set(pendingAssignments.map((a: any) => a.job_id))]

    const employerIds = [...new Set((meetings ?? []).map((m: any) => m.employer_id))]

    const [{ data: candidateProfiles }, { data: jobs }] = await Promise.all([
      candidateIds.length > 0
        ? supabase.from('candidate_profiles').select('id, full_name').in('id', candidateIds)
        : Promise.resolve({ data: [] }),
      jobIds.length > 0
        ? supabase.from('job_requirements').select('id, job_title, employer_id').in('id', jobIds)
        : Promise.resolve({ data: [] }),
    ])

    const allEmployerIds = [...new Set([
      ...(jobs ?? []).map((j: any) => j.employer_id),
      ...employerIds,
    ])]

    const { data: employerProfiles } = allEmployerIds.length > 0
      ? await supabase.from('profiles').select('id, full_name').in('id', allEmployerIds)
      : { data: [] }

    const candidateMap: Record<string, string> = {}
    for (const c of candidateProfiles ?? []) candidateMap[c.id] = c.full_name ?? 'Unknown'

    const employerMap: Record<string, string> = {}
    for (const e of employerProfiles ?? []) employerMap[e.id] = e.full_name ?? 'Unknown'

    const jobMap: Record<string, { title: string; employerId: string }> = {}
    for (const j of jobs ?? []) jobMap[j.id] = { title: j.job_title, employerId: j.employer_id }

    setPending(pendingAssignments.map((a: any) => ({
      assignmentId: a.id,
      candidateId: a.candidate_id,
      employerId: jobMap[a.job_id]?.employerId ?? '',
      candidateName: candidateMap[a.candidate_id] ?? 'Unknown',
      employerName: employerMap[jobMap[a.job_id]?.employerId ?? ''] ?? 'Unknown',
      jobTitle: jobMap[a.job_id]?.title ?? 'Unknown role',
      requestedAt: a.created_at,
      proposedTimes: a.proposed_times ?? [],
    })))

    setScheduled((meetings ?? []).map((m: any) => ({
      assignmentId: m.assignment_id,
      candidateName: candidateMap[m.candidate_id] ?? 'Unknown',
      employerName: employerMap[m.employer_id] ?? 'Unknown',
      scheduledAt: m.scheduled_at,
      meetingLink: m.meeting_link,
    })))

    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSchedule(req: PendingRequest) {
    if (!form.scheduled_at) { setError('Please select a date and time.'); return }
    setSaving(true)
    setError(null)
    const res = await fetch('/api/admin/schedule-meeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignment_id: req.assignmentId,
        candidate_id: req.candidateId,
        employer_id: req.employerId,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        notes: form.notes || null,
      }),
    })
    if (!res.ok) {
      setError('Failed to schedule meeting. Please try again.')
      setSaving(false)
      return
    }
    setExpandedId(null)
    setForm({ scheduled_at: '', notes: '' })
    await load()
    setSaving(false)
  }

  if (loading) return <div className="text-sm text-gray-400 py-12 text-center">Loading...</div>

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Pending ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400">No pending meeting requests.</p>
        ) : (
          <div className="space-y-3">
            {pending.map(req => (
              <Card key={req.assignmentId} className="overflow-hidden">
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">{req.employerName} <span className="font-normal text-gray-400">wants to meet</span> {req.candidateName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{req.jobTitle} · Requested {new Date(req.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={expandedId === req.assignmentId ? 'default' : 'outline'}
                      onClick={() => {
                        setExpandedId(expandedId === req.assignmentId ? null : req.assignmentId)
                        setError(null)
                        setForm({ scheduled_at: '', notes: '' })
                      }}
                    >
                      {expandedId === req.assignmentId ? 'Cancel' : 'Schedule'}
                    </Button>
                  </div>

                  {expandedId === req.assignmentId && (
                    <div className="border-t border-gray-100 pt-3 space-y-3">
                      {error && <p className="text-xs text-red-500">{error}</p>}

                      {req.proposedTimes.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-gray-500">Employer&apos;s proposed times — click to use:</p>
                          <div className="flex flex-wrap gap-2">
                            {req.proposedTimes.map((t, i) => {
                              const localVal = new Date(t).toISOString().slice(0, 16)
                              const isSelected = form.scheduled_at === localVal
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setForm(f => ({ ...f, scheduled_at: localVal }))}
                                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                                    isSelected
                                      ? 'bg-gray-900 text-white border-gray-900'
                                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                  }`}
                                >
                                  {new Date(t).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <Label htmlFor={`dt-${req.assignmentId}`}>Date &amp; Time <span className="text-destructive">*</span></Label>
                        <Input
                          id={`dt-${req.assignmentId}`}
                          type="datetime-local"
                          value={form.scheduled_at}
                          onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`notes-${req.assignmentId}`}>Notes (optional)</Label>
                        <Textarea
                          id={`notes-${req.assignmentId}`}
                          placeholder="Any context for the meeting..."
                          value={form.notes}
                          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                          rows={2}
                        />
                      </div>
                      <Button onClick={() => handleSchedule(req)} disabled={saving} className="w-full">
                        {saving ? 'Creating Zoom meeting...' : 'Confirm & create Zoom meeting'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {scheduled.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Scheduled ({scheduled.length})
          </h3>
          <div className="space-y-2">
            {scheduled.map(m => (
              <div key={m.assignmentId} className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-150 text-sm">
                <div>
                  <span className="font-medium text-gray-900">{m.employerName}</span>
                  <span className="text-gray-400"> + </span>
                  <span className="font-medium text-gray-900">{m.candidateName}</span>
                  <span className="text-gray-400 ml-2">·</span>
                  <span className="text-gray-500 ml-2">
                    {new Date(m.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {m.meetingLink && (
                  <a href={m.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline underline-offset-4 shrink-0">
                    Join link
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

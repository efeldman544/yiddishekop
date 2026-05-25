'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type CandidateSummary = {
  id: string
  full_name: string | null
  location: string | null
  current_job_title: string | null
  fields_worked_in: string[]
  employment_type: string[]
  resume_url: string | null
  action?: string | null
  assignmentId?: string
}

export default function EmployerDashboard() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<CandidateSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [employerName, setEmployerName] = useState<string | null>(null)
  const [savingAction, setSavingAction] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: profile }, { data: myJobs }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single<{ full_name: string | null }>(),
        supabase.from('job_requirements').select('id').eq('employer_id', user.id),
      ])

      setEmployerName(profile?.full_name ?? null)
      const jobIds = (myJobs ?? []).map((j: { id: string }) => j.id)
      if (jobIds.length === 0) { setLoading(false); return }

      const { data: assignments } = await supabase
        .from('candidate_job_assignments').select('id, candidate_id, action').in('job_id', jobIds)

      const actionMap: Record<string, { action: string | null; assignmentId: string }> = {}
      for (const a of assignments ?? []) {
        if (!(a.candidate_id in actionMap)) actionMap[a.candidate_id] = { action: a.action, assignmentId: a.id }
      }

      const candidateIds = Object.keys(actionMap)
      if (candidateIds.length === 0) { setLoading(false); return }

      const { data: profiles } = await supabase
        .from('candidate_profiles')
        .select('id, full_name, location, current_job_title, fields_worked_in, employment_type, resume_url')
        .in('id', candidateIds)

      setCandidates((profiles ?? []).map((p: CandidateSummary) => ({
        ...p, action: actionMap[p.id]?.action ?? null, assignmentId: actionMap[p.id]?.assignmentId,
      })))
      setLoading(false)
    }
    load()
  }, [router])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('employer-assignment-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'candidate_job_assignments' }, (payload) => {
        const row = payload.new as { id: string; candidate_id: string; action: string | null }
        setCandidates(prev => prev.map(c => c.assignmentId === row.id ? { ...c, action: row.action } : c))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function handleCardAction(candidateId: string, assignmentId: string, newAction: 'request_meeting' | 'pass') {
    const candidate = candidates.find(c => c.id === candidateId)
    const next = candidate?.action === newAction ? null : newAction
    setSavingAction(candidateId)
    const supabase = createClient()
    await supabase.from('candidate_job_assignments').update({ action: next }).eq('id', assignmentId)
    if (next === 'request_meeting') {
      fetch('/api/notifications/meeting-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidateId }),
      })
    }
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, action: next } : c))
    setSavingAction(null)
  }

  if (loading) {
    return <div className="state-center"><p className="state-text">Loading...</p></div>
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-8 space-y-5">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {employerName ? `Welcome, ${employerName}` : 'Dashboard'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          {(() => {
            const pending = candidates.filter(c => !c.action).length
            if (candidates.length === 0) return 'No candidates matched to your roles yet.'
            if (pending === 0) return 'All candidates reviewed.'
            return `${pending} candidate${pending !== 1 ? 's' : ''} awaiting review.`
          })()}
        </p>
      </div>

      {candidates.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Candidates</p>
          {candidates.map(c => (
            <Card key={c.id} className="w-full overflow-hidden">
              <CardContent className="pt-4 pb-3.5 px-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                      <p className="text-xl font-bold tracking-tight">{c.full_name ?? 'Unnamed'}</p>
                      {c.action === 'request_meeting' && <Badge className="bg-blue-100 text-blue-700 border-blue-200">Meeting requested</Badge>}
                      {c.action === 'pass' && <Badge variant="secondary">Passed</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2.5">
                      {[c.current_job_title, c.location].filter(Boolean).join(' · ')}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {c.fields_worked_in?.map(f => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}
                      {c.employment_type?.map(e => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}
                    </div>
                  </div>
                  <Link href={`/dashboard/employer/candidates/${c.id}`}
                    className="shrink-0 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mt-0.5">
                    View →
                  </Link>
                </div>
              </CardContent>
              {c.assignmentId && (
                <div className="border-t border-border px-5 py-2.5 flex items-center gap-2 bg-muted/30">
                  <Button
                    size="sm"
                    variant={c.action === 'request_meeting' ? 'default' : 'outline'}
                    disabled={savingAction === c.id}
                    onClick={() => handleCardAction(c.id, c.assignmentId!, 'request_meeting')}
                  >
                    {c.action === 'request_meeting' ? '✓ Meeting requested' : 'Request meeting'}
                  </Button>
                  <Button
                    size="sm"
                    variant={c.action === 'pass' ? 'secondary' : 'outline'}
                    disabled={savingAction === c.id}
                    onClick={() => handleCardAction(c.id, c.assignmentId!, 'pass')}
                  >
                    {c.action === 'pass' ? '✓ Passed' : 'Pass'}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}

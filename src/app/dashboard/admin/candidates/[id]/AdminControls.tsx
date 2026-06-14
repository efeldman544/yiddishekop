'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

const ALL_INDUSTRIES = [
  'Accounting & Finance', 'Administrative & Office Support', 'Arts & Creative',
  'Construction & Engineering', 'Customer Service', 'Data & Analytics',
  'Education & Training', 'Engineering', 'Healthcare & Medical',
  'Insurance', 'Legal & Compliance', 'Logistics & Supply Chain',
  'Manufacturing & Operations', 'Marketing & Advertising', 'Media & Communications',
  'Nonprofit & Social Services', 'Real Estate', 'Retail & E-commerce',
  'Sales & Business Development', 'Technology & Software', 'Other',
]

const STATUS_OPTIONS = ['active', 'inactive', 'placed']

export type Employer = {
  id: string
  full_name: string | null
  email: string | null
}

export default function AdminControls({
  candidateId,
  initialStatus,
  initialTags,
  employers,
  initialAssignedIds,
  initialEmployerActions,
}: {
  candidateId: string
  initialStatus: string
  initialTags: string[]
  employers: Employer[]
  initialAssignedIds: string[]
  initialEmployerActions: Record<string, string | null>
}) {
  const [status, setStatus] = useState(initialStatus)
  const [adminTags, setAdminTags] = useState<string[]>(initialTags)
  const [savingMeta, setSavingMeta] = useState(false)
  const [metaSaved, setMetaSaved] = useState(false)
  const [assignedIds, setAssignedIds] = useState<string[]>(initialAssignedIds)
  const [employerActions, setEmployerActions] = useState<Record<string, string | null>>(initialEmployerActions)
  const [togglingEmployer, setTogglingEmployer] = useState<string | null>(null)

  async function saveMeta() {
    setSavingMeta(true); setMetaSaved(false)
    const supabase = createClient()
    await supabase.from('candidate_profiles').update({ admin_tags: adminTags, status }).eq('id', candidateId)
    setSavingMeta(false); setMetaSaved(true)
    setTimeout(() => setMetaSaved(false), 2500)
  }

  function toggleTag(tag: string) {
    setAdminTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  async function toggleAssignment(employerId: string) {
    setTogglingEmployer(employerId)
    const supabase = createClient()
    const isAssigned = assignedIds.includes(employerId)
    if (isAssigned) {
      await supabase.from('employer_candidate_assignments').delete().eq('employer_id', employerId).eq('candidate_id', candidateId)
      setAssignedIds(prev => prev.filter(eid => eid !== employerId))
      setEmployerActions(prev => { const next = { ...prev }; delete next[employerId]; return next })
    } else {
      await supabase.from('employer_candidate_assignments').insert({ employer_id: employerId, candidate_id: candidateId })
      setAssignedIds(prev => [...prev, employerId])
    }
    setTogglingEmployer(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-sm">Status</CardTitle></CardHeader>
        <CardContent>
          <RadioGroup value={status} onValueChange={setStatus} className="space-y-2">
            {STATUS_OPTIONS.map(s => (
              <div key={s} className="flex items-center gap-2">
                <RadioGroupItem value={s} id={`status-${s}`} />
                <Label htmlFor={`status-${s}`} className="font-normal cursor-pointer capitalize">{s}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Industry tags</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ALL_INDUSTRIES.map(tag => (
              <div key={tag} className="flex items-center gap-2">
                <Checkbox id={`tag-${tag}`} checked={adminTags.includes(tag)} onCheckedChange={() => toggleTag(tag)} />
                <Label htmlFor={`tag-${tag}`} className="font-normal cursor-pointer">{tag}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={saveMeta} disabled={savingMeta} className="w-full">
        {savingMeta ? 'Saving...' : metaSaved ? 'Saved ✓' : 'Save changes'}
      </Button>

      <Card>
        <CardHeader><CardTitle className="text-sm">Assign to employers</CardTitle></CardHeader>
        <CardContent>
          {employers.length === 0 ? (
            <p className="text-xs text-muted-foreground">No employer accounts found.</p>
          ) : (
            <div className="space-y-2">
              {employers.map(emp => {
                const isAssigned = assignedIds.includes(emp.id)
                const action = employerActions[emp.id]
                return (
                  <div key={emp.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Checkbox
                        id={`emp-${emp.id}`}
                        checked={isAssigned}
                        disabled={togglingEmployer === emp.id}
                        onCheckedChange={() => toggleAssignment(emp.id)}
                      />
                      <Label htmlFor={`emp-${emp.id}`} className="font-normal cursor-pointer truncate">
                        {emp.full_name ?? emp.email ?? emp.id}
                      </Label>
                    </div>
                    {isAssigned && action && (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {action === 'request_meeting' ? 'Meeting' : 'Passed'}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

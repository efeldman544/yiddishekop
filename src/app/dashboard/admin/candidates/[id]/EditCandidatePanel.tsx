'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { INDUSTRIES, EMPLOYMENT_TYPES, EDUCATION_LEVELS, EXPERIENCE_LEVELS } from '@/lib/candidateOptions'

export type EditableCandidate = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  location: string | null
  current_job_title: string | null
  education_level: string | null
  years_experience: string | null
  fields_worked_in: string[] | null
  employment_type: string[] | null
  tools_software: string | null
  languages: string | null
  roles_seeking: string | null
  desired_salary: string | null
  currency: string | null
  us_hours_comfortable: boolean | null
  remote_experience: boolean | null
}

type FormState = Omit<EditableCandidate, 'id' | 'fields_worked_in' | 'employment_type'> & {
  fields_worked_in: string[]
  employment_type: string[]
}

function toForm(c: EditableCandidate): FormState {
  return {
    full_name: c.full_name ?? '', email: c.email ?? '', phone: c.phone ?? '',
    whatsapp: c.whatsapp ?? '', location: c.location ?? '',
    current_job_title: c.current_job_title ?? '', education_level: c.education_level ?? '',
    years_experience: c.years_experience ?? '', fields_worked_in: c.fields_worked_in ?? [],
    employment_type: c.employment_type ?? [], tools_software: c.tools_software ?? '',
    languages: c.languages ?? '', roles_seeking: c.roles_seeking ?? '',
    desired_salary: c.desired_salary ?? '', currency: c.currency ?? '',
    us_hours_comfortable: c.us_hours_comfortable ?? false,
    remote_experience: c.remote_experience ?? false,
  }
}

export default function EditCandidatePanel({ candidate }: { candidate: EditableCandidate }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(() => toForm(candidate))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleIn(key: 'fields_worked_in' | 'employment_type', value: string) {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value],
    }))
  }

  function openPanel() {
    setForm(toForm(candidate))
    setError(null); setConfirmDelete(false); setOpen(true)
  }

  async function handleSave() {
    if (!form.full_name?.trim()) { setError('Full name is required.'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/admin/candidates/${candidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        setError(await res.text().catch(() => '') || `Save failed (${res.status})`)
        return
      }
      setOpen(false)
      router.refresh()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true); setError(null)
    try {
      const res = await fetch(`/api/admin/candidates/${candidate.id}`, { method: 'DELETE' })
      if (!res.ok) {
        setError(await res.text().catch(() => '') || `Delete failed (${res.status})`)
        setDeleting(false)
        return
      }
      router.push('/dashboard/admin')
      router.refresh()
    } catch {
      setError('Network error — please try again.')
      setDeleting(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={openPanel}>Edit profile</Button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => !deleting && setOpen(false)} />
          <div className="w-full max-w-lg bg-background shadow-2xl flex flex-col overflow-hidden border-l border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-[15px] font-semibold tracking-tight">Edit candidate</h3>
              <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} className="text-muted-foreground">×</Button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Full name <span className="text-destructive">*</span></Label>
                  <Input value={form.full_name ?? ''} onChange={e => set('full_name', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>WhatsApp</Label>
                  <Input value={form.whatsapp ?? ''} onChange={e => set('whatsapp', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input value={form.location ?? ''} onChange={e => set('location', e.target.value)} placeholder="City, Country" />
                </div>
                <div className="space-y-1.5">
                  <Label>Current job title</Label>
                  <Input value={form.current_job_title ?? ''} onChange={e => set('current_job_title', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="education_level">Education</Label>
                  <Input id="education_level" list="education-options" value={form.education_level ?? ''}
                    onChange={e => set('education_level', e.target.value)} placeholder="Select or type…" />
                  <datalist id="education-options">
                    {EDUCATION_LEVELS.map(v => <option key={v} value={v} />)}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="years_experience">Experience</Label>
                  <Input id="years_experience" list="experience-options" value={form.years_experience ?? ''}
                    onChange={e => set('years_experience', e.target.value)} placeholder="Select or type…" />
                  <datalist id="experience-options">
                    {EXPERIENCE_LEVELS.map(v => <option key={v} value={v} />)}
                  </datalist>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Industries</Label>
                <p className="text-xs text-muted-foreground">Used by matching and the industry filter.</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1 max-h-56 overflow-y-auto rounded-lg border border-border p-3">
                  {INDUSTRIES.map(ind => (
                    <label key={ind} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={form.fields_worked_in.includes(ind)}
                        onCheckedChange={() => toggleIn('fields_worked_in', ind)}
                      />
                      <span className="leading-tight">{ind}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Employment type</Label>
                <div className="flex gap-4 pt-1">
                  {EMPLOYMENT_TYPES.map(t => (
                    <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={form.employment_type.includes(t)}
                        onCheckedChange={() => toggleIn('employment_type', t)}
                      />
                      {t}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Tools &amp; software</Label>
                <Input value={form.tools_software ?? ''} onChange={e => set('tools_software', e.target.value)} placeholder="QuickBooks, Excel" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Languages</Label>
                  <Input value={form.languages ?? ''} onChange={e => set('languages', e.target.value)} placeholder="English, Yiddish" />
                </div>
                <div className="space-y-1.5">
                  <Label>Roles seeking</Label>
                  <Input value={form.roles_seeking ?? ''} onChange={e => set('roles_seeking', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Desired salary</Label>
                  <Input value={form.desired_salary ?? ''} onChange={e => set('desired_salary', e.target.value)} placeholder="e.g. $25/hr" />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Input value={form.currency ?? ''} onChange={e => set('currency', e.target.value)} placeholder="USD" />
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={!!form.us_hours_comfortable} onCheckedChange={c => set('us_hours_comfortable', !!c)} />
                  Comfortable with U.S. hours
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={!!form.remote_experience} onCheckedChange={c => set('remote_experience', !!c)} />
                  Remote experience
                </label>
              </div>

              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5 space-y-2">
                <p className="text-sm font-medium text-destructive">Delete candidate</p>
                <p className="text-xs text-muted-foreground">
                  Permanently removes {candidate.full_name ?? 'this candidate'}, their login, resume, videos, and all
                  job/employer assignments. This cannot be undone.
                </p>
                {confirmDelete ? (
                  <div className="flex items-center gap-2 pt-1">
                    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                      {deleting ? 'Deleting…' : 'Yes, delete permanently'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}
                    className="text-destructive border-destructive/40 hover:bg-destructive/10">
                    Delete candidate
                  </Button>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving || deleting}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || deleting}>{saving ? 'Saving…' : 'Save changes'}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

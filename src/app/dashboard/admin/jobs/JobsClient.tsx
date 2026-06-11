'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

export type EmployerOption = {
  id: string
  company_name: string | null
  full_name: string | null
}

export type Job = {
  id: string
  employer_id: string | null
  company_name: string | null
  job_title: string
  status: string
  employment_type: string | null
  salary: string | null
  hours: string | null
  description: string | null
  languages: string | null
  notes: string | null
  created_at: string
}

type FormState = {
  employer_id: string; employer_input: string; company_name: string; job_title: string; status: string
  employment_type: string; salary: string; hours: string; description: string
  languages: string; notes: string
}

const EMPTY_FORM: FormState = {
  employer_id: '', employer_input: '', company_name: '', job_title: '', status: 'Open',
  employment_type: '', salary: '', hours: '', description: '', languages: '', notes: '',
}

const STATUS_OPTIONS = ['Open', 'Filled', 'On Hold', 'Closed']
const EMPLOYMENT_OPTIONS = ['Full Time', 'Part Time', 'Contract']

const STATUS_BADGE: Record<string, string> = {
  'Open':    'bg-green-100 text-green-700 border-green-200',
  'Filled':  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'On Hold': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Closed':  'bg-gray-100 text-gray-500 border-gray-200',
}

export function employerLabel(emp: EmployerOption) {
  return emp.company_name || emp.full_name || emp.id
}

export default function JobsClient({
  initialJobs,
  initialEmployers,
}: {
  initialJobs: Job[]
  initialEmployers: EmployerOption[]
}) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [employers, setEmployers] = useState<EmployerOption[]>(initialEmployers)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'jobs' | 'employers'>('jobs')
  const [employerAccounts, setEmployerAccounts] = useState<{id: string; full_name: string | null; email: string | null; created_at: string}[] | null>(null)
  const [loadingEmployers, setLoadingEmployers] = useState(false)
  const [employerPanelOpen, setEmployerPanelOpen] = useState(false)
  const [employerForm, setEmployerForm] = useState({ full_name: '', email: '', company_name: '' })
  const [employerError, setEmployerError] = useState<string | null>(null)
  const [creatingEmployer, setCreatingEmployer] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null)

  function openNew() { setEditingId(null); setForm(EMPTY_FORM); setError(null); setPanelOpen(true) }

  function openEdit(job: Job) {
    setEditingId(job.id)
    const emp = employers.find(e => e.id === job.employer_id)
    const empLabel = emp ? employerLabel(emp) : (job.company_name ?? '')
    setForm({
      employer_id: job.employer_id ?? '', employer_input: empLabel, company_name: job.company_name ?? '',
      job_title: job.job_title, status: job.status, employment_type: job.employment_type ?? '',
      salary: job.salary ?? '', hours: job.hours ?? '', description: job.description ?? '',
      languages: job.languages ?? '', notes: job.notes ?? '',
    })
    setError(null); setPanelOpen(true)
  }

  function closePanel() { setPanelOpen(false); setEditingId(null); setError(null) }

  async function loadEmployerAccounts() {
    if (employerAccounts !== null) return
    setLoadingEmployers(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('role', 'employer')
      .order('full_name')
    setEmployerAccounts(data ?? [])
    setLoadingEmployers(false)
  }

  function openNewEmployer() {
    setEmployerForm({ full_name: '', email: '', company_name: '' })
    setEmployerError(null)
    setCreatedCredentials(null)
    setEmployerPanelOpen(true)
  }

  function closeEmployerPanel() {
    setEmployerPanelOpen(false)
    setEmployerError(null)
    setCreatedCredentials(null)
  }

  async function handleCreateEmployer() {
    if (!employerForm.full_name.trim()) { setEmployerError('Full name is required.'); return }
    if (!employerForm.email.trim()) { setEmployerError('Email is required.'); return }
    setCreatingEmployer(true)
    setEmployerError(null)
    try {
      const res = await fetch('/api/admin/create-employer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: employerForm.email.trim(),
          full_name: employerForm.full_name.trim(),
          company_name: employerForm.company_name.trim() || null,
        }),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        setEmployerError(text || `Failed to create employer (${res.status})`)
        return
      }
      const data = await res.json()
      setCreatedCredentials({ email: data.email, password: data.password })
      setEmployerAccounts(prev => [
        { id: data.id, full_name: data.full_name, email: data.email, created_at: new Date().toISOString() },
        ...(prev ?? []),
      ])
      const newEmp: EmployerOption = { id: data.id, company_name: data.company_name, full_name: data.full_name }
      setEmployers(prev => [...prev, newEmp].sort((a, b) => employerLabel(a).localeCompare(employerLabel(b))))
    } finally {
      setCreatingEmployer(false)
    }
  }

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleEmployerInput(value: string) {
    const matched = employers.find(e => employerLabel(e).toLowerCase() === value.toLowerCase())
    setForm(prev => ({
      ...prev,
      employer_input: value,
      employer_id: matched ? matched.id : '',
      company_name: matched ? (matched.company_name ?? '') : value,
    }))
  }

  async function handleSave() {
    if (!form.job_title.trim()) { setError('Job title is required.'); return }
    setSaving(true); setError(null)
    const supabase = createClient()
    const payload = {
      employer_id: form.employer_id || null, company_name: form.company_name.trim() || null,
      job_title: form.job_title.trim(), status: form.status,
      employment_type: form.employment_type || null, salary: form.salary || null,
      hours: form.hours || null, description: form.description || null,
      languages: form.languages || null, notes: form.notes || null,
      updated_at: new Date().toISOString(),
    }
    if (editingId) {
      const { data, error: err } = await supabase.from('job_requirements').update(payload).eq('id', editingId).select('*').single()
      if (err) { setError(err.message); setSaving(false); return }
      setJobs(prev => prev.map(j => j.id === editingId ? data as Job : j))
    } else {
      const { data, error: err } = await supabase.from('job_requirements').insert(payload).select('*').single()
      if (err) { setError(err.message); setSaving(false); return }
      setJobs(prev => [data as Job, ...prev])
    }
    setSaving(false); closePanel()
  }

  async function handleDelete() {
    if (!editingId || !confirm('Delete this job?')) return
    const supabase = createClient()
    await supabase.from('job_requirements').delete().eq('id', editingId)
    setJobs(prev => prev.filter(j => j.id !== editingId))
    closePanel()
  }

  function getEmployerDisplay(job: Job) {
    const emp = employers.find(e => e.id === job.employer_id)
    if (emp) return { name: emp.full_name || emp.id, company: job.company_name ?? null }
    return { name: job.company_name ?? '—', company: null }
  }

  return (
    <>
      <main className="px-8 py-8 space-y-5 overflow-auto flex-1">
        <div className="flex items-center gap-1 border-b border-gray-100 mb-6 -mx-8 px-8">
          <button
            type="button"
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === 'jobs'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            Jobs
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('employers'); loadEmployerAccounts() }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === 'employers'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            Employers
          </button>
        </div>

        {activeTab === 'jobs' ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-950 tracking-tight">Job Board</h2>
              <Button onClick={openNew}>+ New job</Button>
            </div>

            {jobs.length === 0 ? (
              <div className="text-sm text-gray-400 py-12 text-center">No jobs yet. Add your first one.</div>
            ) : (
              <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Employer</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Job Title</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Type</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Created</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {jobs.map(job => (
                      <tr key={job.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          {(() => { const { name, company } = getEmployerDisplay(job); return (
                            <>
                              <p className="font-semibold text-[13px] text-gray-950">{name}</p>
                              {company && <p className="text-[12px] text-gray-400 mt-0.5">{company}</p>}
                            </>
                          )})()}
                        </td>
                        <td className="px-5 py-3.5 text-[13px] text-gray-500">{job.job_title}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${STATUS_BADGE[job.status] ?? 'bg-gray-100 text-gray-500'}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[13px] text-gray-500">{job.employment_type ?? '—'}</td>
                        <td className="px-5 py-3.5 text-gray-400 text-[12px] tabular-nums">
                          {new Date(job.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(job)}>Edit</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-950 tracking-tight">Employers</h2>
              <Button onClick={openNewEmployer}>+ Add employer</Button>
            </div>
            {loadingEmployers ? (
              <div className="text-sm text-gray-400 py-12 text-center">Loading...</div>
            ) : (employerAccounts ?? []).length === 0 ? (
              <div className="text-sm text-gray-400 py-12 text-center">No employer accounts yet.</div>
            ) : (
              <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Name</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Email</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(employerAccounts ?? []).map(emp => (
                      <tr key={emp.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-gray-950 text-[13px]">{emp.full_name ?? '—'}</td>
                        <td className="px-5 py-3.5 text-gray-500 text-[13px]">{emp.email ?? '—'}</td>
                        <td className="px-5 py-3.5 text-gray-400 text-[12px] tabular-nums">
                          {new Date(emp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {panelOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={closePanel} />
          <div className="w-full max-w-lg bg-background shadow-2xl flex flex-col overflow-hidden border-l border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-[15px] font-semibold tracking-tight">{editingId ? 'Edit job' : 'New job'}</h3>
              <Button variant="ghost" size="icon-sm" onClick={closePanel} className="text-muted-foreground">×</Button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="employer_input">Employer</Label>
                <input
                  id="employer_input"
                  list="employer-datalist"
                  value={form.employer_input}
                  onChange={e => handleEmployerInput(e.target.value)}
                  placeholder="Type or select an employer…"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                  autoComplete="off"
                />
                <datalist id="employer-datalist">
                  {employers.map(emp => <option key={emp.id} value={employerLabel(emp)} />)}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company_name">Company Name</Label>
                <Input id="company_name" value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="e.g. Acme Corp" />
                <p className="text-xs text-muted-foreground">Saved to the employer&apos;s profile and shown throughout the app.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="job_title">Job Title <span className="text-destructive">*</span></Label>
                <Input id="job_title" value={form.job_title} onChange={e => set('job_title', e.target.value)} placeholder="e.g. Senior Accountant" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Status <span className="text-destructive">*</span></Label>
                  <Select value={form.status} onValueChange={v => set('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Employment Type</Label>
                  <Select value={form.employment_type || '_none'} onValueChange={v => set('employment_type', v === '_none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Select...</SelectItem>
                      {EMPLOYMENT_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="salary">Salary</Label>
                  <Input id="salary" value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="e.g. $65,000/year" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hours">Hours</Label>
                  <Input id="hours" value={form.hours} onChange={e => set('hours', e.target.value)} placeholder="e.g. 40/week" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="languages">Languages Required</Label>
                <Input id="languages" value={form.languages} onChange={e => set('languages', e.target.value)} placeholder="e.g. English, Yiddish" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Role overview, responsibilities..." />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">
                  Internal Notes <span className="text-xs font-normal text-muted-foreground">— never shown to candidates or employers</span>
                </Label>
                <Textarea id="notes" value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Admin-only notes..." />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
              {editingId ? (
                <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  Delete job
                </Button>
              ) : <div />}
              <div className="flex gap-2">
                <Button variant="outline" onClick={closePanel}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save job'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {employerPanelOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={closeEmployerPanel} />
          <div className="w-full max-w-lg bg-background shadow-2xl flex flex-col overflow-hidden border-l border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-[15px] font-semibold tracking-tight">Add employer</h3>
              <Button variant="ghost" size="icon-sm" onClick={closeEmployerPanel} className="text-muted-foreground">×</Button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {employerError && (
                <Alert variant="destructive">
                  <AlertDescription>{employerError}</AlertDescription>
                </Alert>
              )}

              {createdCredentials ? (
                <div className="space-y-3">
                  <Alert>
                    <AlertDescription>
                      Account created. Share these credentials with the employer — the password won&apos;t be shown again.
                    </AlertDescription>
                  </Alert>
                  <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-1.5 text-sm">
                    <p><span className="text-muted-foreground">Email:</span> <span className="font-medium">{createdCredentials.email}</span></p>
                    <p><span className="text-muted-foreground">Temporary password:</span> <span className="font-mono font-medium">{createdCredentials.password}</span></p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="emp_full_name">Full name <span className="text-destructive">*</span></Label>
                    <Input
                      id="emp_full_name"
                      value={employerForm.full_name}
                      onChange={e => setEmployerForm(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="e.g. Sara Klein"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="emp_email">Email <span className="text-destructive">*</span></Label>
                    <Input
                      id="emp_email"
                      type="email"
                      value={employerForm.email}
                      onChange={e => setEmployerForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="employer@company.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="emp_company_name">Company name</Label>
                    <Input
                      id="emp_company_name"
                      value={employerForm.company_name}
                      onChange={e => setEmployerForm(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder="e.g. Acme Corp"
                    />
                    <p className="text-xs text-muted-foreground">Optional — shown throughout the app once set.</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A temporary password will be generated automatically. You&apos;ll see it once after creating the account so you can pass it along.
                  </p>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
              {createdCredentials ? (
                <Button onClick={closeEmployerPanel}>Done</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={closeEmployerPanel}>Cancel</Button>
                  <Button onClick={handleCreateEmployer} disabled={creatingEmployer}>{creatingEmployer ? 'Creating…' : 'Create account'}</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

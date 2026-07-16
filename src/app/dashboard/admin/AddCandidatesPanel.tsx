'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'

const CSV_COLUMNS = [
  'full_name', 'email', 'phone', 'whatsapp', 'location', 'current_job_title',
  'education_level', 'years_experience', 'fields_worked_in', 'tools_software',
  'languages', 'roles_seeking', 'employment_type', 'desired_salary', 'currency',
  'us_hours_comfortable', 'remote_experience', 'resume_url',
] as const

const CSV_TEMPLATE =
  CSV_COLUMNS.join(',') + '\n' +
  'Sara Klein,sara@example.com,555 123 4567,555 123 4567,Lakewood NJ,Bookkeeper,High School / GED,3-5 years,"Accounting & Finance;Administrative & Office Support",QuickBooks; Excel,"English, Yiddish",Bookkeeping,Part Time;Full Time,$25/hr,USD,yes,yes,\n'

// Minimal RFC-4180 CSV parser (quoted cells, escaped quotes, CRLF)
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++ } else inQuotes = false
      } else cell += ch
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(cell); cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some(c => c.trim() !== '')) rows.push(row)
      row = []
    } else {
      cell += ch
    }
  }
  row.push(cell)
  if (row.some(c => c.trim() !== '')) rows.push(row)
  return rows
}

type FormState = {
  full_name: string; email: string; phone: string; whatsapp: string; location: string
  current_job_title: string; education_level: string; years_experience: string
  fields_worked_in: string; tools_software: string; languages: string; roles_seeking: string
  employment_type: string[]; desired_salary: string; currency: string
  us_hours_comfortable: boolean; remote_experience: boolean; resume_url: string
}

const EMPTY: FormState = {
  full_name: '', email: '', phone: '', whatsapp: '', location: '',
  current_job_title: '', education_level: '', years_experience: '',
  fields_worked_in: '', tools_software: '', languages: '', roles_seeking: '',
  employment_type: [], desired_salary: '', currency: 'USD',
  us_hours_comfortable: false, remote_experience: false, resume_url: '',
}

type ImportResult = { created: number; updated: number; errors: string[] }

export default function AddCandidatesPanel({ onAdded }: { onAdded: () => void }) {
  const [mode, setMode] = useState<'closed' | 'manual' | 'import'>('closed')
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [csvRows, setCsvRows] = useState<Record<string, string>[] | null>(null)
  const [csvName, setCsvName] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function close() {
    setMode('closed'); setError(null); setResult(null); setProgress(null)
    setCsvRows(null); setCsvName(null)
  }

  async function postCandidates(candidates: Record<string, unknown>[]): Promise<ImportResult> {
    const res = await fetch('/api/admin/add-candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidates }),
    })
    if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`))
    return res.json()
  }

  async function handleManualSave() {
    if (!form.full_name.trim() || !form.email.trim()) { setError('Name and email are required.'); return }
    setSaving(true); setError(null)
    try {
      const r = await postCandidates([{
        ...form,
        fields_worked_in: form.fields_worked_in,
        employment_type: form.employment_type,
      }])
      if (r.errors.length > 0) { setError(r.errors[0]); return }
      onAdded()
      setForm(EMPTY)
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  function handleFile(file: File) {
    setError(null); setResult(null)
    const reader = new FileReader()
    reader.onload = () => {
      const rows = parseCsv(String(reader.result ?? ''))
      if (rows.length < 2) { setError('CSV needs a header row plus at least one candidate row.'); return }
      const headers = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
      if (!headers.includes('full_name') || !headers.includes('email')) {
        setError('CSV must have full_name and email columns. Download the template to see the expected format.')
        return
      }
      const parsed = rows.slice(1).map(r => {
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => { obj[h] = (r[i] ?? '').trim() })
        return obj
      })
      setCsvRows(parsed)
      setCsvName(file.name)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!csvRows?.length) return
    setSaving(true); setError(null)
    const total: ImportResult = { created: 0, updated: 0, errors: [] }
    try {
      // Chunks keep each serverless request fast (auth-user creation is ~1 req/candidate)
      const CHUNK = 20
      for (let i = 0; i < csvRows.length; i += CHUNK) {
        setProgress(`Importing ${Math.min(i + CHUNK, csvRows.length)} of ${csvRows.length}…`)
        const r = await postCandidates(csvRows.slice(i, i + CHUNK))
        total.created += r.created
        total.updated += r.updated
        total.errors.push(...r.errors)
      }
      setResult(total)
      onAdded()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
      if (total.created + total.updated > 0) setResult(total)
    } finally {
      setSaving(false)
      setProgress(null)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => { close(); setMode('import') }}>Import CSV</Button>
        <Button size="sm" onClick={() => { close(); setMode('manual') }}>+ Add candidate</Button>
      </div>

      {mode !== 'closed' && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={close} />
          <div className="w-full max-w-lg bg-background shadow-2xl flex flex-col overflow-hidden border-l border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-[15px] font-semibold tracking-tight">
                {mode === 'manual' ? 'Add candidate' : 'Import candidates from CSV'}
              </h3>
              <Button variant="ghost" size="icon-sm" onClick={close} className="text-muted-foreground">×</Button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {error && (
                <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
              )}

              {mode === 'manual' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Full name <span className="text-destructive">*</span></Label>
                      <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Sara Klein" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email <span className="text-destructive">*</span></Label>
                      <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="sara@example.com" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input value={form.phone} onChange={e => set('phone', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>WhatsApp</Label>
                      <Input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Location</Label>
                      <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="City, Country" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Current job title</Label>
                      <Input value={form.current_job_title} onChange={e => set('current_job_title', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Education level</Label>
                      <Input value={form.education_level} onChange={e => set('education_level', e.target.value)} placeholder="e.g. High School / GED" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Years experience</Label>
                      <Input value={form.years_experience} onChange={e => set('years_experience', e.target.value)} placeholder="e.g. 3-5 years" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Industries <span className="text-xs font-normal text-muted-foreground">— separate with ;</span></Label>
                    <Input value={form.fields_worked_in} onChange={e => set('fields_worked_in', e.target.value)} placeholder="Accounting & Finance; Customer Service" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tools &amp; software</Label>
                    <Input value={form.tools_software} onChange={e => set('tools_software', e.target.value)} placeholder="QuickBooks, Excel" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Languages</Label>
                      <Input value={form.languages} onChange={e => set('languages', e.target.value)} placeholder="English, Yiddish" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Roles seeking</Label>
                      <Input value={form.roles_seeking} onChange={e => set('roles_seeking', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Employment type</Label>
                    <div className="flex gap-4">
                      {['Full Time', 'Part Time', 'Contract'].map(t => (
                        <label key={t} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={form.employment_type.includes(t)}
                            onCheckedChange={checked => set('employment_type',
                              checked ? [...form.employment_type, t] : form.employment_type.filter(x => x !== t))}
                          />
                          {t}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Desired salary</Label>
                      <Input value={form.desired_salary} onChange={e => set('desired_salary', e.target.value)} placeholder="e.g. $25/hr" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Currency</Label>
                      <Input value={form.currency} onChange={e => set('currency', e.target.value)} placeholder="USD" />
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={form.us_hours_comfortable} onCheckedChange={c => set('us_hours_comfortable', !!c)} />
                      Comfortable with U.S. hours
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={form.remote_experience} onCheckedChange={c => set('remote_experience', !!c)} />
                      Remote experience
                    </label>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Resume URL</Label>
                    <Input value={form.resume_url} onChange={e => set('resume_url', e.target.value)} placeholder="https://…" />
                    <p className="text-xs text-muted-foreground">Optional — link to an existing hosted resume.</p>
                  </div>
                </>
              ) : result ? (
                <div className="space-y-3">
                  <Alert>
                    <AlertDescription>
                      Import finished: {result.created} created, {result.updated} updated
                      {result.errors.length > 0 ? `, ${result.errors.length} failed` : ''}.
                    </AlertDescription>
                  </Alert>
                  {result.errors.length > 0 && (
                    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-1 max-h-64 overflow-y-auto">
                      {result.errors.map((e, i) => (
                        <p key={i} className="text-xs text-destructive">{e}</p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV with a header row. <span className="font-medium text-foreground">full_name</span> and{' '}
                    <span className="font-medium text-foreground">email</span> are required; other columns are optional.
                    Use <code className="text-xs">;</code> to separate multiple industries or employment types in one cell.
                  </p>
                  <a
                    href={`data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`}
                    download="candidates-template.csv"
                    className="inline-block text-sm text-primary underline underline-offset-4 font-medium"
                  >
                    Download template CSV
                  </a>
                  <div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                    />
                    <Button variant="outline" onClick={() => fileRef.current?.click()}>Choose CSV file…</Button>
                  </div>
                  {csvRows && (
                    <Alert>
                      <AlertDescription>
                        {csvName}: {csvRows.length} candidate{csvRows.length !== 1 ? 's' : ''} ready to import.
                      </AlertDescription>
                    </Alert>
                  )}
                  {progress && <p className="text-sm text-muted-foreground">{progress}</p>}
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
              {mode === 'manual' ? (
                <>
                  <Button variant="outline" onClick={close}>Cancel</Button>
                  <Button onClick={handleManualSave} disabled={saving}>{saving ? 'Adding…' : 'Add candidate'}</Button>
                </>
              ) : result ? (
                <Button onClick={close}>Done</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={close}>Cancel</Button>
                  <Button onClick={handleImport} disabled={saving || !csvRows?.length}>
                    {saving ? 'Importing…' : `Import${csvRows ? ` ${csvRows.length}` : ''}`}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CandidateProfile } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const EDUCATION_OPTIONS = [
  'High School / GED', 'Some College', "Associate's Degree", "Bachelor's Degree",
  "Master's Degree", 'Doctorate / PhD', 'Professional Degree (JD, MD, etc.)', 'Other',
]

const EXPERIENCE_OPTIONS = ['Less than 1 year', '1–2 years', '3–5 years', '6–10 years', '10+ years']

const FIELDS_WORKED_IN = [
  'Accounting & Finance', 'Administrative & Office Support', 'Arts & Creative',
  'Construction & Engineering', 'Customer Service', 'Data & Analytics',
  'Education & Training', 'Engineering', 'Healthcare & Medical',
  'Hospitality & Travel', 'Human Resources', 'Information Technology',
  'Insurance', 'Legal & Compliance', 'Logistics & Supply Chain',
  'Manufacturing & Operations', 'Marketing & Advertising', 'Media & Communications',
  'Nonprofit & Social Services', 'Real Estate', 'Retail & E-commerce',
  'Sales & Business Development', 'Technology & Software', 'Other',
]

const EMPLOYMENT_TYPES = ['Full Time', 'Part Time']

type FormState = {
  full_name: string; email: string; phone: string; whatsapp: string; location: string
  current_job_title: string; education_level: string; years_experience: string
  fields_worked_in: string[]; tools_software: string; languages: string
  roles_seeking: string; employment_type: string[]; desired_salary: string
  currency: string; us_hours_comfortable: string; remote_experience: string
}

const EMPTY: FormState = {
  full_name: '', email: '', phone: '', whatsapp: '', location: '', current_job_title: '',
  education_level: '', years_experience: '', fields_worked_in: [], tools_software: '',
  languages: '', roles_seeking: '', employment_type: [], desired_salary: '', currency: '',
  us_hours_comfortable: '', remote_experience: '',
}

function boolToRadio(v: boolean | null | undefined): string {
  if (v === true) return 'yes'
  if (v === false) return 'no'
  return ''
}

export default function CandidateProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [existingResumeUrl, setExistingResumeUrl] = useState<string | null>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const metaName = user.user_metadata?.full_name ?? ''
      const metaEmail = user.email ?? ''
      const { data } = await supabase.from('candidate_profiles').select('*').eq('id', user.id).single<CandidateProfile>()
      if (data) {
        setForm({
          full_name: data.full_name ?? metaName, email: data.email ?? metaEmail,
          phone: data.phone ?? '', whatsapp: data.whatsapp ?? '', location: data.location ?? '',
          current_job_title: data.current_job_title ?? '', education_level: data.education_level ?? '',
          years_experience: data.years_experience ?? '', fields_worked_in: data.fields_worked_in ?? [],
          tools_software: data.tools_software ?? '', languages: data.languages ?? '',
          roles_seeking: data.roles_seeking ?? '', employment_type: data.employment_type ?? [],
          desired_salary: data.desired_salary ?? '', currency: data.currency ?? '',
          us_hours_comfortable: boolToRadio(data.us_hours_comfortable),
          remote_experience: boolToRadio(data.remote_experience),
        })
        setExistingResumeUrl(data.resume_url ?? null)
      } else {
        setForm(f => ({ ...f, full_name: metaName, email: metaEmail }))
      }
      setLoading(false)
    }
    load()
  }, [router])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleArray(key: 'fields_worked_in' | 'employment_type', value: string) {
    setForm(prev => {
      const arr = prev[key]
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let resume_url = existingResumeUrl
    if (resumeFile) {
      const arrayBuffer = await resumeFile.arrayBuffer()
      const storagePath = `${user.id}/${resumeFile.name}`
      const { error: uploadError } = await supabase.storage.from('resumes')
        .upload(storagePath, arrayBuffer, { contentType: resumeFile.type || 'application/octet-stream', upsert: true })
      if (uploadError) { setError('Resume upload failed: ' + uploadError.message); setSaving(false); return }
      const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(storagePath)
      resume_url = urlData.publicUrl
    }

    const { error: upsertError } = await supabase.from('candidate_profiles').upsert({
      id: user.id,
      full_name: form.full_name || null, email: form.email || null, phone: form.phone || null,
      whatsapp: form.whatsapp || null, location: form.location || null,
      current_job_title: form.current_job_title || null, education_level: form.education_level || null,
      years_experience: form.years_experience || null, fields_worked_in: form.fields_worked_in,
      tools_software: form.tools_software || null, languages: form.languages || null,
      roles_seeking: form.roles_seeking || null, employment_type: form.employment_type,
      desired_salary: form.desired_salary || null, currency: form.currency || null,
      us_hours_comfortable: form.us_hours_comfortable === 'yes' ? true : form.us_hours_comfortable === 'no' ? false : null,
      remote_experience: form.remote_experience === 'yes' ? true : form.remote_experience === 'no' ? false : null,
      resume_url, updated_at: new Date().toISOString(),
    })

    if (upsertError) {
      setError(upsertError.message)
      setSaving(false)
    } else {
      router.push('/dashboard/candidate')
    }
  }

  if (loading) {
    return <div className="state-center"><p className="state-text">Loading...</p></div>
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Your profile</h2>
        <p className="text-sm text-muted-foreground mt-1">Add your details so we can match you with the right opportunities.</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}


      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Personal info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full Name <span className="text-destructive">*</span></Label>
              <Input id="full_name" required value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Your full name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input id="email" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
                <Input id="phone" type="tel" required value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 555 000 0000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="whatsapp">WhatsApp <span className="text-destructive">*</span></Label>
                <Input id="whatsapp" type="tel" required value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="+1 555 000 0000" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location <span className="text-destructive">*</span></Label>
              <Input id="location" required value={form.location} onChange={e => set('location', e.target.value)} placeholder="City, Country" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="current_job_title">Current Job Title <span className="text-destructive">*</span></Label>
              <Input id="current_job_title" required value={form.current_job_title} onChange={e => set('current_job_title', e.target.value)} placeholder="e.g. Staff Accountant" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Background</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Education <span className="text-destructive">*</span></Label>
                <Select value={form.education_level} onValueChange={v => set('education_level', v)}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{EDUCATION_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Years of Experience <span className="text-destructive">*</span></Label>
                <Select value={form.years_experience} onValueChange={v => set('years_experience', v)}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{EXPERIENCE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tools_software">Tools / Software <span className="text-destructive">*</span></Label>
              <Input id="tools_software" required value={form.tools_software} onChange={e => set('tools_software', e.target.value)} placeholder="e.g. QuickBooks, Excel, Salesforce" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="languages">Languages <span className="text-destructive">*</span></Label>
              <Input id="languages" required value={form.languages} onChange={e => set('languages', e.target.value)} placeholder="e.g. English, Hebrew, Yiddish" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="roles_seeking">Roles Seeking <span className="text-destructive">*</span></Label>
              <Input id="roles_seeking" required value={form.roles_seeking} onChange={e => set('roles_seeking', e.target.value)} placeholder="e.g. Bookkeeper, Sales Rep" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Work preferences</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Fields You&apos;ve Worked In <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-2 gap-2">
                {FIELDS_WORKED_IN.map(field => (
                  <div key={field} className="flex items-center gap-2">
                    <Checkbox
                      id={`field-${field}`}
                      checked={form.fields_worked_in.includes(field)}
                      onCheckedChange={() => toggleArray('fields_worked_in', field)}
                    />
                    <Label htmlFor={`field-${field}`} className="font-normal cursor-pointer">{field}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Employment Type <span className="text-destructive">*</span></Label>
              <div className="flex gap-6">
                {EMPLOYMENT_TYPES.map(type => (
                  <div key={type} className="flex items-center gap-2">
                    <Checkbox
                      id={`emp-${type}`}
                      checked={form.employment_type.includes(type)}
                      onCheckedChange={() => toggleArray('employment_type', type)}
                    />
                    <Label htmlFor={`emp-${type}`} className="font-normal cursor-pointer">{type}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="desired_salary">Desired Salary / Rate <span className="text-destructive">*</span></Label>
                <Input id="desired_salary" required value={form.desired_salary} onChange={e => set('desired_salary', e.target.value)} placeholder="e.g. 65,000 or 25" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currency">Currency <span className="text-destructive">*</span></Label>
                <Input id="currency" required value={form.currency} onChange={e => set('currency', e.target.value)} placeholder="e.g. USD, ILS" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Comfortable with U.S. working hours? <span className="text-destructive">*</span></Label>
              <RadioGroup value={form.us_hours_comfortable} onValueChange={v => set('us_hours_comfortable', v)} className="flex gap-6">
                {['yes', 'no'].map(val => (
                  <div key={val} className="flex items-center gap-2">
                    <RadioGroupItem value={val} id={`us-hours-${val}`} />
                    <Label htmlFor={`us-hours-${val}`} className="font-normal cursor-pointer capitalize">{val === 'yes' ? 'Yes' : 'No'}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Remote work experience? <span className="text-destructive">*</span></Label>
              <RadioGroup value={form.remote_experience} onValueChange={v => set('remote_experience', v)} className="flex gap-6">
                {['yes', 'no'].map(val => (
                  <div key={val} className="flex items-center gap-2">
                    <RadioGroupItem value={val} id={`remote-${val}`} />
                    <Label htmlFor={`remote-${val}`} className="font-normal cursor-pointer">{val === 'yes' ? 'Yes' : 'No'}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Resume</CardTitle></CardHeader>
          <CardContent>
            {existingResumeUrl && !resumeFile && (
              <p className="text-sm text-muted-foreground mb-3">
                Resume on file.{' '}
                <a href={existingResumeUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">View</a>
                {' — '}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-primary underline underline-offset-4">Replace</button>
                {' — '}
                <button type="button" onClick={() => setExistingResumeUrl(null)} className="text-destructive underline underline-offset-4">Remove</button>
              </p>
            )}
            {resumeFile && (
              <p className="text-sm text-muted-foreground mb-3">
                Selected: <span className="font-medium text-foreground">{resumeFile.name}</span>{' '}
                <button type="button" onClick={() => setResumeFile(null)} className="text-destructive underline underline-offset-4">Remove</button>
              </p>
            )}
            {!existingResumeUrl && !resumeFile && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg px-6 py-8 text-center cursor-pointer hover:border-ring transition-colors"
              >
                <p className="text-sm font-medium">Click to upload your resume</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOC, or DOCX — max 5MB</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setResumeFile(e.target.files?.[0] ?? null)} />
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save profile'}
        </Button>
      </form>
    </main>
  )
}

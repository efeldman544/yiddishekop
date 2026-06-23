'use client'

import { useState } from 'react'
import Link from 'next/link'
import LpAuthButton from '@/components/LpAuthButton'

type FormState = {
  contact_name: string
  email: string
  phone: string
  company_name: string
  role_title: string
  employment_type: string
  hours: string
  salary: string
  description: string
}

const EMPTY: FormState = {
  contact_name: '', email: '', phone: '', company_name: '',
  role_title: '', employment_type: '', hours: '', salary: '', description: '',
}

export default function StartHiringForm() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function set(key: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/start-hiring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        setError(text || `Something went wrong (${res.status}). Please try again.`)
        return
      }
      setSubmitted(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="lp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '48px 24px' }}>
        <div style={{ maxWidth: 520, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--lp-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', fontSize: 28 }}>✓</div>
          <h1 style={{ fontFamily: 'var(--font-fraunces), Fraunces, serif', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--lp-cream)', marginBottom: 16 }}>
            We&apos;ve got your role.
          </h1>
          <p style={{ fontSize: 17, color: 'var(--lp-cream-dim)', lineHeight: 1.65, marginBottom: 36 }}>
            Thanks, {form.contact_name.split(' ')[0]}. We&apos;ll review your requirements and be in touch shortly with next steps.
          </p>
          <p style={{ fontSize: 14.5, color: 'var(--lp-cream-dim)' }}>
            Questions? Call us at <a href="tel:6314943567" style={{ color: 'var(--lp-gold-soft)', fontWeight: 600 }}>631 494 3567</a>
          </p>
          <div style={{ marginTop: 40 }}>
            <Link href="/" style={{ color: 'var(--lp-cream-dim)', fontSize: 14 }}>← Back to home</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="lp">
      <header>
        <div className="wrap lp-nav">
          <Link href="/" className="lp-logo">Yiddishe<span>Kop</span></Link>
          <div className="lp-nav-right">
            <LpAuthButton style={{ fontSize: 14 }} />
          </div>
        </div>
      </header>

      <section style={{ padding: '80px 0 100px' }}>
        <div className="wrap" style={{ maxWidth: 680 }}>
          <div style={{ marginBottom: 48 }}>
            <div className="lp-sec-eyebrow">Start hiring</div>
            <h1 style={{ fontFamily: 'var(--font-fraunces), Fraunces, serif', fontWeight: 600, fontSize: 'clamp(32px,4vw,48px)', letterSpacing: '-0.02em', lineHeight: 1.05, color: 'var(--lp-cream)', marginTop: 16, marginBottom: 16 }}>
              Tell us your open role.
            </h1>
            <p style={{ fontSize: 17, color: 'var(--lp-cream-dim)', lineHeight: 1.6 }}>
              Fill out the form below. We&apos;ll match you with pre-screened, video-interviewed candidates worth your time.
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, padding: '12px 16px', fontSize: 14, color: '#fca5a5', marginBottom: 24 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div>
                <label className="auth-label">Your name <span style={{ color: 'var(--lp-gold)' }}>*</span></label>
                <input type="text" required value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Sara Klein" className="auth-input" />
              </div>
              <div>
                <label className="auth-label">Company name</label>
                <input type="text" value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="Acme Corp" className="auth-input" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div>
                <label className="auth-label">Email <span style={{ color: 'var(--lp-gold)' }}>*</span></label>
                <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" className="auth-input" />
              </div>
              <div>
                <label className="auth-label">Phone</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="631 494 3567" className="auth-input" />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--lp-line)', paddingTop: 22 }}>
              <label className="auth-label">Role title <span style={{ color: 'var(--lp-gold)' }}>*</span></label>
              <input type="text" required value={form.role_title} onChange={e => set('role_title', e.target.value)} placeholder="e.g. Bookkeeper, Admin Assistant, Sales Rep…" className="auth-input" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
              <div>
                <label className="auth-label">Employment type</label>
                <select value={form.employment_type} onChange={e => set('employment_type', e.target.value)} className="auth-select">
                  <option value="">Select…</option>
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
              <div>
                <label className="auth-label">Hours / week</label>
                <input type="text" value={form.hours} onChange={e => set('hours', e.target.value)} placeholder="e.g. 40" className="auth-input" />
              </div>
              <div>
                <label className="auth-label">Salary budget</label>
                <input type="text" value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="e.g. $18–22/hr" className="auth-input" />
              </div>
            </div>

            <div>
              <label className="auth-label">Role description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={5} placeholder="Describe the day-to-day responsibilities, required skills, and what a great fit looks like for your business…" className="auth-input" style={{ resize: 'vertical', lineHeight: 1.6 }} />
            </div>

            <button type="submit" disabled={loading} className="lp-btn lp-btn-gold" style={{ width: '100%', textAlign: 'center', padding: '16px', fontSize: 16, marginTop: 4 }}>
              {loading ? 'Submitting…' : 'Submit role →'}
            </button>

            <p style={{ fontSize: 13.5, color: 'var(--lp-cream-dim)', textAlign: 'center', lineHeight: 1.6 }}>
              We&apos;ll review your submission and be in touch shortly.
              Prefer to call? <a href="tel:6314943567" style={{ color: 'var(--lp-gold-soft)', fontWeight: 600 }}>631 494 3567</a>
            </p>
          </form>
        </div>
      </section>
    </div>
  )
}

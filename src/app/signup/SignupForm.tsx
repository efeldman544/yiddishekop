'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/types'

type Props = {
  defaultEmail?: string
  defaultName?: string
  defaultRole?: Role | ''
}

export default function SignupForm({ defaultEmail = '', defaultName = '', defaultRole = '' }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<Role | ''>(defaultRole)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!role) { setError('Please select a role.'); return }

    setLoading(true)
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const full_name = (form.elements.namedItem('full_name') as HTMLInputElement).value

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, role } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: upsertError } = await supabase.from('profiles').upsert({ id: data.user.id, email, full_name, role })
      if (upsertError) console.error('Profile upsert failed:', upsertError.message)

      // Link any hire requests this person already submitted (matched by email)
      // so their requested role shows up in their dashboard, not as a duplicate.
      if (role === 'employer') {
        await fetch('/api/auth/link-jobs', { method: 'POST' }).catch(() => {})
      }
    }

    router.push(`/dashboard/${role}`)
    router.refresh()
  }

  return (
    <div className="auth-dark">
      {/* Left panel */}
      <div className="auth-panel">
        <div>
          <Link href="/" className="auth-logo">Yiddishe<span>Kop</span></Link>
          <p className="auth-tagline">Connecting great talent with the businesses that need them.</p>
        </div>
        <p className="auth-copy">© 2026 YiddisheKop</p>
      </div>

      {/* Main */}
      <div className="auth-main">
        <div className="auth-box">
          <h1 className="auth-heading">Create an account</h1>
          <p className="auth-sub">Join YiddisheKop today</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="full_name" className="auth-label">Full name</label>
              <input id="full_name" name="full_name" type="text" required placeholder="Your full name" defaultValue={defaultName} className="auth-input" />
            </div>
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" defaultValue={defaultEmail} className="auth-input" />
            </div>
            <div className="auth-field">
              <label htmlFor="password" className="auth-label">Password</label>
              <input id="password" name="password" type="password" required minLength={8} placeholder="••••••••" className="auth-input" />
            </div>
            <div className="auth-field">
              <label htmlFor="role" className="auth-label">I am…</label>
              <select id="role" value={role} onChange={e => setRole(e.target.value as Role)} className="auth-select">
                <option value="">Select one</option>
                <option value="candidate">I&apos;m looking for work</option>
                <option value="employer">I&apos;m hiring</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{' '}
            <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

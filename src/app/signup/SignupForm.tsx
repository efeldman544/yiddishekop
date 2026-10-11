'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { safeNextPath } from '@/lib/nextPath'
import { nameProblem } from '@/lib/nameCheck'
import type { Role } from '@/types'
import AuthShell from '@/components/AuthShell'

type Props = {
  defaultEmail?: string
  defaultName?: string
  defaultRole?: Role | ''
  /** Where to land after signing up — set when someone was sent here mid-task. */
  next?: string
}

export default function SignupForm({ defaultEmail = '', defaultName = '', defaultRole = '', next = '' }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<Role | ''>(defaultRole)
  // Set when the account was created but isn't signed in yet, which is what
  // Supabase returns once email confirmation is switched on.
  const [confirmSent, setConfirmSent] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!role) { setError('Please select a role.'); return }

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const full_name = (form.elements.namedItem('full_name') as HTMLInputElement).value.trim()

    // The database refuses these too. Checking here is what turns a raw
    // constraint violation into a sentence the person can act on.
    const badName = nameProblem(full_name)
    if (badName) { setError(badName); return }

    setLoading(true)
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

    // With email confirmation on, Supabase returns the user but no session:
    // the account exists and nobody is signed in. Everything below needs a
    // session — the profile write, the job linking, the notification — and
    // pushing them to a dashboard would land them on a logged-out page. The
    // database trigger has already written their profile and told the admins,
    // so there is nothing left to do but tell them to go and confirm.
    if (data.user && !data.session) {
      setConfirmSent(email)
      setLoading(false)
      return
    }

    if (data.user) {
      // A trigger on auth.users writes this row too, which is what makes the
      // confirmation path above work. Doing it here as well costs nothing and
      // keeps the row correct if the trigger hasn't been installed yet.
      const { error: upsertError } = await supabase.from('profiles').upsert({ id: data.user.id, email, full_name, role })
      if (upsertError) console.error('Profile upsert failed:', upsertError.message)

      // Link any hire requests this person already submitted (matched by email)
      // so their requested role shows up in their dashboard, not as a duplicate.
      if (role === 'employer') {
        await fetch('/api/auth/link-jobs', { method: 'POST' }).catch(() => {})
      }

      // Signing up happens entirely in the browser, so nothing on the server
      // saw it and no admin was told. Failing to notify must not block the
      // account that was just created.
      await fetch('/api/notifications/new-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'signup' }),
      }).catch(() => {})
    }

    // Someone who came here from a candidate they wanted goes back to that
    // candidate, not to an empty dashboard — otherwise signing up loses the
    // thing they were actually trying to do.
    router.push(safeNextPath(next, `/dashboard/${role}`))
    router.refresh()
  }

  if (confirmSent) {
    return (
      <AuthShell>
        <h1 className="auth-heading">Check your email</h1>
        <p className="auth-sub">
          Your account is created. We&apos;ve sent a link to <strong>{confirmSent}</strong> —
          open it and you&apos;re in.
        </p>
        <p className="auth-footer">
          Nothing arrived? Look in your spam folder, or{' '}
          <Link href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}>try signing in</Link>.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
          <h1 className="auth-heading">Create an account</h1>
          {/* The role is already known here — either from ?role= or the moment
              they pick one — so the line can say what they actually get
              instead of restating the heading. */}
          <p className="auth-sub">
            {role === 'employer'
              ? 'Free. See resumes, watch interviews, and ask to meet anyone you like.'
              : role === 'candidate'
                ? 'Free. One interview with us, and we put you in front of businesses that are hiring.'
                : 'Free, and takes about a minute.'}
          </p>

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
            <Link href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}>Sign in</Link>
          </p>
    </AuthShell>
  )
}

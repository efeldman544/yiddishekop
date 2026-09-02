'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/types'
import AuthShell from '@/components/AuthShell'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [linkValid, setLinkValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Following the emailed link signs the user in with a short-lived recovery
  // session. If it isn't there the link was already used, or has expired —
  // better to say so than to show a form that can only fail on submit.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setLinkValid(!!data.session)
      setReady(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const confirm = (form.elements.namedItem('confirm') as HTMLInputElement).value
    if (password !== confirm) { setError('Those two passwords don’t match.'); return }
    if (password.length < 8) { setError('Use at least 8 characters.'); return }

    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = user
      ? await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: Role }>()
      : { data: null }
    router.push(`/dashboard/${profile?.role ?? 'employer'}`)
    router.refresh()
  }

  return (
    <AuthShell>
          <h1 className="auth-heading">Choose a new password</h1>

          {!ready ? (
            <p className="auth-sub">Checking your link…</p>
          ) : !linkValid ? (
            <>
              <p className="auth-sub">
                This reset link has expired or has already been used.
              </p>
              <p className="auth-footer" style={{ marginTop: 20 }}>
                <Link href="/forgot-password">Send a new one</Link>
              </p>
            </>
          ) : (
            <>
              {error && <div className="auth-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="auth-field">
                  <label htmlFor="password" className="auth-label">New password</label>
                  <input
                    id="password" name="password" type="password" required
                    minLength={8} autoComplete="new-password" className="auth-input"
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="confirm" className="auth-label">Confirm password</label>
                  <input
                    id="confirm" name="confirm" type="password" required
                    minLength={8} autoComplete="new-password" className="auth-input"
                  />
                </div>
                <button type="submit" disabled={loading} className="auth-btn">
                  {loading ? 'Saving…' : 'Save password'}
                </button>
              </form>
            </>
          )}
    </AuthShell>
  )
}

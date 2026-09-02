'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AuthShell from '@/components/AuthShell'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    // Deliberately the same answer either way: telling someone whether an
    // address has an account here is a way to find out who we work with.
    if (err) console.error('password reset failed:', err.message)
    setSent(true)
    setLoading(false)
  }

  return (
    <AuthShell>
          <h1 className="auth-heading">Reset your password</h1>

          {sent ? (
            <>
              <p className="auth-sub">
                If there&apos;s an account for that address, a reset link is on its way. It expires
                in an hour.
              </p>
              <p className="auth-footer" style={{ marginTop: 20 }}>
                <Link href="/login">← Back to sign in</Link>
              </p>
            </>
          ) : (
            <>
              <p className="auth-sub">We&apos;ll email you a link to set a new one.</p>
              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="auth-field">
                  <label htmlFor="email" className="auth-label">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="auth-input"
                  />
                </div>
                <button type="submit" disabled={loading} className="auth-btn">
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <p className="auth-footer">
                Remembered it? <Link href="/login">Sign in</Link>
              </p>
            </>
          )}
    </AuthShell>
  )
}

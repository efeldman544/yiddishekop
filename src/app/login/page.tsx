'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/types'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single<{ role: Role }>()

    const role: Role = profile?.role ?? (data.user.user_metadata?.role as Role) ?? 'candidate'
    router.push(`/dashboard/${role}`)
    router.refresh()
  }

  return (
    <div className="auth-dark">
      {/* Left panel */}
      <div className="auth-panel">
        <div>
          <div className="auth-logo">Yiddishe<span>Kop</span></div>
          <p className="auth-tagline">Connecting great talent with the businesses that need them.</p>
        </div>
        <p className="auth-copy">© 2026 YiddisheKop</p>
      </div>

      {/* Main */}
      <div className="auth-main">
        <div className="auth-box">
          <div className="auth-logo-mobile md:hidden">Yiddishe<span>Kop</span></div>

          <h1 className="auth-heading">Welcome back</h1>
          <p className="auth-sub">Sign in to your account</p>

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
                placeholder="you@example.com"
                className="auth-input"
              />
            </div>
            <div className="auth-field">
              <label htmlFor="password" className="auth-label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="auth-input"
              />
            </div>
            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="auth-footer">
            Don&apos;t have an account?{' '}
            <Link href="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden md:flex w-80 bg-gray-950 flex-col justify-between px-10 py-12 shrink-0">
        <div>
          <span className="text-white font-bold text-xl tracking-tight">YiddisheKop</span>
          <p className="text-gray-400 text-sm mt-8 leading-relaxed">
            Connecting top talent with growing businesses across the Yiddish-speaking community.
          </p>
        </div>
        <p className="text-gray-600 text-xs">© 2025 YiddisheKop</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-8">
            <span className="font-bold text-xl tracking-tight text-gray-950">YiddisheKop</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-950 tracking-tight">Welcome back</h1>
            <p className="text-gray-400 text-sm mt-1.5">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-10"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-10 mt-2">
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="text-sm text-center text-gray-400 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-gray-950 hover:text-indigo-600 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

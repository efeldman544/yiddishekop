'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<Role | ''>('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!role) {
      setError('Please select a role.')
      return
    }

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
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name,
        role,
      })
      if (upsertError) console.error('Profile upsert failed:', upsertError.message)
    }

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
            <h1 className="text-2xl font-bold text-gray-950 tracking-tight">Create an account</h1>
            <p className="text-gray-400 text-sm mt-1.5">Join YiddisheKop today</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">Full name</Label>
              <Input id="full_name" name="full_name" type="text" required placeholder="Your full name" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <Input id="password" name="password" type="password" required minLength={8} placeholder="••••••••" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">I am a...</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="candidate">Candidate — looking for work</SelectItem>
                  <SelectItem value="employer">Employer — hiring talent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-10 mt-2">
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="text-sm text-center text-gray-400 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-gray-950 hover:text-indigo-600 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

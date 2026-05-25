import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Role } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: Role }>()

  // Fall back to role in auth metadata if profile row isn't ready yet
  const role: Role =
    profile?.role ?? (user.user_metadata?.role as Role) ?? 'candidate'

  redirect(`/dashboard/${role}`)
}

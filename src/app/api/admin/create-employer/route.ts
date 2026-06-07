import { createClient } from '@/lib/supabase/server'
import { createClient as adminSupabase } from '@supabase/supabase-js'

function adminClient() {
  return adminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let pw = ''
  for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)]
  return pw
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: string }>()
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const { email, full_name, company_name } = await req.json()
  if (!email || !full_name) {
    return new Response('Missing email or full name', { status: 400 })
  }

  const db = adminClient()
  const password = generatePassword()

  const { data: userData, error: authError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: 'employer' },
  })
  if (authError || !userData.user) {
    return new Response(authError?.message ?? 'Failed to create account', { status: 400 })
  }

  const { error: profileError } = await db.from('profiles').upsert({
    id: userData.user.id,
    email,
    full_name,
    role: 'employer',
  })
  if (profileError) {
    return new Response(profileError.message, { status: 400 })
  }

  if (company_name) {
    await db.from('employer_profiles').upsert({ id: userData.user.id, company_name })
  }

  return Response.json({
    id: userData.user.id,
    email,
    full_name,
    company_name: company_name || null,
    password,
  })
}

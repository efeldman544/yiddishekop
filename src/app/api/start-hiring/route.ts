import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return new Response('Invalid JSON', { status: 400 })

  const { contact_name, email, phone, company_name, role_title, employment_type, hours, salary, description } = body

  if (!contact_name?.trim() || !email?.trim() || !role_title?.trim()) {
    return new Response('Missing required fields', { status: 400 })
  }

  const db = adminClient()
  const { error } = await db.from('job_leads').insert({
    contact_name: contact_name.trim(),
    email: email.trim(),
    phone: phone?.trim() || null,
    company_name: company_name?.trim() || null,
    role_title: role_title.trim(),
    employment_type: employment_type || null,
    hours: hours?.trim() || null,
    salary: salary?.trim() || null,
    description: description?.trim() || null,
  })

  if (error) {
    console.error('job_leads insert error:', error.message)
    return new Response(error.message, { status: 500 })
  }

  const { data: admins } = await db.from('profiles').select('id').eq('role', 'admin')
  if (admins?.length) {
    await db.from('notifications').insert(
      admins.map((a: { id: string }) => ({
        user_id: a.id,
        type: 'new_lead',
        message: `New hiring inquiry: ${contact_name}${company_name ? ` (${company_name})` : ''} — ${role_title}`,
        candidate_id: null,
        read: false,
      }))
    )
  }

  return Response.json({ ok: true })
}

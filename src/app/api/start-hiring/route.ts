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

  // If an employer account already exists for this email, link the new job to
  // it straight away so the request and the account never become two records.
  const emailNorm = email.trim().toLowerCase()
  const { data: existing } = await db
    .from('profiles')
    .select('id')
    .eq('role', 'employer')
    .ilike('email', emailNorm)
    .maybeSingle()
  const employerId = existing?.id ?? null

  // A hire request is a job_requirements row with status 'New' and source
  // 'request'. The requester's contact details live on the row until they have
  // an account (employer_id is then filled in by the link-jobs step).
  const { error } = await db.from('job_requirements').insert({
    employer_id: employerId,
    job_title: role_title.trim(),
    company_name: company_name?.trim() || null,
    contact_name: contact_name.trim(),
    contact_email: email.trim(),
    contact_phone: phone?.trim() || null,
    employment_type: employment_type || null,
    hours: hours?.trim() || null,
    salary: salary?.trim() || null,
    description: description?.trim() || null,
    status: 'New',
    source: 'request',
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error('job request insert error:', error.message)
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

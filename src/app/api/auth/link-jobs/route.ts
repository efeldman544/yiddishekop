import { createClient } from '@/lib/supabase/server'
import { createClient as adminSupabase } from '@supabase/supabase-js'

function adminClient() {
  return adminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Links any unclaimed hire-request jobs (created via /start-hiring) to the
// currently signed-in employer, matched by email. Called right after signup so
// a person who requested hiring and then made an account doesn't end up with a
// duplicate, disconnected record.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return new Response('Unauthorized', { status: 401 })

  const db = adminClient()

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()
  if (profile?.role !== 'employer') {
    return Response.json({ linked: 0 })
  }

  // Find unclaimed request-jobs for this email
  const { data: jobs } = await db
    .from('job_requirements')
    .select('id, company_name')
    .is('employer_id', null)
    .eq('source', 'request')
    .ilike('contact_email', user.email)

  if (!jobs?.length) return Response.json({ linked: 0 })

  const jobIds = jobs.map((j: { id: string; company_name: string | null }) => j.id)
  const { error } = await db
    .from('job_requirements')
    .update({ employer_id: user.id, updated_at: new Date().toISOString() })
    .in('id', jobIds)
  if (error) {
    console.error('link-jobs update error:', error.message)
    return new Response(error.message, { status: 500 })
  }

  // Seed the employer profile's company name from their request if not set
  const company = jobs.find((j: { id: string; company_name: string | null }) => j.company_name)?.company_name
  if (company) {
    const { data: ep } = await db
      .from('employer_profiles')
      .select('company_name')
      .eq('id', user.id)
      .maybeSingle<{ company_name: string | null }>()
    if (!ep?.company_name) {
      await db.from('employer_profiles').upsert({ id: user.id, company_name: company })
    }
  }

  return Response.json({ linked: jobIds.length })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serveResume } from '@/lib/resumeServe'

export const maxDuration = 60

// A candidate's resume, redacted for whoever is asking. The work is in
// src/lib/resumeServe.ts.
export async function GET(
  request: NextRequest,
  // `filename` is a decorative trailing segment so browsers name the saved
  // file after the candidate (see src/lib/resumeUrl.ts); it is never read.
  { params }: { params: Promise<{ candidateId: string; filename?: string[] }> }
) {
  const { candidateId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  // Employers see redacted resumes without needing an assignment first —
  // that's the point of browsing. serveResume guarantees the redaction, and
  // refuses rather than serving anything it can't verify.
  const isAdmin = profile?.role === 'admin'
  const isEmployer = profile?.role === 'employer'
  if (!isAdmin && !isEmployer) return new NextResponse('Forbidden', { status: 403 })

  // ?as=employer lets an admin see exactly what an employer is handed,
  // refusals included. Only an admin can ask for it, and it can only ever
  // show less than an admin would otherwise see.
  const asEmployer = isAdmin && request.nextUrl.searchParams.get('as') === 'employer'
  return serveResume(supabase, candidateId, isAdmin && !asEmployer ? 'admin' : 'employer')
}

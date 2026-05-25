'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Employer = {
  id: string
  full_name: string | null
  email: string | null
  created_at: string
}

type Assignment = {
  candidate_id: string
  action: string | null
  candidate_profiles: {
    full_name: string | null
    current_job_title: string | null
    status: string | null
  } | null
}

export default function AdminEmployersPage() {
  const [employers, setEmployers] = useState<Employer[]>([])
  const [assignments, setAssignments] = useState<Record<string, Assignment[]>>({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('profiles').select('id, full_name, email, created_at').eq('role', 'employer').order('full_name')
      setEmployers((data as Employer[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function loadAssignments(employerId: string) {
    if (assignments[employerId]) { setExpanded(employerId); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('employer_candidate_assignments')
      .select('candidate_id, action, candidate_profiles(full_name, current_job_title, status)')
      .eq('employer_id', employerId)
    setAssignments(prev => ({ ...prev, [employerId]: (data as unknown as Assignment[]) ?? [] }))
    setExpanded(employerId)
  }

  if (loading) {
    return <div className="text-sm text-gray-400 py-12 text-center">Loading...</div>
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-950 tracking-tight">Employers</h2>
        <span className="text-sm text-gray-400 mb-1">{employers.length} account{employers.length !== 1 ? 's' : ''}</span>
      </div>

      {employers.length === 0 ? (
        <div className="text-sm text-gray-400 py-12 text-center">No employer accounts yet.</div>
      ) : (
        <div className="space-y-3">
          {employers.map(emp => {
            const isExpanded = expanded === emp.id
            const asgn = assignments[emp.id]
            return (
              <div key={emp.id} className="w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-bold text-gray-950 tracking-tight">{emp.full_name ?? 'Unnamed'}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{emp.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isExpanded ? 'default' : 'outline'}
                    onClick={() => isExpanded ? setExpanded(null) : loadAssignments(emp.id)}
                  >
                    {isExpanded ? 'Done' : 'View candidates'}
                  </Button>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-[#fafafa]">
                    {!asgn ? (
                      <p className="text-xs text-gray-400">Loading…</p>
                    ) : asgn.length === 0 ? (
                      <p className="text-xs text-gray-400">No candidates assigned.</p>
                    ) : (
                      <div className="space-y-3">
                        {asgn.map(a => (
                          <div key={a.candidate_id} className="flex items-center justify-between gap-4">
                            <div>
                              <Link href={`/dashboard/admin/candidates/${a.candidate_id}`}
                                className="text-[13px] font-semibold hover:text-primary transition-colors">
                                {a.candidate_profiles?.full_name ?? 'Unnamed'}
                              </Link>
                              {a.candidate_profiles?.current_job_title && (
                                <span className="text-[12px] text-gray-500 ml-2">{a.candidate_profiles.current_job_title}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {a.candidate_profiles?.status && (
                                <span className="text-[11px] text-gray-400 capitalize">{a.candidate_profiles.status}</span>
                              )}
                              {a.action && (
                                <Badge variant={a.action === 'request_meeting' ? 'default' : 'secondary'} className="text-xs">
                                  {a.action === 'request_meeting' ? 'Meeting' : 'Passed'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}

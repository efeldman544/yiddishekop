'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Lead = {
  id: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  company_name: string | null
  job_title: string
  employment_type: string | null
  hours: string | null
  salary: string | null
  description: string | null
  status: string
  employer_id: string | null
  created_at: string
}

export default function JobLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('job_requirements')
        .select('id, contact_name, contact_email, contact_phone, company_name, job_title, employment_type, hours, salary, description, status, employer_id, created_at')
        .eq('source', 'request')
        .order('created_at', { ascending: false })
      setLeads((data as Lead[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('job_requirements').delete().eq('id', id)
    if (!error) {
      setLeads(prev => prev.filter(l => l.id !== id))
    }
    setConfirmDelete(null)
  }

  return (
    <main className="px-8 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-950 tracking-tight">Hiring Inquiries</h1>
        <span className="text-sm text-gray-400">{leads.length} total</span>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 py-12 text-center">Loading...</div>
      ) : leads.length === 0 ? (
        <div className="text-sm text-gray-400 py-12 text-center">No inquiries yet.</div>
      ) : (
        <div className="space-y-3">
          {leads.map(lead => (
            <div key={lead.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900 text-lg">{lead.contact_name ?? 'Unknown'}
                    {lead.company_name && <span className="font-normal text-gray-400"> · {lead.company_name}</span>}
                  </p>
                  <p className="text-sm font-medium text-indigo-700 mt-0.5">{lead.job_title}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {lead.employer_id ? (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Account linked</span>
                  ) : (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">No account yet</span>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {confirmDelete === lead.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-md transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(lead.id)}
                      className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                      title="Delete inquiry"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                {lead.contact_email && <div><span className="text-gray-400">Email: </span><a href={`mailto:${lead.contact_email}`} className="text-indigo-600 underline underline-offset-2">{lead.contact_email}</a></div>}
                {lead.contact_phone && <div><span className="text-gray-400">Phone: </span><a href={`tel:${lead.contact_phone}`} className="text-indigo-600">{lead.contact_phone}</a></div>}
                {lead.employment_type && <div><span className="text-gray-400">Type: </span>{lead.employment_type}</div>}
                {lead.hours && <div><span className="text-gray-400">Hours/week: </span>{lead.hours}</div>}
                {lead.salary && <div><span className="text-gray-400">Budget: </span>{lead.salary}</div>}
              </div>
              {lead.description && (
                <p className="text-sm text-gray-600 border-t border-gray-100 pt-3">{lead.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Lead = {
  id: string
  contact_name: string
  email: string
  phone: string | null
  company_name: string | null
  role_title: string
  employment_type: string | null
  hours: string | null
  salary: string | null
  description: string | null
  created_at: string
}

export default function JobLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('job_leads')
        .select('*')
        .order('created_at', { ascending: false })
      setLeads((data as Lead[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

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
                  <p className="font-semibold text-gray-900 text-lg">{lead.contact_name}
                    {lead.company_name && <span className="font-normal text-gray-400"> · {lead.company_name}</span>}
                  </p>
                  <p className="text-sm font-medium text-indigo-700 mt-0.5">{lead.role_title}</p>
                </div>
                <p className="text-xs text-gray-400 shrink-0">
                  {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                <div><span className="text-gray-400">Email: </span><a href={`mailto:${lead.email}`} className="text-indigo-600 underline underline-offset-2">{lead.email}</a></div>
                {lead.phone && <div><span className="text-gray-400">Phone: </span><a href={`tel:${lead.phone}`} className="text-indigo-600">{lead.phone}</a></div>}
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

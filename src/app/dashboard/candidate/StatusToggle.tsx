'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const OPTIONS = [
  { value: 'active',   label: 'Active',       description: 'Open to opportunities' },
  { value: 'inactive', label: 'Not looking',  description: 'Taking a break' },
  { value: 'placed',   label: 'Placed',       description: 'Found a position' },
]

export default function StatusToggle({ initialStatus }: { initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus || 'active')
  const [saving, setSaving] = useState(false)

  async function updateStatus(newStatus: string) {
    if (newStatus === status || saving) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('candidate_profiles').update({ status: newStatus }).eq('id', user.id)
      setStatus(newStatus)
    }
    setSaving(false)
  }

  return (
    <div className="flex gap-2">
      {OPTIONS.map(opt => {
        const isActive = status === opt.value
        const activeClass =
          opt.value === 'active'   ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
          opt.value === 'inactive' ? 'bg-amber-50 border-amber-300 text-amber-800' :
                                     'bg-gray-100 border-gray-300 text-gray-700'
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => updateStatus(opt.value)}
            disabled={saving}
            className={`flex-1 px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
              isActive ? activeClass : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
            }`}
          >
            <span className="block">{opt.label}</span>
            <span className={`block mt-0.5 font-normal ${isActive ? 'opacity-80' : 'opacity-60'}`}>{opt.description}</span>
          </button>
        )
      })}
    </div>
  )
}

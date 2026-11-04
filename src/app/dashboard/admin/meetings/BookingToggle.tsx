'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { humanError } from '@/lib/errorMessage'
import ErrorNote from '@/components/ErrorNote'

/**
 * Whether candidates can book a screening call.
 *
 * It lives on the Meetings tab because that is where the bookings themselves
 * are, so the switch sits beside the thing it governs rather than in a
 * settings page nobody opens.
 *
 * Only an admin can write the row — the policy in supabase/booking_toggle.sql
 * enforces that, not this component.
 */
export default function BookingToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data, error: readError } = await supabase
        .from('site_settings').select('screening_booking_enabled').eq('id', true).maybeSingle()
      if (cancelled) return
      if (readError) {
        setError(humanError(readError, 'Couldn’t read the booking setting.'))
        // Shown as on, which is how the site behaves when the setting can't
        // be read — better than a switch that lies about what candidates see.
        setEnabled(true)
        return
      }
      setEnabled((data as { screening_booking_enabled?: boolean } | null)?.screening_booking_enabled ?? true)
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function toggle() {
    if (enabled === null || saving) return
    const next = !enabled
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    // Only flip the switch once the write has landed. An optimistic flip that
    // swallows the error shows booking as off while candidates still see it.
    const { error: writeError } = await supabase
      .from('site_settings')
      .update({
        screening_booking_enabled: next,
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
      })
      .eq('id', true)
    if (writeError) {
      setError(humanError(writeError, 'Couldn’t change the booking setting.'))
    } else {
      setEnabled(next)
    }
    setSaving(false)
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white px-5 py-4">
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">Screening call booking</p>
          <p className="mt-0.5 text-[13px] text-gray-500">
            {enabled === null
              ? 'Checking…'
              : enabled
                ? 'Candidates can pick a time for their screening call.'
                : 'Candidates can’t book. Their dashboard says you’ll be in touch.'}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled === true}
          aria-label="Screening call booking"
          disabled={enabled === null || saving}
          onClick={toggle}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
            enabled ? 'bg-emerald-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {error && <ErrorNote className="mt-3">{error}</ErrorNote>}
    </section>
  )
}

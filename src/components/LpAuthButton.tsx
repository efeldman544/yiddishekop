'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// Auth-aware nav button for the public/marketing pages: shows "My account"
// linking to the dashboard when a session exists, otherwise "Log in". Used by
// every main-site header so a logged-in visitor never sees a misleading
// "Log in" on pages other than the home page.
export default function LpAuthButton({
  className = 'lp-btn lp-btn-ghost',
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  const [dashboardHref, setDashboardHref] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: string }>()
      const role = profile?.role ?? user.user_metadata?.role ?? 'candidate'
      setDashboardHref(`/dashboard/${role}`)
    })
  }, [])

  return dashboardHref
    ? <Link href={dashboardHref} className={className} style={style}>My account</Link>
    : <Link href="/login" className={className} style={style}>Log in</Link>
}

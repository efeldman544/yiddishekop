'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'

const CALENDLY_URL = 'https://calendly.com/yiddishekop-info/new-meeting'

export default function BookingPage() {
  const router = useRouter()
  const [booked, setBooked] = useState(false)

  useEffect(() => {
    const existing = document.getElementById('calendly-script')
    function initWidget() {
      // @ts-ignore
      if (window.Calendly) {
        // @ts-ignore
        window.Calendly.initInlineWidget({
          url: CALENDLY_URL,
          parentElement: document.querySelector('.calendly-inline-widget'),
        })
      }
    }
    if (existing) {
      initWidget()
    } else {
      const script = document.createElement('script')
      script.id = 'calendly-script'
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      script.async = true
      script.onload = initWidget
      document.head.appendChild(script)
    }
  }, [])

  useEffect(() => {
    async function handleMessage(e: MessageEvent) {
      if (e.data?.event !== 'calendly.event_scheduled') return
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('candidate_profiles').upsert({
        id: user.id, screening_booked: true, screening_booked_at: new Date().toISOString(),
      })
      setBooked(true)
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    if (booked) {
      const timer = setTimeout(() => router.push('/dashboard/candidate'), 3000)
      return () => clearTimeout(timer)
    }
  }, [booked, router])

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      {booked ? (
        <Card className="text-center p-10">
          <CardContent className="pt-0">
            <div className="text-4xl mb-3">✓</div>
            <h2 className="text-xl font-bold mb-1">Call booked!</h2>
            <p className="text-sm text-muted-foreground">You&apos;ll receive a confirmation email shortly. Redirecting you back to your dashboard...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Book your screening call</h2>
            <p className="text-sm text-muted-foreground mt-1">Pick a time that works for you. The call takes about 15–20 minutes.</p>
          </div>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="calendly-inline-widget" data-url={CALENDLY_URL} style={{ minWidth: '320px', height: '700px' }} />
            </CardContent>
          </Card>
        </>
      )}
    </main>
  )
}

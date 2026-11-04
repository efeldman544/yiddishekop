import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { screeningBookingEnabled } from '@/lib/siteSettings'
import { Card, CardContent } from '@/components/ui/card'
import BookingWidget from './BookingWidget'

// The Calendly widget is behind this check rather than inside it, so a
// candidate who kept the link or typed the address gets the same answer as
// one who followed the button. Hiding the button alone would leave the page
// perfectly bookable to anybody who had seen it once.
export default async function BookingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (await screeningBookingEnabled(supabase)) return <BookingWidget />

  return (
    <main className="dash-page-centered">
      <Card className="p-10 text-center">
        <CardContent className="pt-0">
          <h2 className="text-xl font-bold mb-1">Booking is closed right now</h2>
          <p className="text-sm text-muted-foreground">
            We&rsquo;re not taking new screening calls at the moment. We&rsquo;ll be in touch to
            arrange a time with you.
          </p>
          <Link
            href="/dashboard/candidate"
            className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            ← Back to your dashboard
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}

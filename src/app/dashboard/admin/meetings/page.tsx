import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MeetingsClient from './MeetingsClient'

export default async function MeetingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <main className="max-w-5xl mx-auto px-6 py-8 space-y-5">
      <h2 className="text-3xl font-bold text-gray-950 tracking-tight">Meetings</h2>
      <MeetingsClient />
    </main>
  )
}

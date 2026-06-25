import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CopilotChat from './CopilotChat'

export const metadata = { title: 'Trading Co-Pilot' }

export default async function CopilotPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memories } = await supabase
    .from('trading_memory')
    .select('id, lesson, category, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return <CopilotChat initialMemories={memories ?? []} />
}

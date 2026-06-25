import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data, error } = await supabase
    .from('trading_memory')
    .select('id, lesson, category, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return new NextResponse('DB error', { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { lesson, category } = await req.json()
  if (!lesson?.trim()) return new NextResponse('lesson is required', { status: 400 })

  const { data, error } = await supabase
    .from('trading_memory')
    .insert({ user_id: user.id, lesson: lesson.trim(), category: category ?? 'general' })
    .select()
    .single()

  if (error) return new NextResponse('DB error', { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await req.json()
  if (!id) return new NextResponse('id is required', { status: 400 })

  const { error } = await supabase
    .from('trading_memory')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return new NextResponse('DB error', { status: 500 })
  return new NextResponse(null, { status: 204 })
}

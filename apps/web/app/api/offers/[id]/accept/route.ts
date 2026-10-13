import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: offerId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Load the offer with its task
  const { data: offer } = await supabase
    .from('offers')
    .select('id, task_id, tasker_id, amount_paise, status, tasks(poster_id, status, title)')
    .eq('id', offerId)
    .single()

  if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 })

  const task = offer.tasks as unknown as { poster_id: string; status: string; title: string } | null
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  if (task.poster_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (task.status !== 'open') return NextResponse.json({ error: 'Task is not open' }, { status: 409 })
  if (offer.status !== 'pending') return NextResponse.json({ error: 'Offer already actioned' }, { status: 409 })

  // Accept this offer, reject all others on the same task
  const [{ error: e1 }, { error: e2 }, { error: e3 }] = await Promise.all([
    supabase.from('offers').update({ status: 'accepted' }).eq('id', offerId),
    supabase.from('offers').update({ status: 'rejected' }).eq('task_id', offer.task_id).neq('id', offerId),
    supabase.from('tasks').update({ status: 'assigned', assigned_tasker_id: offer.tasker_id }).eq('id', offer.task_id),
  ])

  if (e1 || e2 || e3) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  return NextResponse.json({ ok: true, taskId: offer.task_id })
}

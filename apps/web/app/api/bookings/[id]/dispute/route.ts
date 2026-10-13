import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reason } = await req.json() as { reason?: string }
  if (!reason || reason.trim().length < 10) {
    return NextResponse.json({ error: 'Reason must be at least 10 characters' }, { status: 400 })
  }

  // Verify poster owns this booking and it's in a disputable state
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, poster_id, tasker_id, escrow_state, tasks(status)')
    .eq('id', bookingId)
    .single()

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (booking.poster_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const task = booking.tasks as unknown as { status: string } | null
  const disputableStatuses = ['in_progress', 'tasker_done']
  if (!task || !disputableStatuses.includes(task.status)) {
    return NextResponse.json({ error: 'Task is not in a disputable state' }, { status: 409 })
  }
  if (booking.escrow_state !== 'held') {
    return NextResponse.json({ error: 'No payment held for this booking' }, { status: 409 })
  }

  // Check no existing dispute
  const { data: existing } = await supabase
    .from('disputes')
    .select('id')
    .eq('booking_id', bookingId)
    .maybeSingle()
  if (existing) return NextResponse.json({ error: 'Dispute already raised' }, { status: 409 })

  const { error } = await supabase
    .from('disputes')
    .insert({ booking_id: bookingId, raised_by: user.id, reason: reason.trim() })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

import { createClient } from '@/lib/supabase/server'
import { getPaymentProvider, canTransition } from '@taim/core'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params
  const body = await request.json() as { otp: string }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, task_id, poster_id, tasker_id, tasker_payout_paise, payment_id, payment_provider, completion_otp_hash, escrow_state')
    .eq('id', bookingId)
    .single()

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (booking.poster_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (booking.escrow_state !== 'held') return NextResponse.json({ error: 'Funds not held' }, { status: 400 })

  const { data: task } = await supabase.from('tasks').select('status').eq('id', booking.task_id).single()
  if (!canTransition(task?.status as 'tasker_done', 'completed', 'poster')) {
    return NextResponse.json({ error: 'Invalid state transition' }, { status: 400 })
  }

  // Verify OTP
  const inputHash = crypto.createHash('sha256').update(body.otp).digest('hex')
  if (inputHash !== booking.completion_otp_hash) {
    return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
  }

  // Get tasker payout account reference
  const { data: taskerProfile } = await supabase
    .from('tasker_profiles')
    .select('payout_account_ref')
    .eq('profile_id', booking.tasker_id)
    .single()

  if (!taskerProfile?.payout_account_ref) {
    return NextResponse.json({ error: 'Tasker has no payout account configured' }, { status: 400 })
  }

  // Trigger payout
  const provider = getPaymentProvider({
    PAYMENT_PROVIDER: booking.payment_provider,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    CASHFREE_APP_ID: process.env.CASHFREE_APP_ID,
    CASHFREE_SECRET_KEY: process.env.CASHFREE_SECRET_KEY,
    CASHFREE_SANDBOX: process.env.CASHFREE_SANDBOX,
  })

  const payout = await provider.releaseToTasker({
    bookingId: booking.id,
    taskerPayoutPaise: BigInt(booking.tasker_payout_paise),
    taskerPayoutAccountRef: taskerProfile.payout_account_ref,
  })

  // Mark completed + update state
  await supabase.from('bookings').update({
    escrow_state: 'released',
    completed_at: new Date().toISOString(),
  }).eq('id', bookingId)

  await supabase.from('tasks').update({ status: 'completed' }).eq('id', booking.task_id)

  // Increment tasker's completed task count
  await supabase.rpc('increment_completed_tasks', { p_profile_id: booking.tasker_id })

  return NextResponse.json({ ok: true, payoutId: payout.payoutId })
}

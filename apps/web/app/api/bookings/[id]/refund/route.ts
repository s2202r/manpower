import { createClient } from '@/lib/supabase/server'
import { getPaymentProvider } from '@taim/core'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params
  const body = await request.json() as { reason: string }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, task_id, poster_id, amount_paise, poster_fee_paise, gst_poster_paise, payment_id, payment_provider, escrow_state')
    .eq('id', bookingId)
    .single()

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (booking.poster_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (booking.escrow_state !== 'held') return NextResponse.json({ error: 'Cannot refund' }, { status: 400 })
  if (!booking.payment_id) return NextResponse.json({ error: 'No payment recorded' }, { status: 400 })

  // Refund the full amount charged to poster
  const refundAmountPaise = BigInt(booking.amount_paise)
    + BigInt(booking.poster_fee_paise)
    + BigInt(booking.gst_poster_paise)

  const provider = getPaymentProvider({
    PAYMENT_PROVIDER: booking.payment_provider,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    CASHFREE_APP_ID: process.env.CASHFREE_APP_ID,
    CASHFREE_SECRET_KEY: process.env.CASHFREE_SECRET_KEY,
    CASHFREE_SANDBOX: process.env.CASHFREE_SANDBOX,
  })

  const refund = await provider.refund({
    paymentId: booking.payment_id,
    amountPaise: refundAmountPaise,
    reason: body.reason,
    referenceId: bookingId,
  })

  await supabase.from('bookings').update({ escrow_state: 'refunded' }).eq('id', bookingId)
  await supabase.from('tasks').update({ status: 'cancelled' }).eq('id', booking.task_id)

  return NextResponse.json({ ok: true, refundId: refund.refundId })
}

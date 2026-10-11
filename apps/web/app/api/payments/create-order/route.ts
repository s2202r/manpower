import { createClient } from '@/lib/supabase/server'
import { getPaymentProvider } from '@taim/core'
import { calculateFees } from '@taim/core'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { offerId: string }
  const { offerId } = body

  // Load offer with task and tasker details
  const { data: offer } = await supabase
    .from('offers')
    .select('id, amount_paise, task_id, tasker_id, status, tasks(id, poster_id, status), profiles!tasker_id(id)')
    .eq('id', offerId)
    .single()

  if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 })

  const task = offer.tasks as unknown as { id: string; poster_id: string; status: string } | null
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  if (task.poster_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (offer.status !== 'accepted') return NextResponse.json({ error: 'Offer not accepted' }, { status: 400 })
  if (task.status !== 'assigned') return NextResponse.json({ error: 'Task not in assigned state' }, { status: 400 })

  // Load tasker profile for fee calculation
  const { data: taskerProfile } = await supabase
    .from('tasker_profiles')
    .select('completed_tasks, first_task_at')
    .eq('profile_id', offer.tasker_id)
    .single()

  const fees = calculateFees({
    amountPaise: BigInt(offer.amount_paise),
    taskerCompletedTasks: taskerProfile?.completed_tasks ?? 0,
    taskerFirstTaskAt: taskerProfile?.first_task_at ? new Date(taskerProfile.first_task_at) : null,
  })

  const provider = getPaymentProvider({
    PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    CASHFREE_APP_ID: process.env.CASHFREE_APP_ID,
    CASHFREE_SECRET_KEY: process.env.CASHFREE_SECRET_KEY,
    CASHFREE_SANDBOX: process.env.CASHFREE_SANDBOX,
  })

  const order = await provider.createOrder({
    amountPaise: fees.totalChargedToPosterpaise,
    currency: 'INR',
    receiptId: `taim_${offerId}`,
    notes: { offerId, taskId: task.id, userId: user.id },
  })

  // Store pending booking (not yet confirmed — webhook confirms it)
  const { data: booking } = await supabase
    .from('bookings')
    .insert({
      task_id: task.id,
      offer_id: offerId,
      poster_id: user.id,
      tasker_id: offer.tasker_id,
      amount_paise: Number(fees.amountPaise),
      poster_fee_paise: Number(fees.posterFeePaise),
      tasker_fee_paise: Number(fees.taskerFeePaise),
      gst_poster_paise: Number(fees.gstOnPosterFeePaise),
      gst_tasker_paise: Number(fees.gstOnTaskerFeePaise),
      tasker_payout_paise: Number(fees.taskerPayoutPaise),
      payment_provider: provider.name,
      payment_order_id: order.orderId,
      escrow_state: 'pending',
    })
    .select('id')
    .single()

  if (!booking) return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })

  return NextResponse.json({
    orderId: order.orderId,
    amountPaise: Number(fees.totalChargedToPosterpaise),
    provider: provider.name,
    bookingId: booking.id,
    // Only return the public key — secret stays server-side
    razorpayKeyId: provider.name === 'razorpay' ? process.env.RAZORPAY_KEY_ID : undefined,
  })
}

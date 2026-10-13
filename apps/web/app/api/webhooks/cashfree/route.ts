import { createClient } from '@/lib/supabase/server'
import { CashfreeProvider } from '@taim/core'
import { NextResponse } from 'next/server'
import { notify } from '@/lib/notify'
import { sendEmail, emailEscrowHeld } from '@/lib/email'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-webhook-signature') ?? ''
  const secret = process.env.CASHFREE_WEBHOOK_SECRET ?? ''

  const provider = new CashfreeProvider(
    process.env.CASHFREE_APP_ID!,
    process.env.CASHFREE_SECRET_KEY!,
    process.env.CASHFREE_SANDBOX === 'true',
  )

  if (!provider.verifyWebhook({ rawBody, signature, secret })) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = provider.parseWebhookEvent(rawBody)

  const supabase = await createClient()

  // Idempotency check
  const { data: existing } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('idempotency_key', event.idempotencyKey)
    .single()

  if (existing) return NextResponse.json({ ok: true, duplicate: true })

  // Store raw event
  await supabase.from('webhook_events').insert({
    provider: event.provider,
    idempotency_key: event.idempotencyKey,
    event_type: event.eventType,
    payload: JSON.parse(rawBody),
  })

  if (event.status === 'captured' && event.paymentId) {
    // Find booking by provider order id
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, task_id, poster_id, tasker_id, tasker_payout_paise')
      .eq('payment_order_id', event.orderId)
      .single()

    if (booking) {
      await supabase.from('bookings').update({
        payment_id: event.paymentId,
        escrow_state: 'held',
        auto_release_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      }).eq('id', booking.id)

      // Mark task as in_progress
      await supabase.from('tasks').update({ status: 'in_progress' }).eq('id', booking.task_id)

      // Mark webhook processed
      await supabase.from('webhook_events').update({ processed_at: new Date().toISOString() })
        .eq('idempotency_key', event.idempotencyKey)

      // Notify tasker and poster
      void notify({ supabase, userId: booking.tasker_id, kind: 'payment_held', title: 'Payment secured', body: 'The poster\'s payment is in escrow. You can start the task.', link: `/bookings/${booking.id}` })
      void notify({ supabase, userId: booking.poster_id, kind: 'payment_held', title: 'Payment confirmed', body: 'Your payment is secured in escrow. The Tasker will begin shortly.', link: `/bookings/${booking.id}` })

      // Non-blocking: email tasker that escrow is held
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('id, amount_paise, tasks!task_id(title), profiles!tasker_id(email, name)')
        .eq('id', booking.id)
        .single()

      if (bookingData) {
        const tasker = bookingData.profiles as unknown as { email: string; name: string } | null
        const task = bookingData.tasks as unknown as { title: string } | null
        if (tasker?.email) {
          void sendEmail({
            to: tasker.email,
            ...emailEscrowHeld({
              taskerName: tasker.name ?? 'Tasker',
              taskTitle: task?.title ?? 'your task',
              amountRs: Math.round((bookingData.amount_paise as number) / 100),
              bookingUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://taim.in'}/bookings/${bookingData.id}`,
            }),
          })
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}

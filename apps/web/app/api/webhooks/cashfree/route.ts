import { createClient } from '@/lib/supabase/server'
import { CashfreeProvider } from '@taim/core'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const rawBody = await request.text()
  // Cashfree sends timestamp.signature in x-webhook-signature header
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

  const { data: existing } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('idempotency_key', event.idempotencyKey)
    .single()

  if (existing) return NextResponse.json({ ok: true, duplicate: true })

  await supabase.from('webhook_events').insert({
    provider: event.provider,
    idempotency_key: event.idempotencyKey,
    event_type: event.eventType,
    payload: JSON.parse(rawBody),
  })

  if (event.status === 'captured' && event.paymentId) {
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, task_id')
      .eq('payment_order_id', event.orderId)
      .single()

    if (booking) {
      await supabase.from('bookings').update({
        payment_id: event.paymentId,
        escrow_state: 'held',
        auto_release_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      }).eq('id', booking.id)

      await supabase.from('tasks').update({ status: 'in_progress' }).eq('id', booking.task_id)

      await supabase.from('webhook_events').update({ processed_at: new Date().toISOString() })
        .eq('idempotency_key', event.idempotencyKey)
    }
  }

  return NextResponse.json({ ok: true })
}

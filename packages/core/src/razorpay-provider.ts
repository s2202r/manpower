import crypto from 'crypto'
import type {
  CreateOrderParams, CreateOrderResult, VerifyWebhookParams,
  WebhookEvent, ReleaseFundsParams, RefundParams, PayoutResult,
  PaymentProvider,
} from './payment-provider'

// Razorpay Route: escrow → instant payout to tasker via linked account
export class RazorpayProvider implements PaymentProvider {
  readonly name = 'razorpay' as const
  private keyId: string
  private keySecret: string

  constructor(keyId: string, keySecret: string) {
    this.keyId = keyId
    this.keySecret = keySecret
  }

  private authHeader(): string {
    return 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: this.authHeader() },
      body: JSON.stringify({
        amount: Number(params.amountPaise),
        currency: 'INR',
        receipt: params.receiptId,
        notes: params.notes ?? {},
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Razorpay createOrder failed: ${err}`)
    }
    const data = await res.json() as { id: string; amount: number }
    return { orderId: data.id, provider: 'razorpay', amountPaise: BigInt(data.amount) }
  }

  verifyWebhook({ rawBody, signature, secret }: VerifyWebhookParams): boolean {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  }

  parseWebhookEvent(rawBody: string): WebhookEvent {
    const payload = JSON.parse(rawBody) as {
      event: string
      payload: {
        payment?: { entity: { id: string; order_id: string; amount: number; status: string } }
        order?: { entity: { id: string } }
        refund?: { entity: { id: string; payment_id: string; amount: number } }
        payout?: { entity: { id: string; status: string } }
      }
    }

    const eventType = payload.event
    const payment = payload.payload.payment?.entity
    const refund = payload.payload.refund?.entity
    const payout = payload.payload.payout?.entity

    const orderId = payment?.order_id ?? payload.payload.order?.entity.id ?? ''
    const paymentId = payment?.id ?? refund?.payment_id ?? ''
    const amountPaise = payment ? BigInt(payment.amount) : refund ? BigInt(refund.amount) : undefined

    let status: WebhookEvent['status'] = 'failed'
    if (eventType === 'payment.captured') status = 'captured'
    else if (eventType === 'refund.processed') status = 'refunded'
    else if (eventType === 'payout.processed') status = 'payout_processed'

    return {
      provider: 'razorpay',
      idempotencyKey: `rzp_${eventType}_${paymentId || payout?.id || orderId}`,
      eventType,
      orderId,
      paymentId,
      amountPaise,
      status,
      rawPayload: payload,
    }
  }

  async releaseToTasker(params: ReleaseFundsParams): Promise<PayoutResult> {
    // Razorpay Route payout to tasker's linked account
    const res = await fetch('https://api.razorpay.com/v1/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: this.authHeader() },
      body: JSON.stringify({
        account_number: params.taskerPayoutAccountRef,
        amount: Number(params.taskerPayoutPaise),
        currency: 'INR',
        mode: 'IMPS',
        purpose: 'payout',
        queue_if_low_balance: true,
        notes: { bookingId: params.bookingId, notes: params.notes ?? '' },
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Razorpay payout failed: ${err}`)
    }
    const data = await res.json() as { id: string; status: string }
    return { payoutId: data.id, status: 'queued' }
  }

  async refund(params: RefundParams): Promise<{ refundId: string }> {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${params.paymentId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: this.authHeader() },
      body: JSON.stringify({
        amount: Number(params.amountPaise),
        notes: { reason: params.reason, referenceId: params.referenceId },
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Razorpay refund failed: ${err}`)
    }
    const data = await res.json() as { id: string }
    return { refundId: data.id }
  }
}

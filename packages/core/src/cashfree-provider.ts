import crypto from 'crypto'
import type {
  CreateOrderParams, CreateOrderResult, VerifyWebhookParams,
  WebhookEvent, ReleaseFundsParams, RefundParams, PayoutResult,
  PaymentProvider,
} from './payment-provider'

// Cashfree Easy Split: split payments with automatic settlement
export class CashfreeProvider implements PaymentProvider {
  readonly name = 'cashfree' as const
  private appId: string
  private secretKey: string
  private baseUrl: string

  constructor(appId: string, secretKey: string, sandbox = false) {
    this.appId = appId
    this.secretKey = secretKey
    this.baseUrl = sandbox
      ? 'https://sandbox.cashfree.com/pg'
      : 'https://api.cashfree.com/pg'
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-client-id': this.appId,
      'x-client-secret': this.secretKey,
      'x-api-version': '2023-08-01',
    }
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const res = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        order_id: params.receiptId,
        order_amount: Number(params.amountPaise) / 100,
        order_currency: 'INR',
        order_note: JSON.stringify(params.notes ?? {}),
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Cashfree createOrder failed: ${err}`)
    }
    const data = await res.json() as { cf_order_id: string; order_amount: number }
    return {
      orderId: String(data.cf_order_id),
      provider: 'cashfree',
      amountPaise: BigInt(Math.round(data.order_amount * 100)),
    }
  }

  verifyWebhook({ rawBody, signature, secret }: VerifyWebhookParams): boolean {
    // Cashfree uses timestamp+body HMAC
    const [ts, sig] = signature.split('.')
    const expected = crypto
      .createHmac('sha256', secret)
      .update(ts + rawBody)
      .digest('base64')
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig ?? ''))
  }

  parseWebhookEvent(rawBody: string): WebhookEvent {
    const payload = JSON.parse(rawBody) as {
      type: string
      data: {
        order: { order_id: string; cf_order_id: string }
        payment?: { cf_payment_id: string; payment_amount: number; payment_status: string }
        refund?: { cf_refund_id: string; refund_amount: number }
        transfer?: { transfer_id: string; transfer_status: string }
      }
    }

    const eventType = payload.type
    const orderId = payload.data.order.order_id
    const payment = payload.data.payment
    const refund = payload.data.refund
    const transfer = payload.data.transfer

    const paymentId = payment ? String(payment.cf_payment_id) : ''
    const amountPaise = payment
      ? BigInt(Math.round(payment.payment_amount * 100))
      : refund
      ? BigInt(Math.round(refund.refund_amount * 100))
      : undefined

    let status: WebhookEvent['status'] = 'failed'
    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK') status = 'captured'
    else if (eventType === 'REFUND_STATUS_WEBHOOK') status = 'refunded'
    else if (eventType === 'TRANSFER_SUCCESS_WEBHOOK') status = 'payout_processed'

    return {
      provider: 'cashfree',
      idempotencyKey: `cf_${eventType}_${paymentId || transfer?.transfer_id || orderId}`,
      eventType,
      orderId,
      paymentId,
      amountPaise,
      status,
      rawPayload: payload,
    }
  }

  async releaseToTasker(params: ReleaseFundsParams): Promise<PayoutResult> {
    // Cashfree Easy Split: transfer from escrow to vendor
    const res = await fetch(`${this.baseUrl}/transfers`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        transfer_id: `payout_${params.bookingId}`,
        transfer_amount: Number(params.taskerPayoutPaise) / 100,
        transfer_currency: 'INR',
        beneficiary_details: {
          beneficiary_id: params.taskerPayoutAccountRef,
        },
        transfer_remarks: params.notes ?? `Payout for booking ${params.bookingId}`,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Cashfree payout failed: ${err}`)
    }
    const data = await res.json() as { transfer_id: string; transfer_status: string }
    return { payoutId: data.transfer_id, status: 'queued' }
  }

  async refund(params: RefundParams): Promise<{ refundId: string }> {
    const res = await fetch(`${this.baseUrl}/orders/${params.referenceId}/refunds`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        refund_amount: Number(params.amountPaise) / 100,
        refund_id: `refund_${params.referenceId}_${Date.now()}`,
        refund_note: params.reason,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Cashfree refund failed: ${err}`)
    }
    const data = await res.json() as { cf_refund_id: string }
    return { refundId: String(data.cf_refund_id) }
  }
}

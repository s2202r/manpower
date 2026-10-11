// The PaymentProvider interface — both Razorpay and Cashfree implement this.
// Chosen per transaction by config with failover.

export interface CreateOrderParams {
  amountPaise: bigint       // total charged to poster (amount + poster fee + GST)
  currency: 'INR'
  receiptId: string         // our internal booking/reference ID
  notes?: Record<string, string>
}

export interface CreateOrderResult {
  orderId: string           // provider's order/session ID
  provider: 'razorpay' | 'cashfree'
  amountPaise: bigint
}

export interface VerifyWebhookParams {
  rawBody: string
  signature: string
  secret: string
}

export interface WebhookEvent {
  provider: 'razorpay' | 'cashfree'
  idempotencyKey: string    // provider event ID, used to deduplicate
  eventType: string
  orderId: string
  paymentId?: string
  amountPaise?: bigint
  status: 'captured' | 'failed' | 'refunded' | 'payout_processed'
  rawPayload: unknown
}

export interface HoldFundsParams {
  orderId: string
  paymentId: string
  bookingId: string
}

export interface ReleaseFundsParams {
  bookingId: string
  taskerPayoutPaise: bigint
  taskerPayoutAccountRef: string  // provider-stored payout account reference
  notes?: string
}

export interface RefundParams {
  paymentId: string
  amountPaise: bigint
  reason: string
  referenceId: string
}

export interface PayoutResult {
  payoutId: string
  status: 'queued' | 'processing' | 'processed' | 'failed'
}

export interface PaymentProvider {
  readonly name: 'razorpay' | 'cashfree'
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>
  verifyWebhook(params: VerifyWebhookParams): boolean
  parseWebhookEvent(rawBody: string, provider: 'razorpay' | 'cashfree'): WebhookEvent
  releaseToTasker(params: ReleaseFundsParams): Promise<PayoutResult>
  refund(params: RefundParams): Promise<{ refundId: string }>
}

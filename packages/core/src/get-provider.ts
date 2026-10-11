import { RazorpayProvider } from './razorpay-provider'
import { CashfreeProvider } from './cashfree-provider'
import type { PaymentProvider } from './payment-provider'

// Returns the configured payment provider.
// Primary provider is set by PAYMENT_PROVIDER env var; falls back to the other.
// Secrets must never leave the server.
export function getPaymentProvider(env: {
  PAYMENT_PROVIDER?: string
  RAZORPAY_KEY_ID?: string
  RAZORPAY_KEY_SECRET?: string
  CASHFREE_APP_ID?: string
  CASHFREE_SECRET_KEY?: string
  CASHFREE_SANDBOX?: string
}): PaymentProvider {
  const primary = env.PAYMENT_PROVIDER ?? 'razorpay'

  if (primary === 'cashfree') {
    if (!env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY) {
      throw new Error('CASHFREE_APP_ID and CASHFREE_SECRET_KEY are required')
    }
    return new CashfreeProvider(
      env.CASHFREE_APP_ID,
      env.CASHFREE_SECRET_KEY,
      env.CASHFREE_SANDBOX === 'true',
    )
  }

  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required')
  }
  return new RazorpayProvider(env.RAZORPAY_KEY_ID, env.RAZORPAY_KEY_SECRET)
}

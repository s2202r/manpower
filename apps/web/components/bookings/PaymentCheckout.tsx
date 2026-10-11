'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  bookingId: string
  offerId: string
  totalPaise: number
  orderId: string | null
}

export default function PaymentCheckout({ bookingId, offerId, totalPaise, orderId: existingOrderId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function initiatePayment() {
    setLoading(true)
    setError(null)

    let orderData: { orderId: string; amountPaise: number; provider: string; razorpayKeyId?: string } | null = null

    if (!existingOrderId) {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      })
      if (!res.ok) {
        const d = await res.json() as { error: string }
        setError(d.error)
        setLoading(false)
        return
      }
      orderData = await res.json()
    }

    const rzpKeyId = orderData?.razorpayKeyId ?? (window as unknown as Record<string, string>)['RAZORPAY_KEY_ID']
    const orderId = orderData?.orderId ?? existingOrderId

    if (!rzpKeyId || !orderId) {
      // Fallback: open booking page (payment provider not configured in dev)
      router.push(`/bookings/${bookingId}`)
      return
    }

    // Load Razorpay checkout script dynamically
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => {
      const rzp = new (window as unknown as { Razorpay: new (opts: Record<string, unknown>) => { open: () => void } }).Razorpay({
        key: rzpKeyId,
        order_id: orderId,
        amount: totalPaise,
        currency: 'INR',
        name: 'Taim',
        description: 'Task payment',
        handler: () => {
          // Payment success — webhook will update state. Redirect to booking.
          router.push(`/bookings/${bookingId}`)
        },
        modal: { ondismiss: () => setLoading(false) },
      })
      rzp.open()
    }
    document.body.appendChild(script)
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button
        onClick={initiatePayment}
        disabled={loading}
        className="w-full rounded-xl bg-brand-600 py-4 text-lg font-bold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? 'Opening payment…' : `Pay ₹${Math.round(totalPaise / 100).toLocaleString('en-IN')}`}
      </button>
      <p className="text-center text-xs text-gray-500">
        Secured by Razorpay · Money held in escrow until task is complete.
      </p>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import PaymentCheckout from '@/components/bookings/PaymentCheckout'

export const metadata = { title: 'Pay for task' }

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, poster_id, offer_id, amount_paise, poster_fee_paise, gst_poster_paise, payment_order_id, escrow_state, tasks(title)')
    .eq('id', bookingId)
    .single()

  if (!booking) notFound()
  if (booking.poster_id !== user.id) redirect('/dashboard')

  // Already paid
  if (booking.escrow_state !== 'pending') redirect(`/bookings/${bookingId}`)

  const task = booking.tasks as unknown as { title: string } | null
  const totalPaise = booking.amount_paise + booking.poster_fee_paise + booking.gst_poster_paise

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Pay for task</h1>
        <p className="mb-6 text-gray-600">{task?.title}</p>

        <div className="mb-6 space-y-2 rounded-xl bg-gray-50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Task amount</span>
            <span className="font-semibold">₹{Math.round(booking.amount_paise / 100).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Platform fee (5%)</span>
            <span className="font-semibold">₹{Math.round(booking.poster_fee_paise / 100).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">GST on fee (18%)</span>
            <span className="font-semibold">₹{Math.round(booking.gst_poster_paise / 100).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-base">
            <span className="font-bold">Total</span>
            <span className="font-bold text-brand-600">₹{Math.round(totalPaise / 100).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <PaymentCheckout
          bookingId={bookingId}
          offerId={booking.offer_id}
          totalPaise={totalPaise}
          orderId={booking.payment_order_id}
        />
      </div>
    </main>
  )
}

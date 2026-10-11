import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import BookingActions from '@/components/bookings/BookingActions'
import ReviewForm from '@/components/bookings/ReviewForm'
import Link from 'next/link'

export const metadata = { title: 'Booking' }

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      tasks(id, title, status, task_type, display_area, category_id),
      profiles!poster_id(name),
      profiles!tasker_id(name)
    `)
    .eq('id', id)
    .single()

  if (!booking) notFound()

  const isPoster = user.id === booking.poster_id
  const isTasker = user.id === booking.tasker_id
  if (!isPoster && !isTasker) redirect('/dashboard')

  const task = booking.tasks as { id: string; title: string; status: string } | null
  const posterProfile = (booking as Record<string, unknown>)['profiles!poster_id'] as { name: string } | null
  const taskerProfile = (booking as Record<string, unknown>)['profiles!tasker_id'] as { name: string } | null

  // Check if this user has already reviewed
  const { data: myReview } = await supabase
    .from('reviews')
    .select('id, rating, comment')
    .eq('booking_id', id)
    .eq('reviewer_id', user.id)
    .single()

  const revieweeId = isPoster ? booking.tasker_id : booking.poster_id

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4 space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{task?.title}</h1>

          {/* Booking summary */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p className="text-gray-500">Task amount</p>
              <p className="font-bold text-lg">₹{Math.round(booking.amount_paise / 100).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-gray-500">Escrow state</p>
              <p className={`font-semibold capitalize ${
                booking.escrow_state === 'held' ? 'text-blue-600'
                : booking.escrow_state === 'released' ? 'text-green-600'
                : booking.escrow_state === 'refunded' ? 'text-orange-600'
                : 'text-gray-600'
              }`}>{booking.escrow_state}</p>
            </div>
            <div>
              <p className="text-gray-500">Poster fee</p>
              <p className="font-medium">₹{Math.round((booking.poster_fee_paise + booking.gst_poster_paise) / 100).toLocaleString('en-IN')} (incl. GST)</p>
            </div>
            <div>
              <p className="text-gray-500">Tasker payout</p>
              <p className="font-medium">₹{Math.round(booking.tasker_payout_paise / 100).toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="border-t pt-4 text-sm text-gray-600">
            <p>Poster: <span className="font-semibold text-gray-900">{posterProfile?.name}</span></p>
            <p className="mt-1">Tasker: <span className="font-semibold text-gray-900">{taskerProfile?.name}</span></p>
          </div>
        </div>

        {/* Action buttons based on role and state */}
        <BookingActions
          bookingId={id}
          taskId={booking.task_id}
          escrowState={booking.escrow_state}
          taskStatus={task?.status ?? ''}
          isPoster={isPoster}
          isTasker={isTasker}
        />

        {/* Chat link */}
        {(booking.escrow_state === 'held' || booking.escrow_state === 'released') && (
          <Link href={`/tasks/${booking.task_id}/chat`}
            className="block rounded-2xl border-2 border-brand-600 p-4 text-center font-semibold text-brand-600 hover:bg-brand-50">
            Open chat
          </Link>
        )}

        {/* Review section */}
        {booking.escrow_state === 'released' && !myReview && (
          <ReviewForm bookingId={id} revieweeId={revieweeId} />
        )}

        {myReview && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="font-semibold text-gray-900 mb-1">Your review</p>
            <div className="flex gap-1 mb-2">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={s <= myReview.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
              ))}
            </div>
            {myReview.comment && <p className="text-gray-600 text-sm">{myReview.comment}</p>}
          </div>
        )}
      </div>
    </main>
  )
}

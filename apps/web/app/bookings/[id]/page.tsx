import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import BookingActions from '@/components/bookings/BookingActions'
import ReviewForm from '@/components/bookings/ReviewForm'
import DisputeForm from '@/components/bookings/DisputeForm'
import Link from 'next/link'

export const metadata = { title: 'Booking' }

const ESCROW_LABEL: Record<string, string> = {
  pending: 'Awaiting payment',
  held: 'In escrow',
  released: 'Payment released',
  refunded: 'Refunded',
}

const STATUS_COLOR: Record<string, string> = {
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  tasker_done: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

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

  const task = booking.tasks as { id: string; title: string; status: string; task_type?: string; display_area?: string } | null
  const posterProfile = (booking as Record<string, unknown>)['profiles!poster_id'] as { name: string } | null
  const taskerProfile = (booking as Record<string, unknown>)['profiles!tasker_id'] as { name: string } | null

  const revieweeId = isPoster ? booking.tasker_id : booking.poster_id
  const revieweeName = isPoster ? (taskerProfile?.name ?? 'Tasker') : (posterProfile?.name ?? 'Poster')

  // Fetch existing dispute
  const { data: existingDispute } = await supabase
    .from('disputes')
    .select('id, status')
    .eq('booking_id', id)
    .maybeSingle()

  // Check if this user has already reviewed
  const { data: myReview } = await supabase
    .from('reviews')
    .select('id, rating, comment')
    .eq('booking_id', id)
    .eq('reviewer_id', user.id)
    .maybeSingle()

  const canReview = booking.escrow_state === 'released'

  const fmtRs = (p: number | null | undefined) =>
    p != null ? `₹${Math.round(p / 100).toLocaleString('en-IN')}` : '—'

  const posterFeeTotal = (booking.poster_fee_paise ?? 0) + (booking.gst_poster_paise ?? 0)

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white px-4 py-4">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-700 transition-colors">
            ← Dashboard
          </Link>
          <span className="text-gray-200">/</span>
          <span className="font-semibold text-gray-900 truncate">{task?.title ?? 'Booking'}</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">
        {/* Status card */}
        <div className="rounded-2xl bg-white shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{task?.title}</h1>
              {(task?.display_area || task?.task_type) && (
                <p className="text-sm text-gray-500 mt-1">
                  {[task.display_area, task.task_type].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            {task?.status && (
              <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize flex-shrink-0 ${STATUS_COLOR[task.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {task.status.replace('_', ' ')}
              </span>
            )}
          </div>

          <div className="rounded-xl bg-gray-50 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-600">Escrow status</span>
            <span className={`text-sm font-bold ${
              booking.escrow_state === 'released' ? 'text-green-700'
              : booking.escrow_state === 'held' ? 'text-blue-700'
              : 'text-gray-700'
            }`}>
              {ESCROW_LABEL[booking.escrow_state ?? ''] ?? booking.escrow_state}
            </span>
          </div>
        </div>

        {/* Fee breakdown */}
        <div className="rounded-2xl bg-white shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Payment breakdown</h2>
          <dl className="space-y-2.5">
            <Row label="Task amount" value={fmtRs(booking.amount_paise)} />
            {isPoster && (
              <Row label="Platform fee (incl. GST)" value={fmtRs(posterFeeTotal)} muted />
            )}
            {isTasker && (
              <Row label="Platform fee (incl. GST)" value={fmtRs(booking.tasker_fee_paise)} muted />
            )}
            <div className="border-t border-gray-100 pt-2.5">
              {isPoster
                ? <Row label="Total charged" value={fmtRs((booking.amount_paise ?? 0) + posterFeeTotal)} bold />
                : <Row label="Your payout" value={fmtRs(booking.tasker_payout_paise)} bold />
              }
            </div>
          </dl>
        </div>

        {/* Parties */}
        <div className="rounded-2xl bg-white shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Parties</h2>
          <div className="flex gap-4">
            <PartyCard label="Poster" name={posterProfile?.name ?? '—'} isYou={isPoster} />
            <PartyCard label="Tasker" name={taskerProfile?.name ?? '—'} isYou={isTasker} />
          </div>
        </div>

        {/* Dispute section */}
        {isPoster && booking.escrow_state === 'held' && (task?.status === 'in_progress' || task?.status === 'tasker_done') && (
          existingDispute ? (
            <div className="rounded-2xl bg-orange-50 border border-orange-200 p-5 text-center">
              <p className="font-bold text-orange-800">⚠️ Dispute in review</p>
              <p className="text-sm text-orange-600 mt-1">Our team is reviewing this dispute. Payment is on hold.</p>
            </div>
          ) : (
            <DisputeForm bookingId={booking.id} />
          )
        )}

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
          <Link
            href={`/tasks/${booking.task_id}/chat`}
            className="block rounded-2xl border-2 border-brand-600 p-4 text-center font-semibold text-brand-600 hover:bg-brand-50"
          >
            Open chat
          </Link>
        )}

        {/* Review section */}
        {canReview && !myReview && (
          <ReviewForm bookingId={id} revieweeId={revieweeId} revieweeName={revieweeName} />
        )}

        {canReview && myReview && (
          <div className="rounded-2xl bg-white shadow-sm p-6">
            <p className="font-semibold text-gray-900 mb-2">Your review</p>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(s => (
                <span key={s} className={s <= myReview.rating ? 'text-yellow-400 text-xl' : 'text-gray-300 text-xl'}>★</span>
              ))}
            </div>
            {myReview.comment && <p className="text-gray-600 text-sm">{myReview.comment}</p>}
          </div>
        )}

        {!canReview && (
          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5 text-center text-sm text-gray-500">
            Reviews are available once the booking is completed and payment is released.
          </div>
        )}
      </div>
    </main>
  )
}

function Row({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <dt className={muted ? 'text-gray-400' : 'text-gray-600'}>{label}</dt>
      <dd className={bold ? 'font-black text-gray-900' : muted ? 'text-gray-400' : 'text-gray-900'}>{value}</dd>
    </div>
  )
}

function PartyCard({ label, name, isYou }: { label: string; name: string; isYou: boolean }) {
  return (
    <div className="flex-1 rounded-xl bg-gray-50 p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="font-bold text-gray-900">{name}</p>
      {isYou && <p className="text-xs text-amber-600 font-semibold mt-0.5">You</p>}
    </div>
  )
}

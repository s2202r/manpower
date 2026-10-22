import Link from 'next/link'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function PayoutDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ msg?: string }>
}) {
  await requireAdmin()
  const supabase = createAdminClient()
  const { id } = await params
  const { msg } = await searchParams

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, amount_paise, escrow_state, created_at, tasks!task_id(title, id), profiles!tasker_id(id, name, email)')
    .eq('id', id)
    .single()

  if (!booking || booking.escrow_state !== 'released') notFound()

  const { data: existingPayout } = await supabase
    .from('payouts')
    .select('*')
    .eq('booking_id', id)
    .maybeSingle()

  const tasker = booking.profiles as unknown as { id: string; name: string; email: string } | null
  const task = booking.tasks as unknown as { title: string; id: string } | null
  const fmtRs = (p: number) => `₹${Math.round(p / 100).toLocaleString('en-IN')}`
  const STATUS_C: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  }

  return (
    <div className="p-8 max-w-lg">
      <Link href="/payouts" className="text-sm text-gray-400 hover:text-gray-700 mb-6 inline-block">← Back to payouts</Link>

      {msg === 'initiated' && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 mb-5 text-sm text-green-700 font-medium">Payout initiated and recorded.</div>
      )}
      {msg === 'error' && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-5 text-sm text-red-700 font-medium">Failed to record payout. Please try again.</div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-4">
        <h1 className="text-xl font-bold mb-1">{task?.title ?? 'Booking'}</h1>
        <p className="text-3xl font-black text-amber-600 mt-2">{fmtRs(booking.amount_paise as number)}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Tasker</h2>
        <p className="font-bold text-gray-900">{tasker?.name ?? '—'}</p>
        <p className="text-sm text-gray-500">{tasker?.email}</p>
      </div>

      {existingPayout ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold mb-3">Payout status</h2>
          <span className={`rounded-full px-3 py-1.5 text-sm font-bold capitalize ${STATUS_C[existingPayout.status as string] ?? ''}`}>{existingPayout.status as string}</span>
          {existingPayout.provider_ref && <p className="text-sm text-gray-500 mt-2">Ref: {existingPayout.provider_ref as string}</p>}
          {existingPayout.notes && <p className="text-sm text-gray-500 mt-1">{existingPayout.notes as string}</p>}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold mb-4">Record payout</h2>
          <p className="text-sm text-gray-500 mb-4">Initiate the transfer outside this system (Razorpay Payout API / NEFT), then record the reference here to mark it done.</p>
          <form action={`/api/admin/payouts/${id}/initiate`} method="POST" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Provider reference (UTR / transfer ID)</label>
              <input
                name="provider_ref"
                required
                placeholder="e.g. UTR123456789"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Any additional notes"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <button type="submit" className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white py-3 text-sm font-bold transition-colors">
              Record payout
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

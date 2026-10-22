import Link from 'next/link'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = { title: 'Payouts — Admin' }

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireAdmin()
  const supabase = createAdminClient()
  const { status = 'pending' } = await searchParams

  const [{ data: releasedBookings }, { data: existingPayouts }] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, amount_paise, created_at, tasks!task_id(title), profiles!tasker_id(id, name, email)')
      .eq('escrow_state', 'released')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('payouts')
      .select('booking_id, status, completed_at, provider_ref')
      .in('status', ['pending', 'processing', 'completed']),
  ])

  const paidBookingIds = new Set((existingPayouts ?? []).map(p => p.booking_id))
  const needsPayout = (releasedBookings ?? []).filter(b => !paidBookingIds.has(b.id))
  const fmtRs = (p: number) => `₹${Math.round(p / 100).toLocaleString('en-IN')}`

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Payouts</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/payouts" className={`px-3 py-1.5 rounded-lg font-medium ${status === 'pending' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Needs payout</Link>
          <Link href="/admin/payouts?status=history" className={`px-3 py-1.5 rounded-lg font-medium ${status === 'history' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>History</Link>
        </div>
      </div>

      {status === 'pending' ? (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {needsPayout.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">All payouts up to date ✅</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Task</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Tasker</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {needsPayout.map(b => {
                  const tasker = b.profiles as unknown as { id: string; name: string; email: string } | null
                  const task = b.tasks as unknown as { title: string } | null
                  return (
                    <tr key={b.id} className="hover:bg-amber-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 max-w-xs truncate">{task?.title ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700">{tasker?.name ?? '—'}</p>
                        <p className="text-xs text-gray-400">{tasker?.email}</p>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-900">{fmtRs(b.amount_paise as number)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/payouts/${b.id}`} className="text-sm font-semibold text-amber-600 hover:text-amber-800">
                          Pay out →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <PayoutHistory existingPayouts={existingPayouts ?? []} releasedBookings={releasedBookings ?? []} fmtRs={fmtRs} />
      )}
    </div>
  )
}

function PayoutHistory({ existingPayouts, releasedBookings, fmtRs }: {
  existingPayouts: Array<{ booking_id: string; status: string; completed_at: string | null; provider_ref: string | null }>
  releasedBookings: Array<{ id: string; amount_paise: unknown; tasks: unknown; profiles: unknown }>
  fmtRs: (p: number) => string
}) {
  const bookingMap = new Map(releasedBookings.map(b => [b.id, b]))
  const STATUS_C: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {existingPayouts.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-gray-400">No payout history yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Booking</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Ref</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {existingPayouts.map(p => {
              const b = bookingMap.get(p.booking_id)
              const task = b?.tasks as unknown as { title: string } | null
              return (
                <tr key={p.booking_id}>
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{task?.title ?? p.booking_id.slice(0, 8)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_C[p.status] ?? ''}`}>{p.status}</span></td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.provider_ref ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{p.completed_at ? new Date(p.completed_at).toLocaleDateString('en-IN') : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

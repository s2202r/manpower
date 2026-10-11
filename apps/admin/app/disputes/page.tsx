import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase'
import Link from 'next/link'

export const metadata = { title: 'Disputes — Taim Admin' }

export default async function DisputesPage() {
  await requireAdmin()
  const db = createAdminClient()

  const { data: disputes } = await db
    .from('disputes')
    .select('id, reason, status, created_at, raised_by, bookings(id, task_id, amount_paise), profiles(name)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
      </div>

      <div className="space-y-4">
        {(disputes ?? []).map(d => {
          const booking = d.bookings as unknown as { id: string; task_id: string; amount_paise: number } | null
          const profile = d.profiles as unknown as { name: string } | null
          return (
            <div key={d.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Raised by: {profile?.name ?? d.raised_by}</p>
                  <p className="mt-1 text-sm text-gray-600">{d.reason}</p>
                  {booking && (
                    <p className="mt-1 text-xs text-gray-500">
                      Booking: <Link href={`/bookings/${booking.id}`} className="text-blue-600 hover:underline">{booking.id.slice(0,8)}…</Link>
                      {' '}· ₹{Math.round(booking.amount_paise / 100).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    d.status === 'open' ? 'bg-red-100 text-red-700'
                    : d.status === 'investigating' ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                  }`}>{d.status}</span>
                  <p className="mt-1 text-xs text-gray-400">{new Date(d.created_at as string).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Link href={`/disputes/${d.id}`}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  View details
                </Link>
              </div>
            </div>
          )
        })}
        {(disputes ?? []).length === 0 && (
          <p className="rounded-2xl bg-white p-8 text-center text-gray-500">No open disputes.</p>
        )}
      </div>
    </main>
  )
}

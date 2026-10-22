import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/require-admin'
import Link from 'next/link'

export const metadata = { title: 'Disputes — Admin' }

export default async function DisputesPage() {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: disputes } = await supabase
    .from('disputes')
    .select(`
      id, reason, status, created_at,
      booking:bookings!booking_id(id, amount_paise,
        task:tasks!task_id(title),
        poster:profiles!poster_id(name),
        tasker:profiles!tasker_id(name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  const STATUS_COLOR: Record<string, string> = {
    open: 'bg-red-100 text-red-700',
    resolved_poster: 'bg-green-100 text-green-700',
    resolved_tasker: 'bg-blue-100 text-blue-700',
    resolved_refund: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Disputes</h1>
      {!disputes || disputes.length === 0 ? (
        <p className="text-gray-500">No disputes.</p>
      ) : (
        <div className="space-y-3">
          {disputes.map(d => {
            const booking = d.booking as unknown as { id: string; amount_paise: number; task: { title: string } | null; poster: { name: string } | null; tasker: { name: string } | null } | null
            return (
              <div key={d.id} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{booking?.task?.title ?? 'Task'}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Poster: {booking?.poster?.name} · Tasker: {booking?.tasker?.name} · ₹{Math.round((booking?.amount_paise ?? 0) / 100).toLocaleString('en-IN')}
                    </p>
                    <p className="mt-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 italic">"{d.reason}"</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(d.created_at).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${STATUS_COLOR[d.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {d.status.replace('_', ' ')}
                    </span>
                    {d.status === 'open' && (
                      <Link
                        href={`/admin/disputes/${d.id}`}
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors"
                      >
                        Resolve
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

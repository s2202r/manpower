import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase'
import Link from 'next/link'

export const metadata = { title: 'Webhooks — Taim Admin' }

export default async function WebhooksPage() {
  await requireAdmin()
  const db = createAdminClient()

  const { data: events } = await db
    .from('webhook_events')
    .select('id, provider, event_type, idempotency_key, processed_at, error, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Webhook Events</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 text-xs text-gray-500 uppercase">
            <tr>
              {['Provider', 'Event', 'Status', 'Time'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 font-mono text-xs">
            {(events ?? []).map(e => (
              <tr key={e.id} className={e.error ? 'bg-red-50' : ''}>
                <td className="px-4 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-white text-xs ${
                    e.provider === 'razorpay' ? 'bg-blue-600' : 'bg-green-600'
                  }`}>{e.provider as string}</span>
                </td>
                <td className="px-4 py-2 text-gray-700">{e.event_type as string}</td>
                <td className="px-4 py-2">
                  {e.error
                    ? <span className="text-red-600">Error: {e.error as string}</span>
                    : e.processed_at
                    ? <span className="text-green-600">Processed</span>
                    : <span className="text-yellow-600">Pending</span>}
                </td>
                <td className="px-4 py-2 text-gray-400">
                  {new Date(e.created_at as string).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}

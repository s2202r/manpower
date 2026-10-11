import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase'
import Link from 'next/link'

export const metadata = { title: 'Tasks — Taim Admin' }

export default async function AdminTasksPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  await requireAdmin()
  const { status, page } = await searchParams
  const db = createAdminClient()
  const pageNum = Math.max(1, Number(page ?? 1))
  const pageSize = 50
  const offset = (pageNum - 1) * pageSize

  let query = db.from('tasks')
    .select('id, title, status, task_type, budget_paise, offer_count, created_at, poster_id, profiles(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (status) query = query.eq('status', status)

  const { data: tasks, count } = await query
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  const STATUSES = ['open','assigned','in_progress','tasker_done','completed','cancelled','disputed','expired']

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/tasks" className={`rounded-full px-3 py-1 text-xs font-medium ${!status ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>All</Link>
        {STATUSES.map(s => (
          <Link key={s} href={`?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${status === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
            {s}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 text-xs text-gray-500 uppercase">
            <tr>
              {['Title', 'Poster', 'Status', 'Budget', 'Offers', 'Created'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(tasks ?? []).map(t => {
              const poster = t.profiles as unknown as { name: string } | null
              return (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{t.title as string}</td>
                  <td className="px-4 py-3 text-gray-600">{poster?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      t.status === 'open' ? 'bg-green-100 text-green-700'
                      : t.status === 'completed' ? 'bg-blue-100 text-blue-700'
                      : t.status === 'disputed' ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                    }`}>{t.status as string}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">₹{Math.round((t.budget_paise as number) / 100).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-gray-600">{t.offer_count as number}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(t.created_at as string).toLocaleDateString('en-IN')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex gap-2 justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <Link key={p} href={`?page=${p}${status ? `&status=${status}` : ''}`}
              className={`rounded-lg px-3 py-1 text-sm ${p === pageNum ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}

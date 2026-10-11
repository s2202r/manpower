import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase'
import Link from 'next/link'

export const metadata = { title: 'Users — Taim Admin' }

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireAdmin()
  const { q, page } = await searchParams
  const db = createAdminClient()
  const pageNum = Math.max(1, Number(page ?? 1))
  const pageSize = 50
  const offset = (pageNum - 1) * pageSize

  let query = db.from('profiles')
    .select('id, email, name, roles, verification_tier, rating_avg, rating_count, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (q) query = query.ilike('name', `%${q}%`)

  const { data: users, count } = await query
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
      </div>

      <form className="mb-6">
        <input name="q" defaultValue={q} placeholder="Search by name…"
          className="w-full max-w-sm rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
      </form>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 text-xs text-gray-500 uppercase">
            <tr>
              {['Name', 'Email', 'Roles', 'Tier', 'Rating', 'Joined'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(users ?? []).map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/users/${u.id}`} className="text-blue-600 hover:underline">{u.name || '—'}</Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  {(u.roles as string[]).map(r => (
                    <span key={r} className="mr-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{r}</span>
                  ))}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    u.verification_tier === 'kyc' ? 'bg-green-100 text-green-700'
                    : u.verification_tier === 'email' ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                  }`}>{u.verification_tier ?? 'none'}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {u.rating_avg ? `${(u.rating_avg as number).toFixed(1)} (${u.rating_count})` : '—'}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(u.created_at as string).toLocaleDateString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex gap-2 justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <Link key={p} href={`?page=${p}${q ? `&q=${q}` : ''}`}
              className={`rounded-lg px-3 py-1 text-sm ${p === pageNum ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}

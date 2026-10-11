import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase'
import Link from 'next/link'

export const metadata = { title: 'KYC — Taim Admin' }

export default async function KycPage() {
  await requireAdmin()
  const db = createAdminClient()

  const { data: requests } = await db
    .from('kyc_requests')
    .select('id, user_id, document_type, status, submitted_at, reviewed_at, profiles(name, email)')
    .order('submitted_at', { ascending: true })
    .limit(100)

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">KYC Requests</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 text-xs text-gray-500 uppercase">
            <tr>
              {['User', 'Document', 'Status', 'Submitted', 'Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(requests ?? []).map(r => {
              const profile = r.profiles as unknown as { name: string; email: string } | null
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{profile?.name ?? '—'}</p>
                    <p className="text-xs text-gray-500">{profile?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{(r.document_type as string).replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      r.status === 'approved' ? 'bg-green-100 text-green-700'
                      : r.status === 'rejected' ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                    }`}>{r.status as string}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(r.submitted_at as string).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/kyc/${r.id}`}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      Review
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </main>
  )
}

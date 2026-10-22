import { createAdminClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/require-admin'
import Link from 'next/link'

export const metadata = { title: 'KYC Queue' }

export default async function KycQueuePage() {
  await requireAdmin()
  const supabase = createAdminClient()

  // Users with email tier (need KYC review) - most recent first
  const { data: pending } = await supabase
    .from('profiles')
    .select('id, name, email, verification_tier, created_at, roles, display_area')
    .in('verification_tier', ['email', 'none'])
    .order('created_at', { ascending: false })
    .limit(50)

  // Recently KYC-approved
  const { data: approved } = await supabase
    .from('profiles')
    .select('id, name, email, verification_tier, created_at')
    .eq('verification_tier', 'kyc')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">KYC Queue</h1>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          Pending verification <span className="text-sm font-normal text-gray-400">({pending?.length ?? 0})</span>
        </h2>
        {!pending || pending.length === 0 ? (
          <p className="text-gray-400">No pending users.</p>
        ) : (
          <div className="space-y-2">
            {pending.map(u => (
              <div key={u.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4">
                <div>
                  <p className="font-semibold text-gray-900">{u.name ?? '(no name)'}</p>
                  <p className="text-sm text-gray-500">{u.email} · {(u.roles as string[])?.join(', ')} · {u.display_area ?? '—'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(u.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${u.verification_tier === 'email' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.verification_tier === 'email' ? 'Email ✓' : 'None'}
                  </span>
                  <Link
                    href={`/kyc/${u.id}`}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors"
                  >
                    Review →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Recently approved</h2>
        {!approved || approved.length === 0 ? (
          <p className="text-gray-400">None yet.</p>
        ) : (
          <div className="space-y-2">
            {approved.map(u => (
              <div key={u.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-5 py-3">
                <div>
                  <p className="font-medium text-gray-700">{u.name}</p>
                  <p className="text-sm text-gray-400">{u.email}</p>
                </div>
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">KYC ✓</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

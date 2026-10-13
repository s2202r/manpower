import { createAdminClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/require-admin'
import Link from 'next/link'

export const metadata = { title: 'Users' }

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  await requireAdmin()
  const { q } = await searchParams
  const supabase = createAdminClient()

  let query = supabase
    .from('profiles')
    .select('id, name, email, roles, verification_tier, rating_avg, rating_count, created_at, display_area')
    .order('created_at', { ascending: false })
    .limit(50)

  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data: users } = await query

  const TIER_COLOR: Record<string, string> = {
    kyc: 'bg-blue-100 text-blue-700',
    email: 'bg-yellow-100 text-yellow-700',
    none: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <form>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or email…"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm w-64 focus:border-amber-400 focus:outline-none"
          />
        </form>
      </div>

      <div className="space-y-2">
        {!users || users.length === 0 ? (
          <p className="text-gray-400">No users found.</p>
        ) : users.map(u => (
          <div key={u.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3.5">
            <div>
              <p className="font-semibold text-gray-900">{u.name ?? '(no name)'}</p>
              <p className="text-sm text-gray-500">{u.email} · {(u.roles as string[])?.join(', ')} · {u.display_area ?? '—'}</p>
              {u.rating_count > 0 && (
                <p className="text-xs text-amber-600 mt-0.5">⭐ {(u.rating_avg as number).toFixed(1)} ({u.rating_count})</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${TIER_COLOR[u.verification_tier as string] ?? TIER_COLOR.none}`}>
                {u.verification_tier === 'kyc' ? 'KYC ✓' : u.verification_tier === 'email' ? 'Email ✓' : 'None'}
              </span>
              {u.verification_tier !== 'kyc' && (
                <Link href={`/kyc/${u.id}`} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors">
                  Review
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

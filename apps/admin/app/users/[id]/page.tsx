import Link from 'next/link'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function AdminUserDetailPage({
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, roles, verification_tier, rating_avg, rating_count, referral_count, banned, banned_at, banned_reason, created_at')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const [{ count: taskCount }, { count: bookingCount }] = await Promise.all([
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('poster_id', id),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).or(`poster_id.eq.${id},tasker_id.eq.${id}`),
  ])

  const isBanned = profile.banned as boolean

  return (
    <div className="p-8 max-w-lg">
      <Link href="/users" className="text-sm text-gray-400 hover:text-gray-700 mb-6 inline-block">← Back to users</Link>

      {msg === 'banned' && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-5 text-sm text-red-700 font-medium">User banned.</div>}
      {msg === 'unbanned' && <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 mb-5 text-sm text-green-700 font-medium">User unbanned.</div>}
      {msg === 'approved' && <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 mb-5 text-sm text-green-700 font-medium">KYC approved.</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{profile.name as string ?? '—'}</h1>
            <p className="text-sm text-gray-500">{profile.email as string}</p>
          </div>
          {isBanned && <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-sm font-bold">Banned</span>}
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5">
          <div><p className="text-xs text-gray-400">Tier</p><p className="font-semibold capitalize">{profile.verification_tier as string}</p></div>
          <div><p className="text-xs text-gray-400">Tasks</p><p className="font-semibold">{taskCount ?? 0}</p></div>
          <div><p className="text-xs text-gray-400">Bookings</p><p className="font-semibold">{bookingCount ?? 0}</p></div>
          <div><p className="text-xs text-gray-400">Rating</p><p className="font-semibold">{profile.rating_avg ? `⭐ ${(profile.rating_avg as number).toFixed(1)}` : '—'}</p></div>
          <div><p className="text-xs text-gray-400">Referrals</p><p className="font-semibold">{profile.referral_count ?? 0}</p></div>
          <div><p className="text-xs text-gray-400">Joined</p><p className="font-semibold text-xs">{new Date(profile.created_at as string).toLocaleDateString('en-IN')}</p></div>
        </div>
      </div>

      {isBanned && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-4">
          <p className="text-sm font-semibold text-red-700">Ban reason</p>
          <p className="text-sm text-red-600 mt-1">{profile.banned_reason as string}</p>
          <p className="text-xs text-red-400 mt-1">Since {new Date(profile.banned_at as string).toLocaleDateString('en-IN')}</p>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {isBanned ? (
          <form action={`/api/admin/users/${id}/unban`} method="POST">
            <button className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white py-3 text-sm font-bold transition-colors">
              Unban user
            </button>
          </form>
        ) : (
          <form action={`/api/admin/users/${id}/ban`} method="POST" className="space-y-3">
            <h2 className="font-semibold text-gray-900">Ban user</h2>
            <textarea
              name="reason"
              required
              rows={3}
              placeholder="Reason for ban (visible to admins only)"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <button className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white py-3 text-sm font-bold transition-colors">
              Ban user
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

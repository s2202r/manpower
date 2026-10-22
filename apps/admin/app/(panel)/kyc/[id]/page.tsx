import { createAdminClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/require-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'KYC Review' }

export default async function KycReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ msg?: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const { msg } = await searchParams
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, verification_tier, roles, display_area, bio, rating_avg, rating_count, created_at')
    .eq('id', id)
    .single()

  if (!profile) redirect('/kyc')

  const { count: completedTasks } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('tasker_id', id)
    .eq('escrow_state', 'released')

  return (
    <div className="p-8 max-w-xl">
      <Link href="/kyc" className="text-sm text-gray-400 hover:text-gray-700 mb-6 block">← KYC Queue</Link>
      <h1 className="text-2xl font-bold mb-6">KYC Review</h1>

      {msg && (
        <div className={`rounded-xl px-4 py-3 mb-5 text-sm font-semibold ${msg === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg === 'approved' ? '✅ KYC approved successfully.' : `Error: ${msg}`}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow label="Name" value={profile.name ?? '—'} />
          <InfoRow label="Email" value={profile.email ?? '—'} />
          <InfoRow label="Roles" value={(profile.roles as string[])?.join(', ') ?? '—'} />
          <InfoRow label="Tier" value={profile.verification_tier as string} />
          <InfoRow label="Area" value={profile.display_area as string ?? '—'} />
          <InfoRow label="Tasks done" value={String(completedTasks ?? 0)} />
          <InfoRow label="Rating" value={profile.rating_count ? `${(profile.rating_avg as number).toFixed(1)} ⭐ (${profile.rating_count})` : '—'} />
          <InfoRow label="Joined" value={new Date(profile.created_at as string).toLocaleDateString('en-IN')} />
        </div>
        {profile.bio && (
          <p className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 italic">{profile.bio as string}</p>
        )}
      </div>

      {profile.verification_tier !== 'kyc' && (
        <form action={`/api/admin/kyc/${id}/approve`} method="POST">
          <button
            type="submit"
            className="w-full rounded-xl bg-green-500 py-3 font-bold text-white hover:bg-green-600 transition-colors"
          >
            ✅ Approve KYC
          </button>
        </form>
      )}
      {profile.verification_tier === 'kyc' && (
        <p className="text-center text-sm text-green-600 font-semibold">Already KYC approved.</p>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  )
}

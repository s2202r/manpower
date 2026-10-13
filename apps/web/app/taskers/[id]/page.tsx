import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('name, bio, rating_avg, rating_count, verification_tier')
    .eq('id', id)
    .single()
  if (!data) return { title: 'Tasker Profile' }

  const name = data.name as string ?? 'Tasker'
  const rating = data.rating_count ? ` · ⭐ ${(data.rating_avg as number).toFixed(1)} (${data.rating_count} reviews)` : ''
  const tier = data.verification_tier === 'kyc' ? ' · KYC Verified ✅' : ''
  const desc = `Hire ${name} on Taim${rating}${tier}.${data.bio ? ' ' + (data.bio as string).slice(0, 100) : ''}`

  return {
    title: `${name} — Taim Tasker`,
    description: desc,
    openGraph: { title: `${name} — Taim`, description: desc, type: 'profile' },
  }
}

export default async function TaskerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, bio, verification_tier, rating_avg, rating_count, roles, created_at')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  // Only show tasker profiles
  const roles = profile.roles as string[] ?? []
  if (!roles.includes('tasker') && !roles.includes('admin')) notFound()

  // Completed tasks count
  const { count: completedCount } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('tasker_id', id)
    .eq('escrow_state', 'released')

  // Last 10 reviews about this tasker
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, body, created_at, reviewer:profiles!reviewer_id(name)')
    .eq('reviewee_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const tier = profile.verification_tier as string ?? 'none'
  const tierLabel = tier === 'kyc' ? '✅ KYC Verified' : tier === 'email' ? '📧 Email Verified' : '⚪ Unverified'
  const tierColor = tier === 'kyc' ? 'text-blue-700 bg-blue-50' : tier === 'email' ? 'text-gray-600 bg-gray-50' : 'text-gray-400 bg-gray-50'

  const memberSince = new Date(profile.created_at as string).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <Link href="/tasks" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← Browse tasks</Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">
        {/* Profile card */}
        <div className="rounded-2xl bg-white shadow-sm p-6">
          <div className="flex items-start gap-4">
            {/* Avatar placeholder */}
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center text-2xl font-black text-amber-600 flex-shrink-0">
              {(profile.name as string)?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black text-gray-900">{profile.name}</h1>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold mt-2 ${tierColor}`}>
                {tierLabel}
              </span>
              {profile.bio && (
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{profile.bio as string}</p>
              )}
              <p className="mt-2 text-xs text-gray-400">Member since {memberSince}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-3 divide-x divide-gray-100 rounded-xl bg-gray-50 overflow-hidden">
            <StatCell label="Tasks done" value={completedCount ?? 0} />
            <StatCell label="Rating" value={profile.rating_count ? `${(profile.rating_avg as number).toFixed(1)} ⭐` : '—'} />
            <StatCell label="Reviews" value={profile.rating_count ?? 0} />
          </div>
        </div>

        {/* Reviews */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Reviews {reviews && reviews.length > 0 && <span className="text-gray-400 font-normal text-base">({reviews.length})</span>}
          </h2>
          {(!reviews || reviews.length === 0) ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-gray-500">
              <p className="text-lg font-semibold">No reviews yet</p>
              <p className="text-sm mt-1">This Tasker is new — be the first to hire them!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map(review => {
                const reviewer = review.reviewer as unknown as { name: string } | null
                return (
                  <div key={review.id} className="rounded-2xl bg-white shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{reviewer?.name ?? 'Anonymous'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(review.created_at as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-amber-500 font-bold text-sm flex-shrink-0">
                        {'⭐'.repeat(review.rating as number)}{' '}
                        <span className="text-gray-600">{review.rating}/5</span>
                      </div>
                    </div>
                    {review.body && (
                      <p className="text-sm text-gray-600 leading-relaxed">{review.body as string}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 text-center">
      <p className="text-xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

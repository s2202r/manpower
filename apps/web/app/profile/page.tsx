import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'My profile' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, photo_url, roles, verification_tier, rating_avg, rating_count, preferred_locale, created_at')
    .eq('id', user.id)
    .single()

  const { data: kycRequest } = await supabase
    .from('kyc_requests')
    .select('id, status, submitted_at')
    .eq('user_id', user.id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .single()

  const tier = profile?.verification_tier ?? 'none'

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-xl px-4 space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-2xl font-bold">
              {profile?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{profile?.name}</h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Verification</p>
              <p className={`font-semibold capitalize ${
                tier === 'kyc' ? 'text-green-600' : tier === 'email' ? 'text-blue-600' : 'text-gray-600'
              }`}>{tier === 'none' ? 'Not verified' : tier === 'email' ? 'Email verified' : 'KYC verified ✓'}</p>
            </div>
            {profile && (profile.rating_count as number) > 0 && (
              <div>
                <p className="text-gray-500">Rating</p>
                <p className="font-semibold">⭐ {(profile.rating_avg as number).toFixed(1)} ({profile.rating_count as number} reviews)</p>
              </div>
            )}
          </div>
        </div>

        {/* KYC section */}
        {tier !== 'kyc' && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-2">Get KYC verified</h2>
            <p className="text-sm text-gray-600 mb-4">
              KYC verification builds trust with Posters and unlocks higher task budgets.
            </p>
            {kycRequest?.status === 'pending' ? (
              <div className="rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
                KYC under review — submitted {new Date(kycRequest.submitted_at as string).toLocaleDateString('en-IN')}
              </div>
            ) : kycRequest?.status === 'rejected' ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  Previous submission was rejected. Please resubmit with a clearer image.
                </div>
                <Link href="/profile/kyc" className="block rounded-xl bg-brand-600 py-2.5 text-center font-semibold text-white hover:bg-brand-700">
                  Resubmit KYC
                </Link>
              </div>
            ) : (
              <Link href="/profile/kyc" className="block rounded-xl bg-brand-600 py-2.5 text-center font-semibold text-white hover:bg-brand-700">
                Start KYC verification
              </Link>
            )}
          </div>
        )}

        {/* Data rights */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3">Your data rights</h2>
          <div className="space-y-2">
            <Link href="/profile/export" className="block rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
              Download your data
            </Link>
            <Link href="/profile/delete" className="block rounded-xl border border-red-200 px-4 py-3 text-sm text-red-600 hover:bg-red-50">
              Delete my account
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

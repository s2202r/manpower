import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileEditForm from './ProfileEditForm'
import Link from 'next/link'

export const metadata = { title: 'Edit Profile — Taim' }

export default async function ProfileEditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, bio, preferred_locale, display_area, verification_tier, rating_avg, rating_count')
    .eq('id', user.id)
    .single()

  const name = profile?.name as string ?? ''
  const tier = profile?.verification_tier as string ?? 'none'
  const initial = name?.[0]?.toUpperCase() ?? (user.email?.[0]?.toUpperCase() ?? '?')

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white px-4 py-3">
        <div className="mx-auto max-w-lg flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← Back
          </Link>
          <span className="text-gray-200 mx-1">/</span>
          <span className="font-semibold text-gray-900 text-sm">Edit profile</span>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
        {/* Avatar hero card */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-brand-600 p-6 text-white shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl font-black text-white shadow-inner">
              {initial}
            </div>
            <div>
              <p className="text-lg font-bold">{name || 'Your name'}</p>
              <p className="text-sm text-white/80">{user.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  tier === 'kyc' ? 'bg-green-400/20 text-green-100'
                  : tier === 'email' ? 'bg-blue-300/20 text-blue-100'
                  : 'bg-white/10 text-white/60'
                }`}>
                  {tier === 'kyc' ? '✅ KYC verified' : tier === 'email' ? '📧 Email verified' : '⚪ Not verified'}
                </span>
                {(profile?.rating_count as number) > 0 && (
                  <span className="text-xs text-white/70">⭐ {(profile?.rating_avg as number)?.toFixed(1)}</span>
                )}
              </div>
            </div>
          </div>
          {tier !== 'kyc' && (
            <Link href="/profile/kyc"
              className="mt-4 flex items-center justify-between rounded-xl bg-white/15 hover:bg-white/25 px-4 py-2.5 text-sm font-semibold transition-colors">
              <span>Complete KYC to unlock lower fees</span>
              <span className="text-white/70">→</span>
            </Link>
          )}
        </div>

        {/* Form */}
        <ProfileEditForm
          initialName={name}
          initialBio={profile?.bio as string ?? ''}
          initialLocale={profile?.preferred_locale as string ?? 'en'}
          initialArea={profile?.display_area as string ?? ''}
          tier={tier}
          rating={profile?.rating_avg as number ?? null}
          ratingCount={profile?.rating_count as number ?? 0}
          email={user.email ?? ''}
        />

        <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
          <Link href="/profile/privacy" className="hover:text-gray-600 transition-colors">Privacy & data</Link>
          <span>·</span>
          <Link href="/profile/kyc" className="hover:text-gray-600 transition-colors">Verify identity</Link>
        </div>
      </div>
    </main>
  )
}

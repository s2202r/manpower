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

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white px-4 py-4">
        <div className="mx-auto max-w-lg flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-700 transition-colors text-sm">← Dashboard</Link>
          <span className="text-gray-200">/</span>
          <span className="font-semibold text-gray-900">Edit profile</span>
        </div>
      </header>
      <div className="mx-auto max-w-lg px-4 py-8">
        <ProfileEditForm
          initialName={profile?.name as string ?? ''}
          initialBio={profile?.bio as string ?? ''}
          initialLocale={profile?.preferred_locale as string ?? 'en'}
          initialArea={profile?.display_area as string ?? ''}
          tier={profile?.verification_tier as string ?? 'none'}
          rating={profile?.rating_avg as number ?? null}
          ratingCount={profile?.rating_count as number ?? 0}
          email={user.email ?? ''}
        />
        <div className="text-center mt-4">
          <Link href="/profile/privacy" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Privacy & data settings →
          </Link>
        </div>
      </div>
    </main>
  )
}

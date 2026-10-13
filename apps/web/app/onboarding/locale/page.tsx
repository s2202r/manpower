import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LocalePickerClient from './LocalePickerClient'

export const metadata = { title: 'Choose your language — Taim' }

export default async function OnboardingLocalePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <svg width="28" height="32" viewBox="0 0 28 32" fill="none" aria-hidden="true">
              <path d="M16 2L4 18h9l-1 12 15-18h-9l2-10z" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" strokeLinejoin="round" />
            </svg>
            <span className="text-2xl font-black tracking-tight text-gray-900">taim<span className="text-amber-500">.</span></span>
          </div>
          <h1 className="text-3xl font-black text-gray-900">Choose your language</h1>
          <p className="mt-2 text-gray-500">Taim works in 12 Indian languages.</p>
        </div>
        <LocalePickerClient />
      </div>
    </main>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RolePickerClient from './RolePickerClient'

export const metadata = { title: 'Choose your role — Taim' }

export default async function OnboardingRolePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  // Skip if already has a role
  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  const roles = (profile?.roles as string[]) ?? []
  if (roles.length > 0) redirect('/onboarding/locale')

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
          <h1 className="text-3xl font-black text-gray-900">How will you use Taim?</h1>
          <p className="mt-2 text-gray-500">You can always change this later.</p>
        </div>
        <RolePickerClient />
      </div>
    </main>
  )
}

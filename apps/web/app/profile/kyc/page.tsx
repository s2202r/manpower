import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KycForm from '@/components/profile/KycForm'

export const metadata = { title: 'KYC Verification' }

export default async function KycPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('verification_tier')
    .eq('id', user.id)
    .single()

  if (profile?.verification_tier === 'kyc') redirect('/profile')

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">KYC Verification</h1>
        <p className="mb-6 text-sm text-gray-600">
          Upload a government-issued ID (Aadhaar, PAN, Voter ID, Passport, or Driving Licence).
          Your document is stored securely and only reviewed by our compliance team.
        </p>
        <KycForm userId={user.id} />
      </div>
    </main>
  )
}

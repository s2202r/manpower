import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('name').eq('referral_code', code.toUpperCase()).single()
  const name = (data?.name as string) ?? 'Someone'
  return {
    title: `${name} invited you to Taim`,
    description: "Join India's task marketplace. Post tasks or earn by completing them.",
    openGraph: { title: `${name} invited you to Taim`, description: "Join India's task marketplace." },
  }
}

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()

  const { data: referrer } = await supabase
    .from('profiles')
    .select('name, referral_count, verification_tier')
    .eq('referral_code', code.toUpperCase())
    .single()

  const name = (referrer?.name as string) ?? 'A Taim member'
  const count = (referrer?.referral_count as number) ?? 0

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-white flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="text-6xl mb-6">🤝</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">
          {name} invited you to Taim
        </h1>
        <p className="text-gray-500 mb-2">India&apos;s task marketplace — post any task or earn by completing them.</p>
        {count > 0 && (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-full px-4 py-1.5 inline-block mb-6">
            {name} has referred {count} {count === 1 ? 'person' : 'people'} 🎉
          </p>
        )}
        <div className="space-y-3 mt-6">
          <Link
            href={`/auth/sign-up?ref=${code.toUpperCase()}`}
            className="block w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white py-4 font-bold text-lg transition-colors"
          >
            Join Taim
          </Link>
          <Link
            href="/auth/sign-in"
            className="block w-full rounded-xl border border-gray-200 text-gray-600 py-3 font-medium hover:bg-gray-50 transition-colors"
          >
            Already have an account? Sign in
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-6">
          Your referral code: <span className="font-mono font-bold">{code.toUpperCase()}</span>
        </p>
      </div>
    </main>
  )
}

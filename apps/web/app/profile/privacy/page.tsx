import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PrivacyActions from './PrivacyActions'
import Link from 'next/link'

export const metadata = { title: 'Privacy & Data — Taim' }

export default async function PrivacyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white px-4 py-4">
        <div className="mx-auto max-w-lg flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← Dashboard</Link>
          <span className="text-gray-200">/</span>
          <span className="font-semibold text-gray-900">Privacy & Data</span>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-8 space-y-5">
        <div className="rounded-2xl bg-white shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-1">Your data</h2>
          <p className="text-sm text-gray-500 mb-4">
            Under the Digital Personal Data Protection Act 2023, you have the right to access and erase your personal data.
          </p>

          <a
            href="/api/profile/export"
            download
            className="block w-full rounded-xl bg-gray-100 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors mb-3"
          >
            ⬇️ Download my data (JSON)
          </a>
        </div>

        <div className="rounded-2xl bg-white shadow-sm p-6">
          <h2 className="font-bold text-red-700 mb-1">Delete account</h2>
          <p className="text-sm text-gray-500 mb-4">
            Permanently anonymises your profile. Your task and booking records are kept for legal and accounting purposes but all personal details are removed. This cannot be undone.
          </p>
          <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3 mb-4">
            ⚠️ Cannot delete while a payment is held in escrow.
          </p>
          <PrivacyActions name={profile?.name as string ?? user.email ?? 'user'} />
        </div>
      </div>
    </main>
  )
}

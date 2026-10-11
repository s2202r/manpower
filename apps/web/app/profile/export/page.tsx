import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Download your data' }

export default async function ExportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm text-center">
        <p className="text-4xl mb-4">📦</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Download your data</h1>
        <p className="text-gray-600 mb-6 text-sm">
          Your export includes your profile, tasks, offers, bookings, reviews and consent records.
          It is provided as a JSON file.
        </p>
        <a href="/api/profile/export"
          className="block rounded-xl bg-brand-600 py-3 font-bold text-white hover:bg-brand-700 mb-3">
          Download JSON export
        </a>
        <Link href="/profile" className="text-sm text-gray-500 hover:text-gray-700">← Back to profile</Link>
      </div>
    </main>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { APP_NAME } from '@taim/config'
import Link from 'next/link'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, roles')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-2xl font-black text-brand-600">{APP_NAME}</span>
          <span className="text-sm text-gray-600">Hi, {profile?.name ?? user.email}</span>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/tasks/new" className="rounded-2xl bg-brand-600 p-6 text-white hover:bg-brand-700">
            <p className="text-2xl font-bold">+ Post a task</p>
            <p className="mt-1 opacity-80">Describe what you need</p>
          </Link>
          <Link href="/tasks" className="rounded-2xl border-2 border-brand-600 p-6 text-brand-600 hover:bg-brand-50">
            <p className="text-2xl font-bold">Browse tasks</p>
            <p className="mt-1 text-gray-600">Find tasks near you</p>
          </Link>
        </div>
      </div>
    </main>
  )
}

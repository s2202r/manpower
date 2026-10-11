import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase'
import Link from 'next/link'

export const metadata = { title: 'Dashboard — Taim Admin' }

export default async function AdminDashboard() {
  await requireAdmin()
  const db = createAdminClient()

  const [
    { count: totalUsers },
    { count: openTasks },
    { count: heldBookings },
    { count: openDisputes },
    { count: pendingKyc },
  ] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }),
    db.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    db.from('bookings').select('id', { count: 'exact', head: true }).eq('escrow_state', 'held'),
    db.from('disputes').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    db.from('kyc_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const stats = [
    { label: 'Total users', value: totalUsers ?? 0, href: '/users', color: 'bg-blue-500' },
    { label: 'Open tasks', value: openTasks ?? 0, href: '/tasks', color: 'bg-green-500' },
    { label: 'Funds in escrow', value: heldBookings ?? 0, href: '/bookings', color: 'bg-amber-500' },
    { label: 'Open disputes', value: openDisputes ?? 0, href: '/disputes', color: 'bg-red-500' },
    { label: 'Pending KYC', value: pendingKyc ?? 0, href: '/kyc', color: 'bg-purple-500' },
  ]

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Taim Admin</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map(s => (
          <Link key={s.href} href={s.href}
            className="rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className={`mb-3 h-3 w-3 rounded-full ${s.color}`} />
            <p className="text-3xl font-bold text-gray-900">{s.value.toLocaleString()}</p>
            <p className="mt-1 text-sm text-gray-500">{s.label}</p>
          </Link>
        ))}
      </div>
      <nav className="mt-10 flex flex-wrap gap-3">
        {['/users', '/tasks', '/bookings', '/disputes', '/kyc', '/webhooks'].map(path => (
          <Link key={path} href={path}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            {path.replace('/', '').charAt(0).toUpperCase() + path.slice(2)}
          </Link>
        ))}
      </nav>
    </main>
  )
}

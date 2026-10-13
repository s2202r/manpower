import { createAdminClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/require-admin'

export const metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboard() {
  await requireAdmin()
  const supabase = createAdminClient()

  const [
    { count: totalUsers },
    { count: kycUsers },
    { count: totalTasks },
    { count: openTasks },
    { count: completedTasks },
    { data: gmvData },
    { count: activeBookings },
    { count: openDisputes },
    { count: totalDisputes },
    { data: recentTasks },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('verification_tier', 'kyc'),
    supabase.from('tasks').select('id', { count: 'exact', head: true }),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('bookings').select('amount_paise').eq('escrow_state', 'released'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('escrow_state', 'held'),
    supabase.from('disputes').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('disputes').select('id', { count: 'exact', head: true }),
    supabase.from('tasks').select('id, title, status, budget_paise, created_at, profiles!poster_id(name)').order('created_at', { ascending: false }).limit(5),
  ])

  const gmv = (gmvData ?? []).reduce((s, b) => s + ((b.amount_paise as number) ?? 0), 0)
  const fmtRs = (p: number) => `₹${Math.round(p / 100).toLocaleString('en-IN')}`

  const STATUS_COLOR: Record<string, string> = {
    open: 'bg-green-100 text-green-700',
    assigned: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-indigo-100 text-indigo-700',
    tasker_done: 'bg-orange-100 text-orange-700',
    completed: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        <StatCard label="Total GMV" value={fmtRs(gmv)} sub="released" color="amber" />
        <StatCard label="Active escrow" value={String(activeBookings ?? 0)} sub="bookings" color="blue" />
        <StatCard label="Open disputes" value={String(openDisputes ?? 0)} sub={`of ${totalDisputes ?? 0} total`} color={openDisputes ? 'red' : 'green'} />
        <StatCard label="Users" value={String(totalUsers ?? 0)} sub={`${kycUsers ?? 0} KYC verified`} color="gray" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        <StatCard label="Total tasks" value={String(totalTasks ?? 0)} sub="all time" color="gray" />
        <StatCard label="Open tasks" value={String(openTasks ?? 0)} sub="awaiting offers" color="green" />
        <StatCard label="Completed" value={String(completedTasks ?? 0)} sub="tasks" color="blue" />
        <StatCard label="KYC rate" value={`${totalUsers ? Math.round(((kycUsers ?? 0) / totalUsers) * 100) : 0}%`} sub="verified users" color="amber" />
      </div>

      {/* Recent tasks */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent tasks</h2>
        </div>
        <ul className="divide-y divide-gray-50">
          {(recentTasks ?? []).map(task => {
            const poster = task.profiles as unknown as { name: string } | null
            return (
              <li key={task.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">by {poster?.name ?? '—'} · {fmtRs(task.budget_paise as number)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_COLOR[task.status as string] ?? 'bg-gray-100 text-gray-500'}`}>
                  {(task.status as string).replace('_', ' ')}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

type Color = 'amber' | 'blue' | 'green' | 'red' | 'gray'
function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: Color }) {
  const bg: Record<Color, string> = { amber: 'bg-amber-50', blue: 'bg-blue-50', green: 'bg-green-50', red: 'bg-red-50', gray: 'bg-white' }
  const vc: Record<Color, string> = { amber: 'text-amber-700', blue: 'text-blue-700', green: 'text-green-700', red: 'text-red-700', gray: 'text-gray-900' }
  return (
    <div className={`rounded-xl border border-gray-200 ${bg[color]} p-5`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-black ${vc[color]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}

import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = { title: 'Reports — Admin' }

export default async function ReportsPage() {
  await requireAdmin()
  const supabase = createAdminClient()

  const eightWeeksAgo = new Date()
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)
  const since = eightWeeksAgo.toISOString()

  const [
    { data: weeklyTasks },
    { data: weeklyBookings },
    { data: topCategories },
  ] = await Promise.all([
    supabase.from('tasks').select('id, created_at, budget_paise, status').gte('created_at', since).order('created_at'),
    supabase.from('bookings').select('id, amount_paise, escrow_state, created_at').gte('created_at', since).order('created_at'),
    supabase.from('categories').select('id, names, icon, tasks(count)').order('slug').limit(10),
  ])

  function isoWeek(d: string) {
    const date = new Date(d)
    const day = date.getDay() || 7
    date.setDate(date.getDate() + 4 - day)
    const year = date.getFullYear()
    const weekStart = new Date(year, 0, 1 + (Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7) - 1) * 7)
    const week = Math.ceil(((date.getTime() - weekStart.getTime()) / 86400000 + weekStart.getDay() + 1) / 7)
    return `${year}-W${String(week).padStart(2, '0')}`
  }

  const tasksByWeek = new Map<string, number>()
  const revenueByWeek = new Map<string, number>()

  for (const t of (weeklyTasks ?? [])) {
    const w = isoWeek(t.created_at as string)
    tasksByWeek.set(w, (tasksByWeek.get(w) ?? 0) + 1)
  }
  for (const b of (weeklyBookings ?? [])) {
    if (b.escrow_state === 'released' || b.escrow_state === 'paid_out') {
      const w = isoWeek(b.created_at as string)
      revenueByWeek.set(w, (revenueByWeek.get(w) ?? 0) + (b.amount_paise as number))
    }
  }

  const weeks = [...new Set([...tasksByWeek.keys(), ...revenueByWeek.keys()])].sort()
  const fmtRs = (p: number) => `₹${Math.round(p / 100).toLocaleString('en-IN')}`
  const maxTasks = Math.max(...weeks.map(w => tasksByWeek.get(w) ?? 0), 1)
  const maxRevenue = Math.max(...weeks.map(w => revenueByWeek.get(w) ?? 0), 1)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Reports</h1>
        <a
          href="/api/admin/reports/export"
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          ⬇️ Export CSV
        </a>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Tasks posted — last 8 weeks</h2>
        <div className="flex items-end gap-2 h-32">
          {weeks.map(w => {
            const count = tasksByWeek.get(w) ?? 0
            const height = Math.round((count / maxTasks) * 100)
            return (
              <div key={w} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400">{count}</span>
                <div style={{ height: `${Math.max(height, 4)}%` }} className="w-full bg-amber-400 rounded-t-md transition-all" />
                <span className="text-xs text-gray-400 rotate-45 origin-left" style={{ fontSize: 9 }}>{w.slice(5)}</span>
              </div>
            )
          })}
          {weeks.length === 0 && <p className="text-sm text-gray-400 m-auto">No data yet</p>}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">GMV — last 8 weeks (released bookings)</h2>
        <div className="flex items-end gap-2 h-32">
          {weeks.map(w => {
            const rev = revenueByWeek.get(w) ?? 0
            const height = Math.round((rev / maxRevenue) * 100)
            return (
              <div key={w} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400" style={{ fontSize: 9 }}>{rev > 0 ? fmtRs(rev) : '—'}</span>
                <div style={{ height: `${Math.max(height, 4)}%` }} className="w-full bg-green-400 rounded-t-md transition-all" />
                <span className="text-xs text-gray-400" style={{ fontSize: 9 }}>{w.slice(5)}</span>
              </div>
            )
          })}
          {weeks.length === 0 && <p className="text-sm text-gray-400 m-auto">No data yet</p>}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Tasks by category</h2>
        <ul className="space-y-2">
          {(topCategories ?? []).map(cat => {
            const names = cat.names as Record<string, string>
            const label = names['en'] ?? cat.id
            const count = (cat.tasks as unknown as Array<{ count: number }>)?.[0]?.count ?? 0
            return (
              <li key={cat.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{cat.icon} {label}</span>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </li>
            )
          })}
          {(topCategories ?? []).length === 0 && <p className="text-sm text-gray-400">No categories yet.</p>}
        </ul>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = { title: 'Task Moderation — Admin' }

const STATUS_COLOR: Record<string, string> = {
  open: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-500',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  tasker_done: 'bg-orange-100 text-orange-700',
  completed: 'bg-gray-100 text-gray-600',
}

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; mod?: string }>
}) {
  await requireAdmin()
  const supabase = createAdminClient()
  const { q, mod } = await searchParams

  let query = supabase
    .from('tasks')
    .select('id, title, type, status, budget_paise, moderation_status, created_at, profiles!poster_id(name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50)

  if (q) query = query.ilike('title', `%${q}%`)
  if (mod === 'suspended') query = query.eq('moderation_status', 'suspended')
  else if (!mod) query = query.eq('moderation_status', 'ok')

  const { data: tasks } = await query
  const fmtRs = (p: number) => `₹${Math.round(p / 100).toLocaleString('en-IN')}`

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Task moderation</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/tasks" className={`px-3 py-1.5 rounded-lg font-medium ${!mod ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Active</Link>
          <Link href="/admin/tasks?mod=suspended" className={`px-3 py-1.5 rounded-lg font-medium ${mod === 'suspended' ? 'bg-red-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Suspended</Link>
          <Link href="/admin/tasks?mod=all" className={`px-3 py-1.5 rounded-lg font-medium ${mod === 'all' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>All</Link>
        </div>
      </div>

      <form action="/admin/tasks" className="mb-5">
        {mod && <input type="hidden" name="mod" value={mod} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search task titles…"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </form>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs tracking-wide">Task</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs tracking-wide">Poster</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs tracking-wide">Budget</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs tracking-wide">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs tracking-wide">Mod</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(tasks ?? []).map(task => {
              const poster = task.profiles as unknown as { name: string; email: string } | null
              const isSuspended = task.moderation_status === 'suspended'
              return (
                <tr key={task.id} className={isSuspended ? 'bg-red-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 max-w-xs truncate">{task.title}</p>
                    <p className="text-xs text-gray-400">{task.type}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{poster?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400">{poster?.email ?? ''}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-700">{fmtRs(task.budget_paise as number)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_COLOR[task.status as string] ?? 'bg-gray-100 text-gray-500'}`}>
                      {(task.status as string).replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {isSuspended
                      ? <span className="rounded-full bg-red-100 text-red-700 px-2.5 py-1 text-xs font-bold">Suspended</span>
                      : <span className="rounded-full bg-green-100 text-green-700 px-2.5 py-1 text-xs font-bold">OK</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/tasks/${task.id}`} className="text-sm font-semibold text-amber-600 hover:text-amber-800 transition-colors">
                      Review →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {(tasks ?? []).length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-gray-400">No tasks found.</p>
        )}
      </div>
    </div>
  )
}

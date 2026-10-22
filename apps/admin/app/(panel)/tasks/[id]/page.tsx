import Link from 'next/link'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function AdminTaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ msg?: string }>
}) {
  await requireAdmin()
  const supabase = createAdminClient()
  const { id } = await params
  const { msg } = await searchParams

  const { data: task } = await supabase
    .from('tasks')
    .select('*, profiles!poster_id(name, email, verification_tier)')
    .eq('id', id)
    .single()

  if (!task) notFound()

  const poster = task.profiles as unknown as { name: string; email: string; verification_tier: string } | null
  const fmtRs = (p: number) => `₹${Math.round(p / 100).toLocaleString('en-IN')}`
  const isSuspended = task.moderation_status === 'suspended'

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/tasks" className="text-sm text-gray-400 hover:text-gray-700 mb-6 inline-block">← Back to tasks</Link>

      {msg === 'suspended' && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-5 text-sm text-red-700 font-medium">Task suspended.</div>
      )}
      {msg === 'restored' && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 mb-5 text-sm text-green-700 font-medium">Task restored to active.</div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{task.type} · {task.display_area ?? 'India'} · {fmtRs(task.budget_paise as number)}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {isSuspended ? 'Suspended' : 'Active'}
          </span>
        </div>
        {task.description && <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.description as string}</p>}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-5">
        <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Poster</h2>
        <p className="font-medium text-gray-900">{poster?.name ?? '—'}</p>
        <p className="text-sm text-gray-500">{poster?.email}</p>
        <p className="text-sm text-gray-400 mt-1">Tier: {poster?.verification_tier}</p>
      </div>

      {isSuspended && task.moderation_note && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-5">
          <p className="text-sm font-semibold text-red-700 mb-1">Suspension note</p>
          <p className="text-sm text-red-600">{task.moderation_note as string}</p>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold mb-4">{isSuspended ? 'Restore task' : 'Suspend task'}</h2>
        <form action={`/api/admin/tasks/${id}/${isSuspended ? 'restore' : 'suspend'}`} method="POST" className="space-y-4">
          {!isSuspended && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason (required)</label>
              <textarea
                name="note"
                required
                rows={3}
                placeholder="Reason for suspension — visible to admins only"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
          )}
          <button
            type="submit"
            className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-colors ${isSuspended ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {isSuspended ? 'Restore task' : 'Suspend task'}
          </button>
        </form>
      </div>
    </div>
  )
}

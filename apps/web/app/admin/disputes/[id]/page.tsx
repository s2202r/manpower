import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/require-admin'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Resolve Dispute — Admin' }

export default async function ResolveDisputePage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const { error: errMsg } = await searchParams
  const supabase = createAdminClient()

  const { data: dispute } = await supabase
    .from('disputes')
    .select(`
      id, reason, status, created_at,
      booking:bookings!booking_id(id, amount_paise, escrow_state,
        task:tasks!task_id(id, title),
        poster:profiles!poster_id(id, name),
        tasker:profiles!tasker_id(id, name)
      )
    `)
    .eq('id', id)
    .single()

  if (!dispute || dispute.status !== 'open') redirect('/admin/disputes')

  const booking = dispute.booking as unknown as {
    id: string; amount_paise: number; escrow_state: string;
    task: { id: string; title: string } | null;
    poster: { id: string; name: string } | null;
    tasker: { id: string; name: string } | null;
  } | null

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Resolve Dispute</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <p className="font-semibold text-lg">{booking?.task?.title}</p>
        <p className="text-sm text-gray-500 mt-1">Amount in escrow: ₹{Math.round((booking?.amount_paise ?? 0) / 100).toLocaleString('en-IN')}</p>
        <p className="mt-4 text-sm text-gray-700 bg-amber-50 rounded-lg px-3 py-3 italic">"{dispute.reason}"</p>
        <p className="text-xs text-gray-400 mt-2">Raised {new Date(dispute.created_at).toLocaleString('en-IN')}</p>
      </div>

      {errMsg && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">{errMsg}</p>
      )}

      <form action={`/api/admin/disputes/${id}/resolve`} method="POST" className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Resolution</label>
          <select name="resolution" required className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none">
            <option value="">Select outcome…</option>
            <option value="resolved_poster">Release to poster (refund)</option>
            <option value="resolved_tasker">Release to tasker (pay out)</option>
            <option value="resolved_refund">Mutual refund</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Resolution note</label>
          <textarea name="note" rows={3} placeholder="Explain the decision…" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none resize-none" />
        </div>
        <button type="submit" className="w-full rounded-xl bg-amber-500 py-3 font-bold text-white hover:bg-amber-600 transition-colors">
          Confirm resolution
        </button>
      </form>
    </div>
  )
}

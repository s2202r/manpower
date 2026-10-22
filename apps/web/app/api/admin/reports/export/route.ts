import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: NextRequest) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, amount_paise, escrow_state, created_at, tasks!task_id(title, type, status), profiles!poster_id(name, email), profiles!tasker_id(name, email)')
    .order('created_at', { ascending: false })
    .limit(5000)

  const rows = (bookings ?? []).map(b => {
    const poster = (b as Record<string, unknown>)['profiles!poster_id'] as { name: string; email: string } | null
    const tasker = (b as Record<string, unknown>)['profiles!tasker_id'] as { name: string; email: string } | null
    const task = b.tasks as unknown as { title: string; type: string; status: string } | null
    return [
      b.id,
      task?.title ?? '',
      task?.type ?? '',
      task?.status ?? '',
      Math.round((b.amount_paise as number) / 100),
      b.escrow_state,
      poster?.name ?? '',
      poster?.email ?? '',
      tasker?.name ?? '',
      tasker?.email ?? '',
      b.created_at,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  })

  const header = ['booking_id', 'task_title', 'type', 'task_status', 'amount_rs', 'escrow_state', 'poster_name', 'poster_email', 'tasker_name', 'tasker_email', 'created_at'].join(',')
  const csv = [header, ...rows].join('\n')
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="taim-bookings-${date}.csv"`,
    },
  })
}

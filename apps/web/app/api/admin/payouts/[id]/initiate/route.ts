import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const formData = await req.formData()
  const providerRef = (formData.get('provider_ref') as string | null)?.trim()
  const notes = (formData.get('notes') as string | null)?.trim() || null

  if (!providerRef) return NextResponse.json({ error: 'Provider reference required' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, amount_paise, tasker_id, escrow_state')
    .eq('id', id)
    .single()

  if (!booking || booking.escrow_state !== 'released') {
    return NextResponse.redirect(new URL(`/admin/payouts/${id}?msg=error`, req.url))
  }

  const { error } = await supabase.from('payouts').insert({
    booking_id: id,
    tasker_id: booking.tasker_id,
    amount_paise: booking.amount_paise,
    status: 'completed',
    provider_ref: providerRef,
    notes,
    initiated_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  })

  if (error) return NextResponse.redirect(new URL(`/admin/payouts/${id}?msg=error`, req.url))

  await supabase.from('bookings').update({ escrow_state: 'paid_out' }).eq('id', id)

  return NextResponse.redirect(new URL(`/admin/payouts/${id}?msg=initiated`, req.url))
}

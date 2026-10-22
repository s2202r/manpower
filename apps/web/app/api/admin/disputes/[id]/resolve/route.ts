import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/require-admin'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = createAdminClient()

  const formData = await req.formData()
  const resolution = formData.get('resolution') as string
  const note = formData.get('note') as string

  const validResolutions = ['resolved_poster', 'resolved_tasker', 'resolved_refund']
  if (!validResolutions.includes(resolution)) {
    return NextResponse.redirect(new URL(`/admin/disputes/${id}?error=Invalid+resolution`, req.url))
  }

  const { data: dispute } = await supabase
    .from('disputes')
    .select('id, booking_id, status')
    .eq('id', id)
    .single()

  if (!dispute || dispute.status !== 'open') {
    return NextResponse.redirect(new URL('/admin/disputes', req.url))
  }

  await supabase
    .from('disputes')
    .update({
      status: resolution,
      resolution_note: note || null,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id)

  return NextResponse.redirect(new URL('/admin/disputes', req.url))
}

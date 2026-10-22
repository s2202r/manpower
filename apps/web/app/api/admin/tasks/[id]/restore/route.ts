import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = createAdminClient()

  await supabase.from('tasks').update({
    moderation_status: 'ok',
    moderation_note: null,
    moderated_at: new Date().toISOString(),
  }).eq('id', id)

  return NextResponse.redirect(new URL(`/admin/tasks/${id}?msg=restored`, req.url))
}

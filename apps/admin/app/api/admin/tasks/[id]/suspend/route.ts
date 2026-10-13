import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const formData = await req.formData()
  const note = (formData.get('note') as string | null)?.trim()

  if (!note) return NextResponse.json({ error: 'Note required' }, { status: 400 })

  const supabase = createAdminClient()
  await supabase.from('tasks').update({
    moderation_status: 'suspended',
    moderation_note: note,
    moderated_at: new Date().toISOString(),
  }).eq('id', id)

  return NextResponse.redirect(new URL(`/tasks/${id}?msg=suspended`, req.url))
}

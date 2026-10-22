import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const formData = await req.formData()
  const reason = (formData.get('reason') as string | null)?.trim()
  if (!reason) return NextResponse.json({ error: 'Reason required' }, { status: 400 })

  const supabase = createAdminClient()
  await supabase.from('profiles').update({
    banned: true,
    banned_at: new Date().toISOString(),
    banned_reason: reason,
  }).eq('id', id)

  return NextResponse.redirect(new URL(`/admin/users/${id}?msg=banned`, req.url))
}

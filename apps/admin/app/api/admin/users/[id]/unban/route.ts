import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = createAdminClient()
  await supabase.from('profiles').update({
    banned: false,
    banned_at: null,
    banned_reason: null,
  }).eq('id', id)

  return NextResponse.redirect(new URL(`/users/${id}?msg=unbanned`, req.url))
}

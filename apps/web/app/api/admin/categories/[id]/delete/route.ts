import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = await createClient()
  await supabase.from('categories').delete().eq('id', id)
  return NextResponse.redirect(new URL('/admin/categories?msg=deleted', req.url))
}

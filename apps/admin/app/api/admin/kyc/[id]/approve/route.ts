import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/require-admin'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('profiles')
    .update({ verification_tier: 'kyc' })
    .eq('id', id)

  if (error) {
    return NextResponse.redirect(new URL(`/kyc/${id}?msg=${encodeURIComponent(error.message)}`, _req.url))
  }

  return NextResponse.redirect(new URL(`/kyc/${id}?msg=approved`, _req.url))
}

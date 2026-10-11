import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { confirm: string }
  if (body.confirm !== 'DELETE MY ACCOUNT') {
    return NextResponse.json({ error: 'Please type DELETE MY ACCOUNT to confirm' }, { status: 400 })
  }

  // Block if there are held escrow bookings (money still in transit)
  const { count } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('escrow_state', 'held')
    .or(`poster_id.eq.${user.id},tasker_id.eq.${user.id}`)

  if (count && count > 0) {
    return NextResponse.json({ error: 'Cannot delete account while funds are in escrow. Complete or dispute open bookings first.' }, { status: 400 })
  }

  // Anonymise rather than hard-delete (preserve audit trail, remove PII)
  await supabase.from('profiles').update({
    name: '[Deleted user]',
    email: `deleted_${user.id}@taim.invalid`,
    photo_url: null,
    preferred_locale: 'en',
    roles: [],
    verification_tier: 'none',
  }).eq('id', user.id)

  // Sign out
  await supabase.auth.signOut()

  // Log deletion for DPDP audit
  await supabase.from('consent_log').insert({
    user_id: user.id,
    purpose: 'account_deletion',
    given_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}

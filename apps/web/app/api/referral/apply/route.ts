import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await req.json() as { code?: string }
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

  // Check if already referred
  const { data: self } = await supabase
    .from('profiles')
    .select('referred_by')
    .eq('id', user.id)
    .single()

  if (self?.referred_by) {
    return NextResponse.json({ error: 'Already used a referral code' }, { status: 409 })
  }

  // Look up referrer by code (case-insensitive)
  const { data: referrer } = await supabase
    .from('profiles')
    .select('id, referral_count')
    .eq('referral_code', code.toUpperCase())
    .single()

  if (!referrer) return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
  if (referrer.id === user.id) return NextResponse.json({ error: 'Cannot use your own code' }, { status: 400 })

  // Apply referral
  await supabase.from('profiles').update({ referred_by: referrer.id }).eq('id', user.id)
  await supabase.from('referral_events').insert({ referrer_id: referrer.id, referred_id: user.id })

  // Increment referral_count
  await supabase
    .from('profiles')
    .update({ referral_count: ((referrer.referral_count as number) ?? 0) + 1 })
    .eq('id', referrer.id)

  return NextResponse.json({ ok: true })
}

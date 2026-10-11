import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token, platform } = await req.json() as { token: string; platform: string }
  if (!token || !platform) return NextResponse.json({ error: 'Missing token or platform' }, { status: 400 })
  if (!['ios','android','web'].includes(platform)) return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })

  const { error } = await supabase.from('push_tokens')
    .upsert({ user_id: user.id, token, platform }, { onConflict: 'user_id,token' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids } = await req.json() as { ids?: string[] }

  if (ids && ids.length > 0) {
    await supabase.from('notifications').update({ read: true })
      .eq('user_id', user.id).in('id', ids)
  } else {
    // mark all
    await supabase.from('notifications').update({ read: true })
      .eq('user_id', user.id).eq('read', false)
  }

  return NextResponse.json({ ok: true })
}

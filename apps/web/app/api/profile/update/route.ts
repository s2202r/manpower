import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { name?: string; bio?: string; preferred_locale?: string; display_area?: string }

  const updates: Record<string, string> = {}
  if (body.name && body.name.trim().length >= 2) updates.name = body.name.trim().slice(0, 80)
  if (body.bio !== undefined) updates.bio = body.bio.trim().slice(0, 500)
  if (body.preferred_locale) updates.preferred_locale = body.preferred_locale
  if (body.display_area !== undefined) updates.display_area = body.display_area.trim().slice(0, 100)

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

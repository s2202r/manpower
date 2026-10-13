import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  let dbOk = false
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').select('id').limit(1)
    dbOk = !error
  } catch {
    dbOk = false
  }

  const status = dbOk ? 200 : 503
  return NextResponse.json(
    { ok: dbOk, db: dbOk ? 'up' : 'down', ts: new Date().toISOString() },
    { status }
  )
}

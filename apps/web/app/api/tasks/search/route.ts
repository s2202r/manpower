import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  const supabase = await createClient()
  const { data } = await supabase
    .from('tasks')
    .select('id, title, type, budget_paise, display_area')
    .eq('status', 'open')
    .textSearch('search_vector', q, { type: 'websearch', config: 'english' })
    .limit(6)

  return NextResponse.json(data ?? [])
}

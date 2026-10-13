import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const q = searchParams.get('q')?.trim() ?? ''
  const type = searchParams.get('type') ?? ''
  const minBudget = parseInt(searchParams.get('min') ?? '0') * 100   // rupees → paise
  const maxBudget = parseInt(searchParams.get('max') ?? '0') * 100

  let query = supabase
    .from('tasks')
    .select('id, title, description, task_type, budget_paise, display_area, offer_count, created_at, categories(names, icon)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(50)

  if (q) {
    // Use the generated tsvector column for fast full-text search
    query = query.textSearch('search_vector', q, { type: 'websearch', config: 'simple' })
  }
  if (type && ['in_person', 'pickup_drop', 'remote'].includes(type)) {
    query = query.eq('task_type', type)
  }
  if (minBudget > 0) query = query.gte('budget_paise', minBudget)
  if (maxBudget > 0) query = query.lte('budget_paise', maxBudget)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ tasks: data ?? [] })
}

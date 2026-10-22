import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_TYPES = ['in_person', 'pickup_drop', 'remote'] as const

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    title?: string
    description?: string
    task_type?: string
    pricing_type?: string
    budget_paise?: number
    category_id?: string | null
    display_area?: string | null
    location_lat?: number | null
    location_lng?: number | null
  }

  const title = body.title?.trim()
  const description = body.description?.trim()
  const task_type = body.task_type
  const budget_paise = body.budget_paise

  if (!title || title.length < 5 || title.length > 120) {
    return NextResponse.json({ error: 'Title must be 5–120 characters' }, { status: 400 })
  }
  if (!description || description.length < 20) {
    return NextResponse.json({ error: 'Description must be at least 20 characters' }, { status: 400 })
  }
  if (!VALID_TYPES.includes(task_type as typeof VALID_TYPES[number])) {
    return NextResponse.json({ error: 'Invalid task type' }, { status: 400 })
  }
  if (!budget_paise || budget_paise < 10000 || !Number.isInteger(budget_paise)) {
    return NextResponse.json({ error: 'Budget must be at least ₹100 (10000 paise)' }, { status: 400 })
  }

  const lat = body.location_lat
  const lng = body.location_lng
  const locationPoint = (typeof lat === 'number' && typeof lng === 'number')
    ? `SRID=4326;POINT(${lng} ${lat})`
    : null

  const { data: task, error } = await supabase.from('tasks').insert({
    title,
    description,
    task_type,
    budget_paise,
    category_id: body.category_id ?? null,
    display_area: body.display_area?.trim() ?? null,
    location: locationPoint,
    poster_id: user.id,
    status: 'open',
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: task.id }, { status: 201 })
}

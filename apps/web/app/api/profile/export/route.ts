import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Collect all personal data for this user
  const [profile, tasks, offers, bookings, reviews, consents] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('tasks').select('id, title, description, status, budget_paise, created_at').eq('poster_id', user.id),
    supabase.from('offers').select('id, amount_paise, status, created_at').eq('tasker_id', user.id),
    supabase.from('bookings').select('id, task_id, escrow_state, amount_paise, created_at').or(`poster_id.eq.${user.id},tasker_id.eq.${user.id}`),
    supabase.from('reviews').select('id, rating, comment, created_at').or(`reviewer_id.eq.${user.id},reviewee_id.eq.${user.id}`),
    supabase.from('consent_log').select('purpose, given_at, ip_country').eq('user_id', user.id),
  ])

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: profile.data,
    tasks: tasks.data ?? [],
    offers: offers.data ?? [],
    bookings: bookings.data ?? [],
    reviews: reviews.data ?? [],
    consents: consents.data ?? [],
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="taim-data-export-${user.id.slice(0, 8)}.json"`,
    },
  })
}

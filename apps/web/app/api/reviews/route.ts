import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { notify } from '@/lib/notify'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    bookingId: string
    revieweeId: string
    rating: number
    comment?: string
  }

  if (body.rating < 1 || body.rating > 5 || !Number.isInteger(body.rating)) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, poster_id, tasker_id, escrow_state')
    .eq('id', body.bookingId)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const isParticipant = booking.poster_id === user.id || booking.tasker_id === user.id
  if (!isParticipant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (booking.escrow_state !== 'released') return NextResponse.json({ error: 'Booking not completed' }, { status: 400 })

  const { error } = await supabase.from('reviews').insert({
    booking_id: body.bookingId,
    reviewer_id: user.id,
    reviewee_id: body.revieweeId,
    rating: body.rating,
    comment: body.comment ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Update reviewee's aggregate rating
  await supabase.rpc('update_rating_aggregate', { p_profile_id: body.revieweeId })

  // Notify reviewee
  const { data: reviewerProfile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const reviewerName = reviewerProfile?.full_name ?? 'Someone'
  void notify({ supabase, userId: body.revieweeId, kind: 'review_received', title: 'You received a review', body: `${reviewerName} gave you ${body.rating} stars.`, link: `/dashboard` })

  return NextResponse.json({ ok: true })
}

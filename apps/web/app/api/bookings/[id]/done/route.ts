import { createClient } from '@/lib/supabase/server'
import { canTransition } from '@taim/core'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { notify } from '@/lib/notify'
import { sendEmail, emailTaskerDone } from '@/lib/email'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, task_id, poster_id, tasker_id, escrow_state')
    .eq('id', bookingId)
    .single()

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (booking.tasker_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (booking.escrow_state !== 'held') return NextResponse.json({ error: 'Payment not held' }, { status: 400 })

  const { data: task } = await supabase.from('tasks').select('status').eq('id', booking.task_id).single()
  if (!canTransition(task?.status as 'in_progress', 'tasker_done', 'tasker')) {
    return NextResponse.json({ error: 'Invalid state transition' }, { status: 400 })
  }

  // Generate 6-digit OTP for poster to confirm
  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex')

  await supabase.from('tasks').update({ status: 'tasker_done' }).eq('id', booking.task_id)
  await supabase.from('bookings').update({
    completion_otp_hash: otpHash,
    auto_release_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  }).eq('id', bookingId)

  // Notify poster
  void notify({ supabase, userId: booking.poster_id, kind: 'task_done', title: 'Task marked complete', body: 'Your Tasker has marked the task as done. Enter the OTP to release payment.', link: `/bookings/${booking.id}` })

  // Non-blocking: email poster that tasker marked done
  const { data: bookingData } = await supabase
    .from('bookings')
    .select('id, tasks!task_id(title), profiles!poster_id(email, name)')
    .eq('id', bookingId)
    .single()

  if (bookingData) {
    const poster = bookingData.profiles as unknown as { email: string; name: string } | null
    const task = bookingData.tasks as unknown as { title: string } | null
    if (poster?.email) {
      void sendEmail({
        to: poster.email,
        ...emailTaskerDone({
          posterName: poster.name ?? 'Poster',
          taskTitle: task?.title ?? 'your task',
          bookingUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://taim.in'}/bookings/${bookingData.id}`,
        }),
      })
    }
  }

  // In production, send OTP to poster via notification/WhatsApp.
  // For now, return it in the response (dev only).
  return NextResponse.json({ ok: true, otp: process.env.NODE_ENV === 'development' ? otp : undefined })
}

import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

interface Booking {
  id: string; task_id: string; poster_id: string; tasker_id: string
  amount_paise: number; poster_fee_paise: number; gst_poster_paise: number
  tasker_payout_paise: number; escrow_state: string; task_status: string
  taskTitle: string
}

export default function BookingScreen() {
  const { id: bookingId } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [otp, setOtp] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewed, setReviewed] = useState(false)

  useEffect(() => { void load() }, [bookingId])
  useEffect(() => { if (booking?.escrow_state === 'released' && user?.id) void checkReview() }, [booking?.escrow_state, user?.id])

  async function load() {
    const { data } = await supabase
      .from('bookings')
      .select('id, task_id, poster_id, tasker_id, amount_paise, poster_fee_paise, gst_poster_paise, tasker_payout_paise, escrow_state, tasks(title, status)')
      .eq('id', bookingId)
      .single()
    if (data) {
      const t = data.tasks as unknown as { title: string; status: string } | null
      setBooking({ ...data, taskTitle: t?.title ?? '', task_status: t?.status ?? '' })
    }
    setLoading(false)
  }

  async function checkReview() {
    if (!user?.id || !bookingId) return
    const { data } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('reviewer_id', user.id)
      .maybeSingle()
    if (data) setReviewed(true)
  }

  async function submitReview() {
    if (!booking || !user?.id || rating === 0) return
    const revieweeId = booking.poster_id === user.id ? booking.tasker_id : booking.poster_id
    const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? ''
    setSubmitting(true)
    try {
      const res = await fetch(`${baseUrl}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, revieweeId, rating, comment: comment.trim() || undefined }),
      })
      const data = await res.json() as Record<string, unknown>
      if (!res.ok) Alert.alert('Error', (data.error as string) ?? 'Something went wrong')
      else setReviewed(true)
    } finally {
      setSubmitting(false)
    }
  }

  async function callApi(path: string, body: Record<string, unknown> = {}) {
    setActionLoading(true)
    // Mobile calls Next.js API via the configured base URL
    const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? ''
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const data = await res.json() as Record<string, unknown>
    setActionLoading(false)
    if (!res.ok) Alert.alert('Error', (data.error as string) ?? 'Something went wrong')
    else await load()
    return res.ok
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#d97706" size="large" /></View>
  if (!booking) return <View style={s.center}><Text>Booking not found</Text></View>

  const isPoster = user?.id === booking.poster_id
  const isTasker = user?.id === booking.tasker_id

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
      <View style={s.card}>
        <Text style={s.taskTitle}>{booking.taskTitle}</Text>
        <View style={s.row}>
          <Text style={s.amount}>₹{Math.round(booking.amount_paise / 100).toLocaleString('en-IN')}</Text>
          <View style={[s.badge, booking.escrow_state === 'held' ? s.held : booking.escrow_state === 'released' ? s.released : s.other]}>
            <Text style={s.badgeText}>{booking.escrow_state}</Text>
          </View>
        </View>
        <View style={s.feeRow}>
          <Text style={s.feeLabel}>Platform fee (incl. GST)</Text>
          <Text style={s.feeVal}>₹{Math.round((booking.poster_fee_paise + booking.gst_poster_paise) / 100).toLocaleString('en-IN')}</Text>
        </View>
        <View style={s.feeRow}>
          <Text style={s.feeLabel}>Tasker payout</Text>
          <Text style={s.feeVal}>₹{Math.round(booking.tasker_payout_paise / 100).toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Tasker: mark done */}
      {isTasker && booking.escrow_state === 'held' && booking.task_status === 'in_progress' && (
        <TouchableOpacity style={s.btn} disabled={actionLoading} onPress={() => callApi(`/api/bookings/${bookingId}/done`)}>
          <Text style={s.btnText}>{actionLoading ? 'Processing…' : 'Mark work as done'}</Text>
        </TouchableOpacity>
      )}

      {/* Poster: confirm with OTP */}
      {isPoster && booking.escrow_state === 'held' && booking.task_status === 'tasker_done' && (
        <View style={s.card}>
          <Text style={s.sectionTitle}>Confirm completion</Text>
          <Text style={s.hint}>Enter the 6-digit OTP the Tasker shared with you.</Text>
          <TextInput style={s.otpInput} value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} placeholder="123456" textAlign="center" />
          <TouchableOpacity style={[s.btn, { marginTop: 12 }]} disabled={otp.length !== 6 || actionLoading}
            onPress={() => callApi(`/api/bookings/${bookingId}/confirm`, { otp })}>
            <Text style={s.btnText}>{actionLoading ? 'Confirming…' : 'Confirm & release payment'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.disputeBtn} disabled={actionLoading}
            onPress={() => Alert.alert('Raise dispute', 'This will refund your payment.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Raise dispute', style: 'destructive', onPress: () => callApi(`/api/bookings/${bookingId}/refund`, { reason: 'Poster disputed completion' }) },
            ])}>
            <Text style={s.disputeText}>Raise a dispute</Text>
          </TouchableOpacity>
        </View>
      )}

      {booking.escrow_state === 'released' && (
        <View style={[s.card, { alignItems: 'center', paddingVertical: 24 }]}>
          <Text style={{ fontSize: 36 }}>✅</Text>
          <Text style={[s.sectionTitle, { marginTop: 8 }]}>Task completed!</Text>
          <TouchableOpacity style={[s.btn, { marginTop: 16, width: '100%' }]} onPress={() => router.push(`/tasks/${booking.task_id}/chat`)}>
            <Text style={s.btnText}>Open chat</Text>
          </TouchableOpacity>
        </View>
      )}

      {booking.escrow_state === 'released' && (
        <View style={s.card}>
          <Text style={s.sectionTitle}>Leave a review</Text>
          {reviewed ? (
            <View style={s.reviewedRow}>
              <Text style={s.reviewedText}>Review submitted ✅</Text>
            </View>
          ) : (
            <>
              <View style={s.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)} style={s.starBtn}>
                    <Text style={[s.star, star <= rating && s.starFilled]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={s.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder="Add a comment (optional)"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[s.btn, rating === 0 && s.btnDisabled]}
                disabled={rating === 0 || submitting}
                onPress={() => void submitReview()}
              >
                <Text style={s.btnText}>{submitting ? 'Submitting…' : 'Submit review'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {booking.escrow_state === 'refunded' && (
        <View style={[s.card, { alignItems: 'center', paddingVertical: 24 }]}>
          <Text style={{ fontSize: 36 }}>↩️</Text>
          <Text style={s.sectionTitle}>Payment refunded.</Text>
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  taskTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  amount: { fontSize: 24, fontWeight: '900', color: '#d97706' },
  badge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  held: { backgroundColor: '#dbeafe' }, released: { backgroundColor: '#dcfce7' }, other: { backgroundColor: '#f3f4f6' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  feeLabel: { fontSize: 13, color: '#6b7280' },
  feeVal: { fontSize: 13, fontWeight: '600', color: '#111' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 6 },
  hint: { fontSize: 13, color: '#6b7280', marginBottom: 10 },
  otpInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 14, fontSize: 28, letterSpacing: 12, fontFamily: 'monospace' },
  btn: { backgroundColor: '#d97706', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disputeBtn: { marginTop: 10, borderWidth: 2, borderColor: '#fca5a5', borderRadius: 12, padding: 12, alignItems: 'center' },
  disputeText: { color: '#dc2626', fontSize: 14, fontWeight: '600' },
  starsRow: { flexDirection: 'row', marginBottom: 12 },
  starBtn: { padding: 4 },
  star: { fontSize: 36, color: '#d1d5db' },
  starFilled: { color: '#f59e0b' },
  commentInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 14, color: '#111', minHeight: 72, marginBottom: 12 },
  btnDisabled: { backgroundColor: '#e5e7eb' },
  reviewedRow: { alignItems: 'center', paddingVertical: 12 },
  reviewedText: { fontSize: 16, fontWeight: '700', color: '#16a34a' },
})

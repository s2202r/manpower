import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

interface Booking {
  id: string; escrow_state: string; amount_paise: number
  tasks: { title: string } | null; created_at: string
}

export default function ActivityTab() {
  const { user } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('bookings')
      .select('id, escrow_state, amount_paise, created_at, tasks(title)')
      .or(`poster_id.eq.${user.id},tasker_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setBookings((data ?? []).map(b => ({ ...b, tasks: b.tasks as unknown as { title: string } | null })))
        setLoading(false)
      })
  }, [user])

  if (loading) return <View style={s.center}><ActivityIndicator color="#d97706" /></View>

  return (
    <FlatList
      style={s.container}
      data={bookings}
      keyExtractor={b => b.id}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
      ListEmptyComponent={<Text style={s.empty}>No bookings yet.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity style={s.card} onPress={() => router.push(`/bookings/${item.id}`)}>
          <Text style={s.taskTitle} numberOfLines={1}>{item.tasks?.title ?? 'Booking'}</Text>
          <View style={s.row}>
            <Text style={s.amount}>₹{Math.round(item.amount_paise / 100).toLocaleString('en-IN')}</Text>
            <View style={[s.badge, item.escrow_state === 'held' ? s.held : item.escrow_state === 'released' ? s.released : s.other]}>
              <Text style={s.badgeText}>{item.escrow_state}</Text>
            </View>
          </View>
          <Text style={s.date}>{new Date(item.created_at).toLocaleDateString('en-IN')}</Text>
        </TouchableOpacity>
      )}
    />
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 48 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  taskTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  amount: { fontSize: 16, fontWeight: '800', color: '#d97706' },
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  held: { backgroundColor: '#dbeafe' }, released: { backgroundColor: '#dcfce7' }, other: { backgroundColor: '#f3f4f6' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
  date: { fontSize: 12, color: '#9ca3af' },
})

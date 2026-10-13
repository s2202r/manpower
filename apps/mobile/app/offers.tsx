import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

interface Offer {
  id: string
  amount_paise: number
  status: string
  created_at: string
  tasks: { id: string; title: string; status: string } | null
}

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#fef3c7', text: '#92400e' },
  accepted: { bg: '#d1fae5', text: '#065f46' },
  rejected: { bg: '#fee2e2', text: '#991b1b' },
}

export default function MyOffersScreen() {
  const router = useRouter()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('offers')
      .select('id, amount_paise, status, created_at, tasks!task_id(id, title, status)')
      .eq('tasker_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    setOffers((data ?? []) as unknown as Offer[])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const fmtRs = (p: number) => `₹${Math.round(p / 100).toLocaleString('en-IN')}`

  if (loading) {
    return <View style={s.center}><ActivityIndicator color="#f59e0b" /></View>
  }

  return (
    <FlatList
      style={s.root}
      data={offers}
      keyExtractor={item => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor="#f59e0b" />}
      ListHeaderComponent={<Text style={s.heading}>My offers</Text>}
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📋</Text>
          <Text style={s.emptyText}>No offers sent yet</Text>
        </View>
      }
      renderItem={({ item }) => {
        const task = item.tasks
        const sc = STATUS_COLOR[item.status] ?? { bg: '#f3f4f6', text: '#666' }
        return (
          <TouchableOpacity
            style={s.card}
            onPress={() => task ? router.push(`/tasks/${task.id}` as Parameters<typeof router.push>[0]) : undefined}
          >
            <View style={s.cardRow}>
              <Text style={s.cardTitle} numberOfLines={2}>{task?.title ?? '—'}</Text>
              <Text style={s.amount}>{fmtRs(item.amount_paise)}</Text>
            </View>
            <View style={s.cardFooter}>
              <Text style={s.date}>{new Date(item.created_at).toLocaleDateString('en-IN')}</Text>
              <View style={[s.badge, { backgroundColor: sc.bg }]}>
                <Text style={[s.badgeText, { color: sc.text }]}>{item.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )
      }}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    />
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 16 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#aaa', fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111', marginRight: 12 },
  amount: { fontSize: 15, fontWeight: '800', color: '#f59e0b' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12, color: '#aaa' },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
})

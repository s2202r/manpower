import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

interface Notification {
  id: string
  kind: string
  title: string
  body: string
  read: boolean
  created_at: string
  link?: string | null
}

const KIND_ICON: Record<string, string> = {
  new_offer: '💬',
  offer_accepted: '🤝',
  escrow_held: '💰',
  tasker_done: '✅',
  review_received: '⭐',
  dispute_opened: '⚠️',
  default: '🔔',
}

export default function NotificationsScreen() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('notifications')
      .select('id, kind, title, body, read, created_at, link')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    setNotifications((data ?? []) as Notification[])
    setLoading(false)
    setRefreshing(false)

    // Mark all as read
    if (data && data.some(n => !n.read)) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function handlePress(n: Notification) {
    if (n.link) router.push(n.link as Parameters<typeof router.push>[0])
  }

  function formatTime(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHrs = Math.floor(diffMins / 60)
    if (diffHrs < 24) return `${diffHrs}h ago`
    return d.toLocaleDateString('en-IN')
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#f59e0b" />
      </View>
    )
  }

  return (
    <FlatList
      style={s.root}
      data={notifications}
      keyExtractor={item => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#f59e0b" />}
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🔔</Text>
          <Text style={s.emptyText}>No notifications yet</Text>
        </View>
      }
      ListHeaderComponent={<Text style={s.heading}>Notifications</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[s.item, !item.read && s.unread]}
          onPress={() => handlePress(item)}
          activeOpacity={item.link ? 0.7 : 1}
        >
          <Text style={s.icon}>{KIND_ICON[item.kind] ?? KIND_ICON.default}</Text>
          <View style={s.body}>
            <View style={s.row}>
              <Text style={s.title} numberOfLines={1}>{item.title}</Text>
              <Text style={s.time}>{formatTime(item.created_at)}</Text>
            </View>
            <Text style={s.bodyText} numberOfLines={2}>{item.body}</Text>
          </View>
          {!item.read && <View style={s.dot} />}
        </TouchableOpacity>
      )}
      ItemSeparatorComponent={() => <View style={s.sep} />}
    />
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '800', color: '#111', padding: 20, paddingBottom: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#aaa', fontSize: 15 },
  item: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff' },
  unread: { backgroundColor: '#fffbeb' },
  icon: { fontSize: 22, marginRight: 12, marginTop: 1 },
  body: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  title: { fontSize: 14, fontWeight: '700', color: '#111', flex: 1, marginRight: 8 },
  time: { fontSize: 11, color: '#aaa' },
  bodyText: { fontSize: 13, color: '#555', lineHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b', marginLeft: 8, marginTop: 6 },
  sep: { height: 1, backgroundColor: '#f3f4f6' },
})

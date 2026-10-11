import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { APP_NAME } from '@taim/config'
import { registerForPushNotifications, sendTokenToServer } from '@/lib/push'

interface Profile { name: string; roles: string[]; verification_tier: string }
interface Task { id: string; title: string; status: string; offer_count: number; budget_paise: number }
interface Offer { id: string; amount_paise: number; status: string; task_id: string; taskTitle: string }

export default function HomeTab() {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    void loadData()
  }, [user])

  async function loadData() {
    if (!user) return
    setLoading(true)
    const [{ data: p }, { data: t }, { data: o }] = await Promise.all([
      supabase.from('profiles').select('name, roles, verification_tier').eq('id', user.id).single(),
      supabase.from('tasks').select('id, title, status, offer_count, budget_paise').eq('poster_id', user.id).in('status', ['open','assigned','in_progress','tasker_done']).order('created_at', { ascending: false }).limit(5),
      supabase.from('offers').select('id, amount_paise, status, task_id, tasks(title)').eq('tasker_id', user.id).in('status', ['pending','accepted']).order('created_at', { ascending: false }).limit(5),
    ])
    setProfile(p)
    setTasks(t ?? [])
    setOffers((o ?? []).map(offer => ({ ...offer, taskTitle: (offer.tasks as unknown as { title: string } | null)?.title ?? '' })))
    setLoading(false)

    // Register push token in background (non-blocking)
    registerForPushNotifications().then(token => {
      if (token) {
        supabase.auth.getSession().then(({ data }) => {
          const accessToken = data.session?.access_token
          const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? ''
          if (accessToken && apiUrl) {
            void sendTokenToServer(token, apiUrl, accessToken)
          }
        })
      }
    })
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#d97706" size="large" /></View>

  const isPoster = profile?.roles?.includes('poster') || profile?.roles?.includes('admin')
  const isTasker = profile?.roles?.includes('tasker') || profile?.roles?.includes('admin')

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={s.header}>
        <Text style={s.greeting}>Hey {profile?.name?.split(' ')[0] ?? 'there'} 👋</Text>
        <Text style={s.appName}>{APP_NAME}</Text>
      </View>

      <View style={s.actions}>
        {isPoster && (
          <TouchableOpacity style={s.primaryCard} onPress={() => router.push('/tasks/new')}>
            <Text style={s.cardTitle}>+ Post a task</Text>
            <Text style={s.cardSub}>Describe what you need</Text>
          </TouchableOpacity>
        )}
        {isTasker && (
          <TouchableOpacity style={s.secondaryCard} onPress={() => router.push('/(tabs)/browse')}>
            <Text style={[s.cardTitle, { color: '#d97706' }]}>Browse tasks</Text>
            <Text style={s.cardSub}>Find work near you</Text>
          </TouchableOpacity>
        )}
      </View>

      {isPoster && tasks.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>My tasks</Text>
          {tasks.map(task => (
            <TouchableOpacity key={task.id} style={s.card} onPress={() => router.push(`/tasks/${task.id}`)}>
              <Text style={s.cardItemTitle} numberOfLines={1}>{task.title}</Text>
              <View style={s.row}>
                <Text style={s.meta}>{task.offer_count} offers · ₹{Math.round(task.budget_paise / 100).toLocaleString('en-IN')}</Text>
                <View style={[s.badge, task.status === 'open' ? s.badgeGreen : s.badgeBlue]}>
                  <Text style={s.badgeText}>{task.status}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isTasker && offers.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>My offers</Text>
          {offers.map(offer => (
            <TouchableOpacity key={offer.id} style={s.card} onPress={() => router.push(`/tasks/${offer.task_id}`)}>
              <Text style={s.cardItemTitle} numberOfLines={1}>{offer.taskTitle}</Text>
              <View style={s.row}>
                <Text style={[s.amount]}>₹{Math.round(offer.amount_paise / 100).toLocaleString('en-IN')}</Text>
                <View style={[s.badge, offer.status === 'accepted' ? s.badgeGreen : s.badgeYellow]}>
                  <Text style={s.badgeText}>{offer.status}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  greeting: { fontSize: 14, color: '#6b7280' },
  appName: { fontSize: 28, fontWeight: '900', color: '#d97706' },
  actions: { padding: 16, gap: 12, flexDirection: 'row' },
  primaryCard: { flex: 1, backgroundColor: '#d97706', borderRadius: 16, padding: 16 },
  secondaryCard: { flex: 1, borderWidth: 2, borderColor: '#d97706', borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  cardSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  section: { marginHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  cardItemTitle: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meta: { fontSize: 13, color: '#6b7280' },
  amount: { fontSize: 15, fontWeight: '700', color: '#d97706' },
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  badgeGreen: { backgroundColor: '#dcfce7' },
  badgeBlue: { backgroundColor: '#dbeafe' },
  badgeYellow: { backgroundColor: '#fef9c3' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
})

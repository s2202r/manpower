import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

interface Task {
  id: string; title: string; description: string; task_type: string; status: string
  budget_paise: number; display_area: string | null; poster_id: string
  profiles: { name: string; rating_avg: number | null; rating_count: number } | null
}
interface Offer { id: string; amount_paise: number; status: string; message: string | null }

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [myOffer, setMyOffer] = useState<Offer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    void load()
  }, [id])

  async function load() {
    const [{ data: t }, { data: o }] = await Promise.all([
      supabase.from('tasks').select('id, title, description, task_type, status, budget_paise, display_area, poster_id, profiles(name, rating_avg, rating_count)').eq('id', id).single(),
      user ? supabase.from('offers').select('id, amount_paise, status, message').eq('task_id', id).eq('tasker_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
    ])
    setTask(t ? { ...t, profiles: t.profiles as unknown as Task['profiles'] } : null)
    setMyOffer(o)
    setLoading(false)
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#d97706" size="large" /></View>
  if (!task) return <View style={s.center}><Text>Task not found</Text></View>

  const isPoster = user?.id === task.poster_id
  const isTasker = !isPoster
  const canOffer = isTasker && task.status === 'open' && !myOffer

  return (
    <View style={s.root}>
      <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={s.card}>
          <Text style={s.title}>{task.title}</Text>
          <View style={s.row}>
            <Text style={s.budget}>₹{Math.round(task.budget_paise / 100).toLocaleString('en-IN')}</Text>
            <View style={s.badge}><Text style={s.badgeText}>{task.task_type.replace('_', ' ')}</Text></View>
          </View>
          {task.display_area && <Text style={s.area}>📍 {task.display_area}</Text>}
          <Text style={s.desc}>{task.description}</Text>
          {task.profiles && (
            <View style={s.poster}>
              <Text style={s.posterName}>Posted by {task.profiles.name}</Text>
              {(task.profiles.rating_count ?? 0) > 0 && (
                <Text style={s.posterRating}>⭐ {(task.profiles.rating_avg ?? 0).toFixed(1)}</Text>
              )}
            </View>
          )}
        </View>

        {myOffer && (
          <View style={s.offerCard}>
            <Text style={s.offerTitle}>Your offer</Text>
            <Text style={s.offerAmount}>₹{Math.round(myOffer.amount_paise / 100).toLocaleString('en-IN')}</Text>
            <Text style={s.offerStatus}>{myOffer.status}</Text>
            {myOffer.status === 'accepted' && (
              <TouchableOpacity style={s.btn} onPress={() => router.push(`/tasks/${id}/chat`)}>
                <Text style={s.btnText}>Open chat</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isPoster && task.status === 'open' && (
          <TouchableOpacity
            style={[s.btn, { marginHorizontal: 16, marginTop: 16 }]}
            onPress={() => Alert.alert('Offers', 'Open the Taim web app to view and accept offers.')}
          >
            <Text style={s.btnText}>View offers in web app</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {canOffer && (
        <View style={s.footer}>
          <TouchableOpacity
            style={s.offerBtn}
            onPress={() => router.push({ pathname: '/tasks/[id]/offer', params: { id: task.id, title: task.title } })}
          >
            <Text style={s.offerBtnText}>Make an offer</Text>
          </TouchableOpacity>
        </View>
      )}

      {myOffer && myOffer.status === 'pending' && (
        <View style={s.footer}>
          <View style={s.offerSent}>
            <Text style={s.offerSentText}>✅ Offer sent — waiting for poster</Text>
          </View>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 16, padding: 18 },
  title: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  budget: { fontSize: 22, fontWeight: '900', color: '#d97706' },
  badge: { backgroundColor: '#eff6ff', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#1d4ed8', textTransform: 'capitalize' },
  area: { fontSize: 13, color: '#6b7280', marginBottom: 10 },
  desc: { fontSize: 15, color: '#374151', lineHeight: 22, marginBottom: 12 },
  poster: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  posterName: { fontSize: 13, color: '#6b7280' },
  posterRating: { fontSize: 13, color: '#d97706', fontWeight: '700' },
  offerCard: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', margin: 16, marginBottom: 0, borderRadius: 16, padding: 16 },
  offerTitle: { fontSize: 13, color: '#92400e', fontWeight: '700', marginBottom: 4 },
  offerAmount: { fontSize: 22, fontWeight: '900', color: '#d97706', marginBottom: 2 },
  offerStatus: { fontSize: 13, color: '#6b7280', textTransform: 'capitalize', marginBottom: 8 },
  btn: { backgroundColor: '#d97706', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#fff' },
  offerBtn: { backgroundColor: '#f59e0b', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  offerBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  offerSent: { backgroundColor: '#f0fdf4', borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  offerSentText: { color: '#16a34a', fontSize: 15, fontWeight: '700' },
})

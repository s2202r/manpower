import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Task {
  id: string; title: string; description: string; task_type: string
  budget_paise: number; display_area: string | null; offer_count: number; created_at: string
}

const TYPES = ['all', 'in_person', 'pickup_drop', 'remote']

export default function BrowseTab() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { void loadTasks() }, [typeFilter])

  async function loadTasks() {
    setLoading(true)
    let q = supabase.from('tasks').select('id, title, description, task_type, budget_paise, display_area, offer_count, created_at')
      .eq('status', 'open').order('created_at', { ascending: false }).limit(50)
    if (typeFilter !== 'all') q = q.eq('task_type', typeFilter)
    const { data } = await q
    setTasks(data ?? [])
    setLoading(false)
  }

  const filtered = search.trim()
    ? tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    : tasks

  return (
    <View style={s.container}>
      <View style={s.searchBar}>
        <TextInput style={s.searchInput} placeholder="Search tasks…" value={search} onChangeText={setSearch} />
      </View>
      <View style={s.filterRow}>
        {TYPES.map(t => (
          <TouchableOpacity key={t} style={[s.filter, typeFilter === t && s.filterActive]} onPress={() => setTypeFilter(t)}>
            <Text style={[s.filterText, typeFilter === t && s.filterTextActive]}>{t === 'all' ? 'All' : t.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading
        ? <View style={s.center}><ActivityIndicator color="#d97706" /></View>
        : <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
            ListEmptyComponent={<Text style={s.empty}>No tasks found.</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.card} onPress={() => router.push(`/tasks/${item.id}`)}>
                <View style={s.cardHeader}>
                  <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={s.budget}>₹{Math.round(item.budget_paise / 100).toLocaleString('en-IN')}</Text>
                </View>
                <Text style={s.desc} numberOfLines={2}>{item.description}</Text>
                <View style={s.cardFooter}>
                  <Text style={s.meta}>{item.display_area ?? 'Remote'} · {item.offer_count} offers</Text>
                  <View style={s.typeBadge}>
                    <Text style={s.typeText}>{item.task_type.replace('_', ' ')}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
      }
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 48 },
  searchBar: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  searchInput: { backgroundColor: '#f9fafb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  filter: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: '#f3f4f6' },
  filterActive: { backgroundColor: '#d97706' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
  filterTextActive: { color: '#fff' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 32 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111', marginRight: 8 },
  budget: { fontSize: 16, fontWeight: '800', color: '#d97706' },
  desc: { fontSize: 13, color: '#6b7280', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meta: { fontSize: 12, color: '#9ca3af' },
  typeBadge: { backgroundColor: '#eff6ff', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  typeText: { fontSize: 11, fontWeight: '600', color: '#1d4ed8', textTransform: 'capitalize' },
})

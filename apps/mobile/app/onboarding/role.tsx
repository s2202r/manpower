import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

const ROLES = [
  { value: 'poster', title: 'Post tasks', desc: 'I need help with tasks and errands', icon: '📋' },
  { value: 'tasker', title: 'Do tasks', desc: 'I want to earn money completing tasks', icon: '🛠️' },
  { value: 'both', title: 'Both', desc: 'Post tasks and earn money', icon: '⚡' },
]

export default function RoleScreen() {
  const router = useRouter()
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)

  async function confirm() {
    if (!selected) { Alert.alert('Please select a role'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const roles = selected === 'both' ? ['poster', 'tasker'] : [selected]
    await supabase.from('profiles').update({ roles }).eq('id', user.id)
    setLoading(false)
    router.replace('/(tabs)/')
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>How will you use Taim?</Text>
      <Text style={s.sub}>You can always change this later.</Text>
      <View style={s.options}>
        {ROLES.map(r => (
          <TouchableOpacity key={r.value} style={[s.option, selected === r.value && s.optionSelected]} onPress={() => setSelected(r.value)}>
            <Text style={s.icon}>{r.icon}</Text>
            <Text style={[s.optTitle, selected === r.value && s.optTitleSelected]}>{r.title}</Text>
            <Text style={s.optDesc}>{r.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={[s.btn, !selected && s.btnDisabled]} onPress={confirm} disabled={!selected || loading}>
        <Text style={s.btnText}>{loading ? 'Saving…' : 'Continue'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 8 },
  sub: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  options: { gap: 12 },
  option: { borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 16, padding: 18 },
  optionSelected: { borderColor: '#d97706', backgroundColor: '#fffbeb' },
  icon: { fontSize: 28, marginBottom: 8 },
  optTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  optTitleSelected: { color: '#d97706' },
  optDesc: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  btn: { backgroundColor: '#d97706', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  btnDisabled: { backgroundColor: '#fde68a' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})

import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const TASK_TYPES = [
  { value: 'in_person', label: 'In person' },
  { value: 'pickup_drop', label: 'Pickup & drop' },
  { value: 'remote', label: 'Remote' },
]

export default function NewTaskScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [taskType, setTaskType] = useState('remote')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (title.trim().length < 10) { Alert.alert('Title too short', 'At least 10 characters'); return }
    if (description.trim().length < 20) { Alert.alert('Description too short', 'At least 20 characters'); return }
    const budgetPaise = Math.round(parseFloat(budget) * 100)
    if (!budgetPaise || budgetPaise < 100) { Alert.alert('Invalid budget', 'Minimum ₹1'); return }

    setLoading(true)
    const { error } = await supabase.from('tasks').insert({
      poster_id: user?.id,
      title: title.trim(),
      description: description.trim(),
      budget_paise: budgetPaise,
      task_type: taskType,
      status: 'open',
      date_flexibility: 'week',
    })
    setLoading(false)
    if (error) Alert.alert('Error', error.message)
    else { Alert.alert('Task posted!', 'Taskers nearby will see your task.'); router.back() }
  }

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={s.label}>Task title *</Text>
      <TextInput style={s.input} placeholder="e.g. Fix my kitchen sink" value={title} onChangeText={setTitle} maxLength={200} />

      <Text style={s.label}>Description *</Text>
      <TextInput style={[s.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Describe what you need in detail…" value={description} onChangeText={setDescription} multiline maxLength={2000} />

      <Text style={s.label}>Budget (₹) *</Text>
      <TextInput style={s.input} placeholder="e.g. 500" keyboardType="decimal-pad" value={budget} onChangeText={setBudget} />

      <Text style={s.label}>Task type *</Text>
      <View style={s.typeRow}>
        {TASK_TYPES.map(t => (
          <TouchableOpacity key={t.value} style={[s.typeBtn, taskType === t.value && s.typeBtnActive]} onPress={() => setTaskType(t.value)}>
            <Text style={[s.typeBtnText, taskType === t.value && s.typeBtnTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={submit} disabled={loading}>
        <Text style={s.btnText}>{loading ? 'Posting…' : 'Post task'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, alignItems: 'center' },
  typeBtnActive: { borderColor: '#d97706', backgroundColor: '#fffbeb' },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  typeBtnTextActive: { color: '#d97706' },
  btn: { backgroundColor: '#d97706', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  btnDisabled: { backgroundColor: '#fde68a' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})

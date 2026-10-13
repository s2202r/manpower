import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

const TYPES = [
  { value: 'fixed', label: '💰 Fixed price' },
  { value: 'hourly', label: '⏱️ Hourly rate' },
] as const

export default function NewTaskScreen() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'fixed' | 'hourly'>('fixed')
  const [budgetRs, setBudgetRs] = useState('')
  const [area, setArea] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (title.trim().length < 5) {
      Alert.alert('Title too short', 'Title must be at least 5 characters.')
      return
    }
    if (description.trim().length < 20) {
      Alert.alert('Description too short', 'Please describe the task in at least 20 characters.')
      return
    }
    const budgetNum = Number(budgetRs)
    if (!budgetNum || budgetNum < 100) {
      Alert.alert('Invalid budget', 'Minimum budget is ₹100.')
      return
    }

    setSubmitting(true)
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? ''
    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch(`${apiUrl}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        type,
        budget_paise: Math.round(budgetNum * 100),
        display_area: area.trim() || null,
      }),
    })

    setSubmitting(false)

    if (res.ok) {
      const { id } = await res.json() as { id: string }
      Alert.alert('Task posted! 🎉', 'Your task is now live and accepting offers.', [
        { text: 'View task', onPress: () => router.replace(`/tasks/${id}`) },
        { text: 'Post another', onPress: () => { setTitle(''); setDescription(''); setBudgetRs(''); setArea('') } },
      ])
    } else {
      const d = await res.json() as { error?: string }
      Alert.alert('Error', d.error ?? 'Failed to post task. Please try again.')
    }
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.heading}>Post a task</Text>

      <Text style={s.label}>What do you need done? *</Text>
      <TextInput
        style={s.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Fix leaking kitchen tap"
        placeholderTextColor="#aaa"
        maxLength={120}
      />
      <Text style={s.charCount}>{title.length}/120</Text>

      <Text style={s.label}>Describe the task * (min 20 chars)</Text>
      <TextInput
        style={[s.input, s.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="Include location, materials, timing, any special requirements…"
        placeholderTextColor="#aaa"
        multiline
        numberOfLines={5}
        maxLength={2000}
      />
      <Text style={s.charCount}>{description.length} chars</Text>

      <Text style={s.label}>Pricing type</Text>
      <View style={s.typeRow}>
        {TYPES.map(t => (
          <TouchableOpacity
            key={t.value}
            style={[s.typeBtn, type === t.value && s.typeBtnActive]}
            onPress={() => setType(t.value)}
          >
            <Text style={[s.typeBtnText, type === t.value && s.typeBtnTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Budget (₹) — minimum ₹100</Text>
      <View style={s.budgetRow}>
        <Text style={s.rupee}>₹</Text>
        <TextInput
          style={[s.input, s.budgetInput]}
          value={budgetRs}
          onChangeText={setBudgetRs}
          placeholder="500"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          maxLength={7}
        />
      </View>

      <Text style={s.label}>Location / area (optional)</Text>
      <TextInput
        style={s.input}
        value={area}
        onChangeText={setArea}
        placeholder="e.g. Bandra, Mumbai"
        placeholderTextColor="#aaa"
        maxLength={100}
      />

      <TouchableOpacity
        style={[s.btn, (submitting || title.length < 5 || description.length < 20) && s.btnDisabled]}
        onPress={submit}
        disabled={submitting || title.length < 5 || description.length < 20}
      >
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.btnText}>Post task 🚀</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fafafa' },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111', backgroundColor: '#fff' },
  multiline: { height: 120, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 4 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  typeBtnActive: { borderColor: '#f59e0b', backgroundColor: '#fffbeb' },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: '#888' },
  typeBtnTextActive: { color: '#92400e' },
  budgetRow: { flexDirection: 'row', alignItems: 'center' },
  rupee: { fontSize: 18, fontWeight: '700', color: '#555', marginRight: 8 },
  budgetInput: { flex: 1 },
  btn: { backgroundColor: '#f59e0b', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
})

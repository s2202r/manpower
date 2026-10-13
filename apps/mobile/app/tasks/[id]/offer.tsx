import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function MakeOfferScreen() {
  const { id: taskId, title } = useLocalSearchParams<{ id: string; title: string }>()
  const router = useRouter()
  const [amountRs, setAmountRs] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    const amount = Number(amountRs)
    if (!amount || amount < 100) {
      Alert.alert('Invalid amount', 'Minimum offer is ₹100.')
      return
    }
    if (message.trim().length < 10) {
      Alert.alert('Message too short', 'Please write at least 10 characters explaining your offer.')
      return
    }

    setSubmitting(true)
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? ''
    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch(`${apiUrl}/api/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({
        taskId,
        amount: Math.round(amount * 100),
        message: message.trim(),
      }),
    })

    setSubmitting(false)

    if (res.ok) {
      Alert.alert('Offer sent! 🎉', 'The poster will be notified of your offer.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } else {
      const d = await res.json() as { error?: string }
      Alert.alert('Error', d.error ?? 'Failed to send offer.')
    }
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.heading}>Make an offer</Text>
      {title ? <Text style={s.taskTitle}>{title}</Text> : null}

      <Text style={s.label}>Your price (₹) — minimum ₹100</Text>
      <View style={s.amountRow}>
        <Text style={s.rupee}>₹</Text>
        <TextInput
          style={[s.input, s.amountInput]}
          value={amountRs}
          onChangeText={setAmountRs}
          placeholder="500"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          maxLength={7}
        />
      </View>

      <Text style={s.label}>Message to poster * (min 10 chars)</Text>
      <TextInput
        style={[s.input, s.multiline]}
        value={message}
        onChangeText={setMessage}
        placeholder="Describe your experience and why you're the right fit for this task…"
        placeholderTextColor="#aaa"
        multiline
        numberOfLines={5}
        maxLength={500}
      />
      <Text style={s.charCount}>{message.length}/500</Text>

      <TouchableOpacity
        style={[s.btn, (submitting || Number(amountRs) < 100 || message.length < 10) && s.btnDisabled]}
        onPress={submit}
        disabled={submitting || Number(amountRs) < 100 || message.length < 10}
      >
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.btnText}>Send offer</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={s.cancel} onPress={() => router.back()}>
        <Text style={s.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fafafa' },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 6 },
  taskTitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111', backgroundColor: '#fff' },
  multiline: { height: 130, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 4 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  rupee: { fontSize: 18, fontWeight: '700', color: '#555', marginRight: 8 },
  amountInput: { flex: 1 },
  btn: { backgroundColor: '#f59e0b', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancel: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { color: '#888', fontSize: 15, fontWeight: '600' },
})

import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function EditProfileScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [displayArea, setDisplayArea] = useState('')
  const [locale, setLocale] = useState('en')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, bio, display_area, preferred_locale')
        .eq('id', user.id)
        .single()
      if (profile) {
        setName((profile.name as string) ?? '')
        setBio((profile.bio as string) ?? '')
        setDisplayArea((profile.display_area as string) ?? '')
        setLocale((profile.preferred_locale as string) ?? 'en')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function save() {
    if (!name.trim() || name.trim().length < 2) {
      Alert.alert('Name required', 'Name must be at least 2 characters.')
      return
    }
    setSaving(true)
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? ''
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${apiUrl}/api/profile/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({
        name: name.trim(),
        bio: bio.trim(),
        display_area: displayArea.trim(),
        preferred_locale: locale.trim() || 'en',
      }),
    })
    setSaving(false)
    if (res.ok) {
      Alert.alert('Saved', 'Profile updated.', [{ text: 'OK', onPress: () => router.back() }])
    } else {
      const d = await res.json() as { error?: string }
      Alert.alert('Error', d.error ?? 'Failed to save. Please try again.')
    }
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#f59e0b" />
      </View>
    )
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.heading}>Edit profile</Text>

      <Text style={s.label}>Name *</Text>
      <TextInput
        style={s.input}
        value={name}
        onChangeText={setName}
        placeholder="Your full name"
        placeholderTextColor="#aaa"
        maxLength={80}
      />

      <Text style={s.label}>Bio</Text>
      <TextInput
        style={[s.input, s.multiline]}
        value={bio}
        onChangeText={setBio}
        placeholder="Tell clients about yourself…"
        placeholderTextColor="#aaa"
        multiline
        numberOfLines={4}
        maxLength={500}
      />
      <Text style={s.charCount}>{bio.length}/500</Text>

      <Text style={s.label}>Service area</Text>
      <TextInput
        style={s.input}
        value={displayArea}
        onChangeText={setDisplayArea}
        placeholder="e.g. Mumbai, Maharashtra"
        placeholderTextColor="#aaa"
        maxLength={100}
      />

      <Text style={s.label}>Preferred language (locale code)</Text>
      <TextInput
        style={s.input}
        value={locale}
        onChangeText={setLocale}
        placeholder="en"
        placeholderTextColor="#aaa"
        autoCapitalize="none"
        maxLength={5}
      />

      <TouchableOpacity style={[s.btn, saving && s.btnDisabled]} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Save changes</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={s.cancel} onPress={() => router.back()}>
        <Text style={s.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111', backgroundColor: '#fff' },
  multiline: { height: 100, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 4 },
  btn: { backgroundColor: '#f59e0b', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancel: { alignItems: 'center', paddingVertical: 14, marginTop: 8 },
  cancelText: { color: '#888', fontSize: 15, fontWeight: '600' },
})

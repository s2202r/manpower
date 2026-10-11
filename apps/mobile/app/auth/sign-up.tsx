import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function SignUpScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignUp() {
    if (!name.trim()) { Alert.alert('Name required'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name: name.trim() } },
    })
    setLoading(false)
    if (error) Alert.alert('Sign up failed', error.message)
    else router.replace('/onboarding/language')
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Create your account</Text>
      <TextInput style={s.input} placeholder="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
      <TextInput style={s.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={s.input} placeholder="Password (min 8 chars)" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={s.btn} onPress={handleSignUp} disabled={loading}>
        <Text style={s.btnText}>{loading ? 'Creating account…' : 'Create account'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/auth/sign-in')}>
        <Text style={s.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '800', color: '#111', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  btn: { backgroundColor: '#d97706', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', marginTop: 16, color: '#d97706', fontSize: 14 },
})

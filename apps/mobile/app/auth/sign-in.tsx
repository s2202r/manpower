import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { APP_NAME } from '@taim/config'
import { supabase } from '@/lib/supabase'

export default function SignInScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) Alert.alert('Sign in failed', error.message)
    else router.replace('/dashboard')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in to {APP_NAME}</Text>
      <TextInput
        style={styles.input} placeholder="Email" keyboardType="email-address"
        autoCapitalize="none" value={email} onChangeText={setEmail}
      />
      <TextInput
        style={styles.input} placeholder="Password" secureTextEntry
        value={password} onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.btn} onPress={handleSignIn} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '800', color: '#111', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  btn: { backgroundColor: '#e56808', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})

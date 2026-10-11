import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { APP_NAME, APP_TAGLINE } from '@taim/config'

export default function HomeScreen() {
  const router = useRouter()
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>{APP_NAME}</Text>
      <Text style={styles.tagline}>{APP_TAGLINE}</Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/auth/sign-up')}>
        <Text style={styles.primaryBtnText}>Get started</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/auth/sign-in')}>
        <Text style={styles.secondaryBtnText}>Sign in</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  logo: { fontSize: 48, fontWeight: '900', color: '#e56808', marginBottom: 8 },
  tagline: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 48, paddingHorizontal: 16 },
  primaryBtn: { width: '100%', backgroundColor: '#e56808', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  secondaryBtn: { width: '100%', borderWidth: 2, borderColor: '#e56808', borderRadius: 12, padding: 16, alignItems: 'center' },
  secondaryBtnText: { color: '#e56808', fontSize: 18, fontWeight: '700' },
})

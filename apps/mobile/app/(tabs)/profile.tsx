import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

interface Profile { name: string; email: string; verification_tier: string; rating_avg: number | null; rating_count: number; roles: string[] }

export default function ProfileTab() {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('name, email, verification_tier, rating_avg, rating_count, roles').eq('id', user.id).single()
      .then(({ data }) => setProfile(data))
  }, [user])

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  const tier = profile?.verification_tier ?? 'none'
  const tierLabel = tier === 'kyc' ? 'KYC verified ✓' : tier === 'email' ? 'Email verified' : 'Not verified'
  const tierColor = tier === 'kyc' ? '#16a34a' : tier === 'email' ? '#2563eb' : '#6b7280'

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.hero}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{profile?.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={s.name}>{profile?.name ?? '…'}</Text>
        <Text style={[s.tier, { color: tierColor }]}>{tierLabel}</Text>
        {profile && (profile.rating_count ?? 0) > 0 && (
          <Text style={s.rating}>⭐ {(profile.rating_avg ?? 0).toFixed(1)} ({profile.rating_count} reviews)</Text>
        )}
      </View>

      <View style={s.section}>
        <TouchableOpacity style={[s.row, s.actionRow]} onPress={() => router.push('/profile/edit')}>
          <Text style={s.actionLabel}>Edit profile</Text>
          <Text style={s.chevron}>›</Text>
        </TouchableOpacity>
        {tier !== 'kyc' && (
          <TouchableOpacity style={[s.row, s.actionRow]} onPress={() => Alert.alert('KYC', 'Open the Taim web app to complete KYC verification.')}>
            <Text style={s.actionLabel}>Get KYC verified</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[s.row, s.actionRow]} onPress={() => Alert.alert('Export data', 'Visit taim.space/profile/export to download your data.')}>
          <Text style={s.actionLabel}>Download my data</Text>
          <Text style={s.chevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.row, s.actionRow, { borderBottomWidth: 0 }]} onPress={signOut}>
          <Text style={[s.actionLabel, { color: '#dc2626' }]}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  hero: { backgroundColor: '#fff', alignItems: 'center', paddingVertical: 28, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#d97706' },
  name: { fontSize: 20, fontWeight: '800', color: '#111' },
  tier: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  rating: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  section: { backgroundColor: '#fff', marginTop: 16, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionRow: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  actionLabel: { fontSize: 15, color: '#111' },
  chevron: { fontSize: 20, color: '#9ca3af' },
})

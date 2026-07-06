import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { getMyProfile } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const SKILL_LABELS: Record<string, string> = {
  GENERAL_HELPER: 'General Helper',
  FORKLIFT_MHE: 'Forklift / MHE',
  SCANNER_TRAINED: 'Scanner Trained',
  COLD_STORAGE: 'Cold Storage',
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    getMyProfile()
      .then(r => setProfile(r.data))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)');
  };

  const kycColor = profile?.kycStatus === 'VERIFIED' ? '#065F46' : profile?.kycStatus === 'PENDING' ? '#92400E' : '#6B7280';
  const kycBg = profile?.kycStatus === 'VERIFIED' ? '#D1FAE5' : profile?.kycStatus === 'PENDING' ? '#FEF3C7' : '#F3F4F6';
  const kycLabel =
    profile?.kycStatus === 'VERIFIED' ? 'KYC Verified' :
    profile?.kycStatus === 'PENDING' ? 'KYC Pending Review' : 'KYC Not Submitted';

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Profile</Text>
      {profile && (
        <>
          <View style={styles.card}>
            <Text style={styles.name}>{profile.name || 'No name set'}</Text>
            <Text style={styles.phone}>{profile.phone}</Text>
            <View style={[styles.kycBadge, { backgroundColor: kycBg }]}>
              <Text style={[styles.kycText, { color: kycColor }]}>{kycLabel}</Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.reliabilityScore?.toFixed(0) ?? '--'}</Text>
              <Text style={styles.statLabel}>Reliability Score</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.totalShiftsCompleted ?? 0}</Text>
              <Text style={styles.statLabel}>Shifts Done</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.totalNoShows ?? 0}</Text>
              <Text style={styles.statLabel}>No-Shows</Text>
            </View>
          </View>

          <View style={styles.skillsCard}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsRow}>
              {(profile.skills || []).map((s: string) => (
                <View key={s} style={styles.skillChip}>
                  <Text style={styles.skillText}>{SKILL_LABELS[s] || s}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.kycCard}>
            <Text style={styles.sectionTitle}>KYC Verification</Text>
            <Text style={styles.kycNote}>
              📋 Full KYC verification (Aadhaar/police background check) is coming soon. Documents you uploaded are saved and will be reviewed when this feature launches.
            </Text>
          </View>
        </>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { fontSize: 22, fontWeight: '700', color: '#1E3A5F', padding: 16, paddingTop: 56, backgroundColor: '#fff' },
  card: { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 2 },
  name: { fontSize: 22, fontWeight: '700', color: '#111827' },
  phone: { color: '#6B7280', marginTop: 4, marginBottom: 12 },
  kycBadge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  kycText: { fontSize: 13, fontWeight: '600' },
  statsCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', elevation: 1 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1E3A5F' },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  skillsCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  sectionTitle: { fontWeight: '600', color: '#374151', marginBottom: 10 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { backgroundColor: '#EFF6FF', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  skillText: { color: '#1D4ED8', fontSize: 13 },
  kycCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, elevation: 1 },
  kycNote: { color: '#1E40AF', fontSize: 13, lineHeight: 20 },
  logoutBtn: { margin: 16, borderWidth: 1, borderColor: '#EF4444', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 40 },
  logoutText: { color: '#EF4444', fontWeight: '600' },
});

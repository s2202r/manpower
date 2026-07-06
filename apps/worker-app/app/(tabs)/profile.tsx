import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
  SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { getMyProfile } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const SKILL_LABELS: Record<string, string> = {
  GENERAL_HELPER:  'General Helper',
  FORKLIFT_MHE:    'Forklift / MHE',
  SCANNER_TRAINED: 'Scanner Trained',
  COLD_STORAGE:    'Cold Storage',
};

const SKILL_EMOJIS: Record<string, string> = {
  GENERAL_HELPER:  '📦',
  FORKLIFT_MHE:    '🚜',
  SCANNER_TRAINED: '📡',
  COLD_STORAGE:    '❄️',
};

type KycStatus = 'VERIFIED' | 'PENDING' | 'NOT_SUBMITTED' | 'REJECTED';

const KYC_CONFIG: Record<KycStatus, { label: string; bg: string; text: string; emoji: string }> = {
  VERIFIED:      { label: 'KYC Verified',       bg: '#D1FAE5', text: '#065F46', emoji: '✅' },
  PENDING:       { label: 'KYC Under Review',    bg: '#FEF3C7', text: '#92400E', emoji: '⏳' },
  REJECTED:      { label: 'KYC Rejected',        bg: '#FEE2E2', text: '#991B1B', emoji: '✖' },
  NOT_SUBMITTED: { label: 'KYC Not Submitted',   bg: '#F3F4F6', text: '#6B7280', emoji: '📋' },
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyProfile()
      .then(r => setProfile(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Log Out?',
      'क्या आप Log Out करना चाहते हैं?\nAre you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)');
          },
        },
      ]
    );
  };

  const kycStatus: KycStatus = profile?.kycStatus ?? 'NOT_SUBMITTED';
  const kycCfg = KYC_CONFIG[kycStatus] ?? KYC_CONFIG.NOT_SUBMITTED;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👤  मेरा Profile</Text>
        <Text style={styles.headerSub}>My Profile</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 60 }} />
        ) : profile ? (
          <>
            {/* Name card */}
            <View style={styles.nameCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(profile.name ?? '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.nameInfo}>
                <Text style={styles.name}>{profile.name ?? 'Name not set'}</Text>
                <Text style={styles.phone}>{profile.phone}</Text>
              </View>
              <View style={[styles.kycBadge, { backgroundColor: kycCfg.bg }]}>
                <Text style={[styles.kycBadgeText, { color: kycCfg.text }]}>
                  {kycCfg.emoji}  {kycCfg.label}
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.reliabilityScore?.toFixed(0) ?? '—'}</Text>
                <Text style={styles.statLabel}>Score</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.totalShiftsCompleted ?? 0}</Text>
                <Text style={styles.statLabel}>Shifts Done</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, profile.totalNoShows > 0 && styles.statValueWarning]}>
                  {profile.totalNoShows ?? 0}
                </Text>
                <Text style={styles.statLabel}>No-Shows</Text>
              </View>
            </View>

            {/* Skills */}
            {profile.skills?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Skills</Text>
                <View style={styles.skillsGrid}>
                  {profile.skills.map((s: string) => (
                    <View key={s} style={styles.skillChip}>
                      <Text style={styles.skillEmoji}>{SKILL_EMOJIS[s] ?? '🔧'}</Text>
                      <Text style={styles.skillLabel}>{SKILL_LABELS[s] ?? s.replace(/_/g, ' ')}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* KYC notice */}
            <View style={styles.kycNotice}>
              <Text style={styles.kycNoticeTitle}>KYC Verification</Text>
              <Text style={styles.kycNoticeText}>
                Full KYC (Aadhaar + police background check) is coming soon. Your uploaded documents are safe and will be reviewed when the feature launches.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.noProfile}>
            <Text style={styles.noProfileText}>Profile not found. Please contact support.</Text>
          </View>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>🚪  Log Out  /  लॉग आउट</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F5F9' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 48, gap: 14 },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#1E3A8A' },
  headerSub: { fontSize: 14, color: '#6B7280', marginTop: 2 },

  nameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    elevation: 2,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#FFFFFF' },
  nameInfo: { alignItems: 'center' },
  name: { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center' },
  phone: { fontSize: 16, color: '#6B7280', marginTop: 2 },
  kycBadge: {
    alignSelf: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  kycBadgeText: { fontSize: 14, fontWeight: '700' },

  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    elevation: 1,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '800', color: '#1E3A8A', fontVariant: ['tabular-nums'] },
  statValueWarning: { color: '#DC2626' },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 3, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    elevation: 1,
    gap: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  skillEmoji: { fontSize: 18 },
  skillLabel: { fontSize: 14, color: '#1E40AF', fontWeight: '600' },

  kycNotice: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  kycNoticeTitle: { fontSize: 15, fontWeight: '700', color: '#1E40AF' },
  kycNoticeText: { color: '#1E40AF', fontSize: 13, lineHeight: 20 },

  noProfile: { padding: 40, alignItems: 'center' },
  noProfileText: { color: '#9CA3AF', fontSize: 15, textAlign: 'center' },

  logoutBtn: {
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: 14,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutText: { color: '#DC2626', fontWeight: '700', fontSize: 18 },
});

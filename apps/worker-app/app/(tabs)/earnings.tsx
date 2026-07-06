import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
  SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { getMyCheckins } from '@/lib/api';

type CheckinRecord = {
  id: string;
  checkInAt: string;
  checkOutAt: string | null;
  hoursWorked: number | null;
  isVerified: boolean;
  request: { date: string; site: { name: string } };
};

const HOURLY_RATE = 120;

function formatRupees(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function EarningsScreen() {
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyCheckins()
      .then(res => setCheckins(res.data ?? []))
      .catch(() => setCheckins([]))
      .finally(() => setLoading(false));
  }, []);

  const verified = checkins.filter(c => c.isVerified && c.hoursWorked);
  const totalHours = verified.reduce((sum, c) => sum + (c.hoursWorked ?? 0), 0);
  const totalEarnings = totalHours * HOURLY_RATE;
  const pendingCount = checkins.filter(c => !c.isVerified && c.checkOutAt).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💰  मेरी कमाई</Text>
        <Text style={styles.headerSub}>My Earnings</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalHours.toFixed(1)}</Text>
              <Text style={styles.summaryUnit}>घंटे  /  Hours</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatRupees(totalEarnings)}</Text>
              <Text style={styles.summaryUnit}>कुल कमाई  /  Earned</Text>
            </View>
          </View>

          {pendingCount > 0 && (
            <View style={styles.pendingChip}>
              <Text style={styles.pendingChipText}>
                ⏳  {pendingCount} shift{pendingCount > 1 ? 's' : ''} awaiting verification
              </Text>
            </View>
          )}

          {/* Instant Payout — disabled, coming soon */}
          <TouchableOpacity
            style={styles.payoutBtn}
            onPress={() => Alert.alert(
              'जल्द आ रहा है!  Coming Soon',
              'Daily payouts (Earned Wage Access) will launch soon.\nआपके account में पैसे directly आएंगे।\n\nYou will be notified when this feature is live.'
            )}
            activeOpacity={0.8}
          >
            <View style={styles.payoutBtnInner}>
              <Text style={styles.payoutBtnEmoji}>⚡</Text>
              <View>
                <Text style={styles.payoutBtnTitle}>Instant Payout</Text>
                <Text style={styles.payoutBtnSub}>Coming soon — daily payouts launching soon</Text>
              </View>
              <View style={styles.payoutBtnBadge}>
                <Text style={styles.payoutBtnBadgeText}>Soon</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Rate info */}
        <View style={styles.rateCard}>
          <Text style={styles.rateText}>Rate: <Text style={styles.rateAmount}>₹{HOURLY_RATE}/hour</Text></Text>
          <Text style={styles.rateNote}>Earnings are estimated and subject to supervisor verification.</Text>
        </View>

        {/* History */}
        <Text style={styles.sectionLabel}>Shift History</Text>

        {checkins.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No shifts completed yet.</Text>
          </View>
        ) : (
          checkins.map(c => {
            const date = new Date(c.request.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
            const earned = c.hoursWorked ? c.hoursWorked * HOURLY_RATE : null;
            return (
              <View key={c.id} style={styles.shiftRow}>
                <View style={[styles.shiftStatusBar, { backgroundColor: c.isVerified ? '#16A34A' : '#F59E0B' }]} />
                <View style={styles.shiftLeft}>
                  <Text style={styles.shiftSite}>{c.request.site.name}</Text>
                  <Text style={styles.shiftDate}>{date}</Text>
                </View>
                <View style={styles.shiftRight}>
                  {c.hoursWorked ? (
                    <>
                      <Text style={styles.shiftHours}>{c.hoursWorked.toFixed(1)}h</Text>
                      <Text style={styles.shiftEarned}>{formatRupees(earned!)}</Text>
                    </>
                  ) : (
                    <Text style={styles.shiftInProgress}>In progress</Text>
                  )}
                  <View style={[styles.badge, c.isVerified ? styles.badgeVerified : styles.badgePending]}>
                    <Text style={[styles.badgeText, c.isVerified ? styles.badgeTextVerified : styles.badgeTextPending]}>
                      {c.isVerified ? 'Verified' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F5F9' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  summaryCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 18,
    padding: 20,
    gap: 16,
  },
  summaryTop: { flexDirection: 'row' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  summaryUnit: { fontSize: 13, color: '#93C5FD', marginTop: 4, textAlign: 'center' },
  summaryDivider: { width: 1, backgroundColor: '#3B5998', marginVertical: 4 },

  pendingChip: {
    backgroundColor: '#2D4E99',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  pendingChipText: { color: '#FDE68A', fontSize: 14, fontWeight: '600' },

  payoutBtn: {
    backgroundColor: '#2D4E99',
    borderRadius: 12,
    padding: 14,
    opacity: 0.85,
  },
  payoutBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  payoutBtnEmoji: { fontSize: 28 },
  payoutBtnTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  payoutBtnSub: { fontSize: 12, color: '#93C5FD', marginTop: 2 },
  payoutBtnBadge: { marginLeft: 'auto', backgroundColor: '#F59E0B', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  payoutBtnBadgeText: { fontSize: 12, fontWeight: '800', color: '#1F2937' },

  rateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    elevation: 1,
  },
  rateText: { fontSize: 15, color: '#374151' },
  rateAmount: { fontWeight: '800', color: '#15803D' },
  rateNote: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },

  sectionLabel: { fontSize: 16, fontWeight: '700', color: '#374151', paddingTop: 4 },

  emptyBox: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 32, alignItems: 'center', gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { color: '#9CA3AF', fontSize: 15 },

  shiftRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    overflow: 'hidden',
  },
  shiftStatusBar: { width: 5, alignSelf: 'stretch' },
  shiftLeft: { flex: 1, padding: 14 },
  shiftSite: { fontSize: 16, fontWeight: '700', color: '#111827' },
  shiftDate: { color: '#6B7280', fontSize: 13, marginTop: 3 },
  shiftRight: { alignItems: 'flex-end', paddingRight: 14, paddingVertical: 14 },
  shiftHours: { fontSize: 18, fontWeight: '700', color: '#111827', fontVariant: ['tabular-nums'] },
  shiftEarned: { fontSize: 14, color: '#15803D', fontWeight: '600', marginTop: 2 },
  shiftInProgress: { color: '#F59E0B', fontSize: 14, fontWeight: '600' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  badgeVerified: { backgroundColor: '#D1FAE5' },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextVerified: { color: '#065F46' },
  badgeTextPending: { color: '#92400E' },
});

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
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

export default function EarningsScreen() {
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyCheckins()
      .then(res => setCheckins(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const verified = checkins.filter(c => c.isVerified && c.hoursWorked);
  const totalHours = verified.reduce((sum, c) => sum + (c.hoursWorked || 0), 0);
  const estimated = totalHours * HOURLY_RATE;
  const pending = checkins.filter(c => !c.isVerified && c.checkOutAt);

  if (loading) return <View style={styles.center}><Text>Loading...</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Earnings</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalHours.toFixed(1)}h</Text>
            <Text style={styles.summaryLabel}>Verified Hours</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>₹{estimated.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Estimated Earnings</Text>
          </View>
        </View>
        <View style={styles.payoutSection}>
          <TouchableOpacity
            style={styles.payoutBtn}
            onPress={() => Alert.alert(
              'Coming Soon',
              'Instant daily payouts (Earned Wage Access) will be available soon. You will be notified when this feature launches.'
            )}
          >
            <Text style={styles.payoutBtnText}>⚡ Instant Payout</Text>
            <Text style={styles.payoutBtnSub}>Coming soon</Text>
          </TouchableOpacity>
        </View>
      </View>

      {pending.length > 0 && (
        <View style={styles.pendingBox}>
          <Text style={styles.pendingTitle}>⏳ Pending Verification ({pending.length})</Text>
          <Text style={styles.pendingText}>These shifts await supervisor verification before earnings are confirmed.</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Shift History</Text>
      {checkins.length === 0 ? (
        <View style={styles.emptyBox}><Text style={styles.emptyText}>No shifts yet.</Text></View>
      ) : (
        checkins.map(c => (
          <View key={c.id} style={styles.shiftRow}>
            <View>
              <Text style={styles.shiftSite}>{c.request.site.name}</Text>
              <Text style={styles.shiftDate}>
                {new Date(c.request.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {c.hoursWorked ? (
                <Text style={styles.shiftHours}>{c.hoursWorked.toFixed(1)}h • ₹{(c.hoursWorked * HOURLY_RATE).toFixed(0)}</Text>
              ) : (
                <Text style={styles.shiftPending}>In progress</Text>
              )}
              <View style={[styles.verifiedBadge, { backgroundColor: c.isVerified ? '#D1FAE5' : '#FEF3C7' }]}>
                <Text style={{ fontSize: 11, color: c.isVerified ? '#065F46' : '#92400E' }}>
                  {c.isVerified ? 'Verified' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { fontSize: 22, fontWeight: '700', color: '#1E3A5F', padding: 16, paddingTop: 56, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryCard: { margin: 16, backgroundColor: '#1E3A5F', borderRadius: 16, padding: 20 },
  summaryRow: { flexDirection: 'row', marginBottom: 20 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 28, fontWeight: '700', color: '#fff' },
  summaryLabel: { fontSize: 12, color: '#93C5FD', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: '#334D6E' },
  payoutSection: { borderTopWidth: 1, borderTopColor: '#334D6E', paddingTop: 16 },
  payoutBtn: { backgroundColor: '#334D6E', borderRadius: 10, padding: 14, alignItems: 'center', opacity: 0.7 },
  payoutBtnText: { color: '#93C5FD', fontWeight: '600', fontSize: 15 },
  payoutBtnSub: { color: '#60A5FA', fontSize: 11, marginTop: 2 },
  pendingBox: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#FFFBEB', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#FDE68A' },
  pendingTitle: { fontWeight: '600', color: '#92400E', marginBottom: 4 },
  pendingText: { color: '#78350F', fontSize: 13 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  emptyBox: { margin: 16, padding: 24, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center' },
  emptyText: { color: '#9CA3AF' },
  shiftRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 10, padding: 14, elevation: 1 },
  shiftSite: { fontWeight: '600', color: '#111827' },
  shiftDate: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  shiftHours: { fontWeight: '600', color: '#111827' },
  shiftPending: { color: '#F59E0B', fontSize: 13 },
  verifiedBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
});

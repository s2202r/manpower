import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import type { Offer } from '@/app/(tabs)/shifts';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; emoji: string }> = {
  PENDING:  { label: 'New Offer',  bg: '#FEF3C7', text: '#92400E', emoji: '🔔' },
  ACCEPTED: { label: 'Accepted',   bg: '#D1FAE5', text: '#065F46', emoji: '✅' },
  DECLINED: { label: 'Declined',   bg: '#FEE2E2', text: '#991B1B', emoji: '✖' },
  EXPIRED:  { label: 'Expired',    bg: '#F3F4F6', text: '#6B7280', emoji: '⏰' },
  NO_SHOW:  { label: 'No Show',    bg: '#FEE2E2', text: '#991B1B', emoji: '⚠' },
};

const SKILL_LABELS: Record<string, string> = {
  GENERAL_HELPER:  'General Helper',
  FORKLIFT_MHE:    'Forklift / MHE',
  SCANNER_TRAINED: 'Scanner Trained',
  COLD_STORAGE:    'Cold Storage',
};

type Props = {
  offer: Offer;
  responding: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

export default function ShiftCard({ offer, responding, onAccept, onDecline }: Props) {
  const cfg = STATUS_CONFIG[offer.status] ?? STATUS_CONFIG.EXPIRED;
  const date = new Date(offer.request.date).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short',
  });
  const skills = offer.request.skillTags
    .map(s => SKILL_LABELS[s] ?? s.replace(/_/g, ' '))
    .join(' • ');

  return (
    <View style={[styles.card, offer.status === 'PENDING' && styles.cardHighlight]}>
      {/* Status strip */}
      <View style={[styles.statusStrip, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.statusText, { color: cfg.text }]}>
          {cfg.emoji}  {cfg.label}
        </Text>
      </View>

      <View style={styles.body}>
        {/* Site name */}
        <Text style={styles.siteName}>{offer.request.site.name}</Text>
        <Text style={styles.address}>{offer.request.site.address}</Text>

        {/* Date & Time — big for readability */}
        <View style={styles.timeRow}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>📅  Date</Text>
            <Text style={styles.timeValue}>{date}</Text>
          </View>
          <View style={styles.timeSep} />
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>🕐  Time</Text>
            <Text style={styles.timeValue}>{offer.request.shiftStart} – {offer.request.shiftEnd}</Text>
          </View>
        </View>

        {skills.length > 0 && (
          <View style={styles.skillsRow}>
            {offer.request.skillTags.map(s => (
              <View key={s} style={styles.skillChip}>
                <Text style={styles.skillChipText}>{SKILL_LABELS[s] ?? s.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action buttons only for PENDING */}
        {offer.status === 'PENDING' && (
          <View style={styles.actions}>
            {responding ? (
              <View style={styles.respondingRow}>
                <ActivityIndicator color="#1E3A8A" />
                <Text style={styles.respondingText}>Saving…</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.declineBtn}
                  onPress={onDecline}
                  activeOpacity={0.8}
                >
                  <Text style={styles.declineBtnText}>✖  नहीं  /  Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={onAccept}
                  activeOpacity={0.8}
                >
                  <Text style={styles.acceptBtnText}>✓  हां  /  Accept</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHighlight: {
    elevation: 4,
    borderWidth: 2,
    borderColor: '#1E3A8A',
  },
  statusStrip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusText: { fontSize: 14, fontWeight: '700' },
  body: { padding: 16, gap: 10 },
  siteName: { fontSize: 20, fontWeight: '800', color: '#111827' },
  address: { fontSize: 14, color: '#6B7280' },
  timeRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
  },
  timeBlock: { flex: 1 },
  timeSep: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 12 },
  timeLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 },
  timeValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  skillChipText: { fontSize: 13, color: '#1E40AF', fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  respondingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 14,
  },
  respondingText: { color: '#6B7280', fontSize: 16 },
  declineBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 16 },
  acceptBtn: {
    flex: 2,
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  acceptBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 18 },
});

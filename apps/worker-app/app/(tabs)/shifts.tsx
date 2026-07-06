import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert,
} from 'react-native';
import { getMyOffers, respondToOffer } from '@/lib/api';

type Offer = {
  id: string;
  status: string;
  request: {
    id: string;
    date: string;
    shiftStart: string;
    shiftEnd: string;
    skillTags: string[];
    site: { name: string; address: string; lat: number; lng: number; radiusMeters: number };
  };
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  ACCEPTED: '#10B981',
  DECLINED: '#EF4444',
  EXPIRED: '#9CA3AF',
  NO_SHOW: '#EF4444',
};

export default function ShiftsScreen() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOffers = async () => {
    try {
      const res = await getMyOffers();
      setOffers(res.data);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOffers(); }, []);

  const respond = async (offerId: string, status: 'ACCEPTED' | 'DECLINED') => {
    try {
      await respondToOffer(offerId, status);
      fetchOffers();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || e.message);
    }
  };

  const renderOffer = ({ item }: { item: Offer }) => {
    const date = new Date(item.request.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    const skills = item.request.skillTags.map((s: string) => s.replace('_', ' ')).join(', ');
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.siteName}>{item.request.site.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || '#9CA3AF') + '22' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || '#9CA3AF' }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.dateTime}>{date} • {item.request.shiftStart} – {item.request.shiftEnd}</Text>
        <Text style={styles.address}>{item.request.site.address}</Text>
        <Text style={styles.skills}>{skills}</Text>
        {item.status === 'PENDING' && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.declineBtn} onPress={() => respond(item.id, 'DECLINED')}>
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={() => respond(item.id, 'ACCEPTED')}>
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <View style={styles.center}><Text>Loading shifts...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Shifts</Text>
      <FlatList
        data={offers}
        keyExtractor={i => i.id}
        renderItem={renderOffer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOffers(); }} />}
        ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No shifts yet. Offers will appear here.</Text></View>}
        contentContainerStyle={offers.length === 0 ? { flex: 1 } : { padding: 16, gap: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { fontSize: 22, fontWeight: '700', color: '#1E3A5F', padding: 16, paddingTop: 56, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  siteName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  dateTime: { fontSize: 14, color: '#4B5563', marginBottom: 4 },
  address: { fontSize: 13, color: '#9CA3AF', marginBottom: 4 },
  skills: { fontSize: 13, color: '#6B7280' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  declineBtn: { flex: 1, borderWidth: 1, borderColor: '#EF4444', borderRadius: 8, padding: 10, alignItems: 'center' },
  declineBtnText: { color: '#EF4444', fontWeight: '600' },
  acceptBtn: { flex: 1, backgroundColor: '#2563EB', borderRadius: 8, padding: 10, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#6B7280', fontSize: 15 },
});

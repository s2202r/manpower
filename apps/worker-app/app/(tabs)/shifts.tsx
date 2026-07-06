import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator, SafeAreaView, StatusBar,
} from 'react-native';
import { getMyOffers, respondToOffer } from '@/lib/api';
import ShiftCard from '@/components/ShiftCard';

export type Offer = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'NO_SHOW';
  request: {
    id: string;
    date: string;
    shiftStart: string;
    shiftEnd: string;
    skillTags: string[];
    site: { name: string; address: string; lat: number; lng: number; radiusMeters: number };
  };
};

export default function ShiftsScreen() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);

  const fetchOffers = async () => {
    try {
      const res = await getMyOffers();
      setOffers(res.data ?? []);
    } catch {
      setOffers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOffers(); }, []);

  const respond = async (offerId: string, status: 'ACCEPTED' | 'DECLINED') => {
    setResponding(offerId);
    try {
      await respondToOffer(offerId, status);
      await fetchOffers();
    } catch {
      // silently retry on next refresh
    } finally {
      setResponding(null);
    }
  };

  const pending = offers.filter(o => o.status === 'PENDING');
  const others = offers.filter(o => o.status !== 'PENDING');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋  मेरी Shifts</Text>
        <Text style={styles.headerSub}>My Shifts</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : (
        <FlatList
          data={[...pending, ...others]}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <ShiftCard
              offer={item}
              responding={responding === item.id}
              onAccept={() => respond(item.id, 'ACCEPTED')}
              onDecline={() => respond(item.id, 'DECLINED')}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOffers(); }}
              colors={['#1E3A8A']}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>कोई shift नहीं</Text>
              <Text style={styles.emptyText}>No shifts yet. Pull down to refresh.</Text>
            </View>
          }
          contentContainerStyle={offers.length === 0 ? styles.emptyContainer : styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F5F9' },
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
  listContent: { padding: 16, gap: 14 },
  emptyContainer: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#6B7280', fontSize: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptyText: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
});

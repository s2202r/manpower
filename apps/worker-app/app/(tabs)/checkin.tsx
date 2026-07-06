import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { getMyOffers, checkIn, checkOut, getMyCheckins } from '@/lib/api';
import { haversineDistance } from '@/lib/haversine';
import { supabase } from '@/lib/supabase';

type ActiveOffer = {
  id: string;
  request: {
    id: string;
    date: string;
    shiftStart: string;
    shiftEnd: string;
    site: { id: string; name: string; lat: number; lng: number; radiusMeters: number };
  };
};

type ActiveCheckin = { id: string; checkInAt: string; checkOutAt: string | null; requestId: string };

export default function CheckInScreen() {
  const [acceptedOffers, setAcceptedOffers] = useState<ActiveOffer[]>([]);
  const [activeCheckin, setActiveCheckin] = useState<ActiveCheckin | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);

  const load = async () => {
    try {
      const [offersRes, checkinsRes] = await Promise.all([getMyOffers(), getMyCheckins()]);
      const today = new Date().toISOString().split('T')[0];
      const todayAccepted = offersRes.data.filter(
        (o: any) => o.status === 'ACCEPTED' && o.request.date.startsWith(today)
      );
      setAcceptedOffers(todayAccepted);
      const ongoing = checkinsRes.data.find((c: any) => !c.checkOutAt);
      setActiveCheckin(ongoing || null);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const takeSelfie = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) setSelfieUri(result.assets[0].uri);
  };

  const handleCheckIn = async (offer: ActiveOffer) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Location permission required for check-in'); return; }
    if (!selfieUri) { Alert.alert('Take a selfie before checking in'); return; }

    setChecking(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const dist = haversineDistance(
        loc.coords.latitude, loc.coords.longitude,
        offer.request.site.lat, offer.request.site.lng
      );

      if (dist > offer.request.site.radiusMeters) {
        Alert.alert(
          'Outside Geofence',
          `You are ${Math.round(dist)}m from ${offer.request.site.name}. Must be within ${offer.request.site.radiusMeters}m to check in.`
        );
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const fileName = `checkin-${user?.id}-${Date.now()}.jpg`;
      const response = await fetch(selfieUri);
      const blob = await response.blob();
      await supabase.storage.from('checkin-selfies').upload(fileName, blob, { contentType: 'image/jpeg' });
      const { data: urlData } = supabase.storage.from('checkin-selfies').getPublicUrl(fileName);

      await checkIn({
        requestId: offer.request.id,
        siteId: offer.request.site.id,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        selfieUrl: urlData.publicUrl,
      });
      Alert.alert('Checked In!', `Welcome to ${offer.request.site.name}`);
      setSelfieUri(null);
      load();
    } catch (e: any) {
      Alert.alert('Check-in failed', e.response?.data?.message || e.message);
    } finally {
      setChecking(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeCheckin) return;
    setChecking(true);
    try {
      await checkOut(activeCheckin.id);
      Alert.alert('Checked Out', 'Your hours have been logged.');
      load();
    } catch (e: any) {
      Alert.alert('Check-out failed', e.message);
    } finally {
      setChecking(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Check In / Out</Text>

      {activeCheckin && (
        <View style={styles.activeCard}>
          <Text style={styles.activeTitle}>Currently Checked In</Text>
          <Text style={styles.activeTime}>
            Since {new Date(activeCheckin.checkInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckOut} disabled={checking}>
            <Text style={styles.checkoutBtnText}>{checking ? 'Processing...' : 'Check Out'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!activeCheckin && (
        <>
          <Text style={styles.sectionTitle}>Today's Accepted Shifts</Text>
          {acceptedOffers.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No accepted shifts today.</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.selfieBtn} onPress={takeSelfie}>
                <Text style={styles.selfieBtnText}>
                  {selfieUri ? '✓ Selfie taken — ready to check in' : '📷 Take Selfie (required)'}
                </Text>
              </TouchableOpacity>
              {acceptedOffers.map(offer => (
                <View key={offer.id} style={styles.offerCard}>
                  <Text style={styles.offerSite}>{offer.request.site.name}</Text>
                  <Text style={styles.offerTime}>{offer.request.shiftStart} – {offer.request.shiftEnd}</Text>
                  <TouchableOpacity
                    style={[styles.checkinBtn, (!selfieUri || checking) && styles.btnDisabled]}
                    onPress={() => handleCheckIn(offer)}
                    disabled={!selfieUri || checking}
                  >
                    <Text style={styles.checkinBtnText}>{checking ? 'Checking in...' : 'Check In'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { fontSize: 22, fontWeight: '700', color: '#1E3A5F', padding: 16, paddingTop: 56, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  activeCard: { margin: 16, backgroundColor: '#ECFDF5', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#10B981' },
  activeTitle: { fontSize: 18, fontWeight: '700', color: '#065F46', marginBottom: 4 },
  activeTime: { color: '#047857', marginBottom: 12 },
  checkoutBtn: { backgroundColor: '#EF4444', borderRadius: 8, padding: 14, alignItems: 'center' },
  checkoutBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151', padding: 16, paddingBottom: 8 },
  emptyBox: { margin: 16, padding: 24, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center' },
  emptyText: { color: '#9CA3AF' },
  selfieBtn: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#EFF6FF', borderRadius: 8, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' },
  selfieBtnText: { color: '#1D4ED8', fontWeight: '500' },
  offerCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
  offerSite: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  offerTime: { color: '#6B7280', marginBottom: 12 },
  checkinBtn: { backgroundColor: '#2563EB', borderRadius: 8, padding: 14, alignItems: 'center' },
  checkinBtnText: { color: '#fff', fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
});

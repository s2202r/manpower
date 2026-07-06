import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, ScrollView, SafeAreaView, StatusBar,
} from 'react-native';
import * as Location from 'expo-location';
import { getMyOffers, checkIn, checkOut, getMyCheckins } from '@/lib/api';
import { haversineDistance } from '@/lib/haversine';
import { supabase } from '@/lib/supabase';
import GeofenceMap from '@/components/GeofenceMap';
import SelfieCapture from '@/components/SelfieCapture';

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

function useElapsedTimer(startIso: string | null) {
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!startIso) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(startIso).getTime()) / 1000));
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startIso]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function CheckInScreen() {
  const [acceptedOffers, setAcceptedOffers] = useState<ActiveOffer[]>([]);
  const [activeCheckin, setActiveCheckin] = useState<ActiveCheckin | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [workerLocation, setWorkerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<ActiveOffer | null>(null);
  const elapsed = useElapsedTimer(activeCheckin?.checkInAt ?? null);

  const load = async () => {
    try {
      const [offersRes, checkinsRes] = await Promise.all([getMyOffers(), getMyCheckins()]);
      const today = new Date().toISOString().split('T')[0];
      const todayAccepted = offersRes.data.filter(
        (o: any) => o.status === 'ACCEPTED' && o.request.date.startsWith(today)
      );
      setAcceptedOffers(todayAccepted);
      if (todayAccepted.length > 0) setSelectedOffer(todayAccepted[0]);
      const ongoing = checkinsRes.data.find((c: any) => !c.checkOutAt);
      setActiveCheckin(ongoing ?? null);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Poll worker location when on this tab
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 5 },
        loc => setWorkerLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude })
      );
    })();
    return () => { sub?.remove(); };
  }, []);

  const handleCheckIn = async (offer: ActiveOffer) => {
    if (!selfieUri) { Alert.alert('Selfie जरूरी है', 'Please take a selfie first.'); return; }
    if (!workerLocation) { Alert.alert('Location मिल नहीं रहा', 'Waiting for GPS. Please wait and try again.'); return; }

    const dist = haversineDistance(
      workerLocation.lat, workerLocation.lng,
      offer.request.site.lat, offer.request.site.lng
    );

    if (dist > offer.request.site.radiusMeters) {
      Alert.alert(
        'Warehouse में नहीं हैं',
        `You must be at the warehouse to check in. Move closer and try again.\n\nYou are ${Math.round(dist)}m away. Need to be within ${offer.request.site.radiusMeters}m.`
      );
      return;
    }

    setChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileName = `checkin-${user?.id}-${Date.now()}.jpg`;
      const response = await fetch(selfieUri);
      const blob = await response.blob();
      await supabase.storage.from('checkin-selfies').upload(fileName, blob, { contentType: 'image/jpeg' });
      const { data: urlData } = supabase.storage.from('checkin-selfies').getPublicUrl(fileName);

      await checkIn({
        requestId: offer.request.id,
        siteId: offer.request.site.id,
        lat: workerLocation.lat,
        lng: workerLocation.lng,
        selfieUrl: urlData.publicUrl,
      });
      Alert.alert('Check-In हो गया!', `Welcome to ${offer.request.site.name}`);
      setSelfieUri(null);
      load();
    } catch (e: any) {
      Alert.alert('Check-in failed', e.response?.data?.message ?? e.message);
    } finally {
      setChecking(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeCheckin) return;
    setChecking(true);
    try {
      await checkOut(activeCheckin.id);
      Alert.alert('Check-Out हो गया', 'आपके घंटे save हो गए।\nYour hours have been logged.');
      load();
    } catch (e: any) {
      Alert.alert('Check-out failed', e.message);
    } finally {
      setChecking(false);
    }
  };

  const distanceToSite = (offer: ActiveOffer | null): number | null => {
    if (!workerLocation || !offer) return null;
    return haversineDistance(workerLocation.lat, workerLocation.lng, offer.request.site.lat, offer.request.site.lng);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── ACTIVE CHECKIN VIEW ─────────────────────────────────────────────────────
  if (activeCheckin) {
    const checkInTime = new Date(activeCheckin.checkInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor="#15803D" />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.activeHeader}>
            <Text style={styles.activeHeaderTitle}>✅  काम चल रहा है</Text>
            <Text style={styles.activeHeaderSub}>Currently working</Text>
          </View>

          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>Time worked today</Text>
            <Text style={styles.timerDisplay}>{elapsed}</Text>
            <Text style={styles.timerSince}>Started at {checkInTime}</Text>
          </View>

          <TouchableOpacity
            style={[styles.checkoutBtn, checking && styles.btnOff]}
            onPress={handleCheckOut}
            disabled={checking}
            activeOpacity={0.85}
          >
            <Text style={styles.checkoutBtnText}>
              {checking ? 'Processing…' : '🏁  Check Out  /  काम खत्म'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.checkoutNote}>
            Tap when you finish your shift. Your hours will be sent for verification.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── NO SHIFTS TODAY ─────────────────────────────────────────────────────────
  if (acceptedOffers.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📍  Check In</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🏭</Text>
          <Text style={styles.emptyTitle}>आज कोई shift नहीं</Text>
          <Text style={styles.emptyText}>No accepted shifts today. Accept a shift from the Shifts tab first.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── READY TO CHECK IN ───────────────────────────────────────────────────────
  const offer = selectedOffer ?? acceptedOffers[0];
  const dist = distanceToSite(offer);
  const inside = dist !== null && dist <= offer.request.site.radiusMeters;
  const canCheckIn = inside && !!selfieUri && !checking;
  const distLabel = dist !== null ? `${Math.round(dist)}m away` : 'Getting location…';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📍  Check In</Text>
        <Text style={styles.headerSub}>{offer.request.site.name}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Geofence Map */}
        <GeofenceMap
          workerLat={workerLocation?.lat ?? null}
          workerLng={workerLocation?.lng ?? null}
          siteLat={offer.request.site.lat}
          siteLng={offer.request.site.lng}
          siteRadius={offer.request.site.radiusMeters}
          siteName={offer.request.site.name}
          inside={inside}
          distanceMeters={dist}
        />

        {/* Distance indicator */}
        <View style={[styles.distBadge, inside ? styles.distBadgeIn : styles.distBadgeOut]}>
          <Text style={[styles.distBadgeText, inside ? styles.distBadgeTextIn : styles.distBadgeTextOut]}>
            {inside ? `✓  You are inside the warehouse zone` : `⚠  ${distLabel} from ${offer.request.site.name}`}
          </Text>
        </View>

        {!inside && (
          <View style={styles.geofenceAlert}>
            <Text style={styles.geofenceAlertTitle}>Warehouse में जाएं</Text>
            <Text style={styles.geofenceAlertBody}>
              You must be at the warehouse to check in. Move closer and try again.
            </Text>
          </View>
        )}

        {/* Selfie */}
        <SelfieCapture
          selfieUri={selfieUri}
          onCapture={setSelfieUri}
        />

        {/* BIG CHECK-IN BUTTON */}
        <TouchableOpacity
          style={[styles.bigCheckinBtn, !canCheckIn && styles.bigCheckinBtnOff]}
          onPress={() => handleCheckIn(offer)}
          disabled={!canCheckIn}
          activeOpacity={0.85}
        >
          <Text style={styles.bigCheckinBtnText}>
            {checking
              ? '⏳  Checking in…'
              : canCheckIn
              ? '✅  Check In Now'
              : !selfieUri
              ? '📷  Selfie लें पहले'
              : '📍  Warehouse पहुंचें पहले'}
          </Text>
          {!canCheckIn && !checking && (
            <Text style={styles.bigCheckinBtnSub}>
              {!selfieUri
                ? 'Take selfie first'
                : 'Move to warehouse to unlock check-in'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.shiftInfo}>
          <Text style={styles.shiftInfoTitle}>Today's Shift</Text>
          <Text style={styles.shiftInfoText}>{offer.request.shiftStart} – {offer.request.shiftEnd}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F5F9' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 14 },
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  loadingText: { color: '#6B7280', fontSize: 16 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#374151' },
  emptyText: { color: '#6B7280', fontSize: 15, textAlign: 'center' },

  // Active / working state
  activeHeader: {
    backgroundColor: '#15803D',
    marginHorizontal: -16,
    marginTop: -16,
    padding: 24,
    paddingTop: 28,
    alignItems: 'center',
  },
  activeHeaderTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  activeHeaderSub: { color: '#BBF7D0', fontSize: 15, marginTop: 4 },
  timerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    elevation: 2,
  },
  timerLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  timerDisplay: { fontSize: 56, fontWeight: '800', color: '#15803D', fontVariant: ['tabular-nums'], marginVertical: 8 },
  timerSince: { color: '#6B7280', fontSize: 15 },
  checkoutBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  checkoutBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 22 },
  checkoutNote: { color: '#6B7280', fontSize: 14, textAlign: 'center', paddingHorizontal: 8 },

  // Ready to check in
  distBadge: {
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  distBadgeIn: { backgroundColor: '#D1FAE5' },
  distBadgeOut: { backgroundColor: '#FEF3C7' },
  distBadgeText: { fontWeight: '700', fontSize: 15 },
  distBadgeTextIn: { color: '#065F46' },
  distBadgeTextOut: { color: '#92400E' },

  geofenceAlert: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    padding: 16,
  },
  geofenceAlertTitle: { fontSize: 17, fontWeight: '800', color: '#C2410C', marginBottom: 4 },
  geofenceAlertBody: { fontSize: 15, color: '#7C2D12' },

  bigCheckinBtn: {
    backgroundColor: '#15803D',
    borderRadius: 16,
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  bigCheckinBtnOff: { backgroundColor: '#D1D5DB', elevation: 0 },
  bigCheckinBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 24, textAlign: 'center' },
  bigCheckinBtnSub: { color: '#F0FDF4', fontSize: 14, marginTop: 4, textAlign: 'center', opacity: 0.9 },
  bigCheckinBtnOffText: { color: '#6B7280' },

  shiftInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  shiftInfoTitle: { fontSize: 13, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  shiftInfoText: { fontSize: 20, fontWeight: '700', color: '#111827' },

  btnOff: { opacity: 0.6 },
});

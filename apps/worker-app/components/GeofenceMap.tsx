/**
 * GeofenceMap — a canvas-based visual showing:
 *   - The warehouse site circle (geofence)
 *   - The worker's current position relative to the site
 *
 * Uses no external map SDK (CSP-safe, works offline-ish).
 * Draws a compass-rose-style diagram scaled to the geofence radius.
 */
import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

type Props = {
  workerLat: number | null;
  workerLng: number | null;
  siteLat: number;
  siteLng: number;
  siteRadius: number; // meters
  siteName: string;
  inside: boolean;
  distanceMeters: number | null;
};

// On native we render a pure RN visual (no canvas).
// The canvas branch is kept for potential Expo Web use.
function GeofenceVisual({
  workerLat, workerLng, siteLat, siteLng,
  siteRadius, inside, distanceMeters,
}: Props) {
  // Compute worker position on the diagram (capped at edge if far outside)
  let workerX = 0.5;
  let workerY = 0.5;

  if (workerLat !== null && workerLng !== null) {
    // Rough pixel offset based on lat/lng difference
    // 1 degree lat ≈ 111000m; 1 degree lng ≈ 111000m * cos(lat)
    const dLat = (workerLat - siteLat) * 111000;
    const dLng = (workerLng - siteLng) * 111000 * Math.cos((siteLat * Math.PI) / 180);
    // Scale: display radius = siteRadius * 2.2 maps to half the view
    const scale = 0.38 / (siteRadius * 2.2);
    const rawX = 0.5 + dLng * scale;
    const rawY = 0.5 - dLat * scale;
    // Clamp within visible circle with a small margin
    const dx = rawX - 0.5;
    const dy = rawY - 0.5;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxR = 0.47;
    if (dist > maxR) {
      workerX = 0.5 + (dx / dist) * maxR;
      workerY = 0.5 + (dy / dist) * maxR;
    } else {
      workerX = rawX;
      workerY = rawY;
    }
  }

  // Render as a styled View diagram
  const SIZE = 200;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  // Geofence circle radius in display px (38% of container)
  const geofenceR = SIZE * 0.38;
  const workerPx = { x: workerX * SIZE, y: workerY * SIZE };

  return (
    <View style={[mapStyles.mapWrap, { width: SIZE, height: SIZE }]}>
      {/* Outer background */}
      <View style={[mapStyles.bgCircle, { width: SIZE, height: SIZE, borderRadius: SIZE / 2 }]} />

      {/* Geofence ring */}
      <View
        style={[
          mapStyles.geofenceRing,
          {
            width: geofenceR * 2,
            height: geofenceR * 2,
            borderRadius: geofenceR,
            left: cx - geofenceR,
            top: cy - geofenceR,
            borderColor: inside ? '#16A34A' : '#F59E0B',
            backgroundColor: inside ? '#DCFCE722' : '#FEF9C322',
          },
        ]}
      />

      {/* Site center dot */}
      <View
        style={[
          mapStyles.siteDot,
          {
            left: cx - 10,
            top: cy - 10,
            backgroundColor: inside ? '#16A34A' : '#F59E0B',
          },
        ]}
      />
      <View style={[mapStyles.siteLabel, { left: cx - 24, top: cy + 12 }]}>
        <Text style={mapStyles.siteLabelText}>🏭</Text>
      </View>

      {/* Worker dot */}
      {workerLat !== null && (
        <View
          style={[
            mapStyles.workerDot,
            {
              left: workerPx.x - 8,
              top: workerPx.y - 8,
              backgroundColor: inside ? '#1E3A8A' : '#DC2626',
            },
          ]}
        />
      )}
      {workerLat !== null && (
        <View style={[mapStyles.workerLabel, { left: workerPx.x - 6, top: workerPx.y + 10 }]}>
          <Text style={mapStyles.workerLabelText}>👤</Text>
        </View>
      )}

      {/* Radius label */}
      <View style={mapStyles.radiusLabel}>
        <Text style={mapStyles.radiusText}>{siteRadius}m zone</Text>
      </View>
    </View>
  );
}

export default function GeofenceMap(props: Props) {
  const { workerLat, siteName, inside, distanceMeters } = props;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍  आपकी Location</Text>

      <View style={styles.mapRow}>
        <GeofenceVisual {...props} />

        <View style={styles.legend}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: inside ? '#16A34A' : '#F59E0B' }]} />
            <Text style={styles.legendText}>Warehouse zone</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: inside ? '#1E3A8A' : '#DC2626' }]} />
            <Text style={styles.legendText}>Your location</Text>
          </View>
          <View style={styles.legendRow}>
            <Text style={styles.legendEmoji}>🏭</Text>
            <Text style={styles.legendText}>{siteName}</Text>
          </View>
          {workerLat === null && (
            <Text style={styles.gpsWait}>GPS मिल रहा है…{'\n'}Getting GPS…</Text>
          )}
          {distanceMeters !== null && (
            <View style={[styles.distPill, inside ? styles.distPillIn : styles.distPillOut]}>
              <Text style={[styles.distPillText, inside ? styles.distPillTextIn : styles.distPillTextOut]}>
                {inside ? `Inside zone` : `${Math.round(distanceMeters)}m away`}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const mapStyles = StyleSheet.create({
  mapWrap: { position: 'relative' },
  bgCircle: {
    position: 'absolute',
    backgroundColor: '#F1F5F9',
  },
  geofenceRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  siteDot: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  siteLabel: { position: 'absolute' },
  siteLabelText: { fontSize: 18 },
  workerDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  workerLabel: { position: 'absolute' },
  workerLabelText: { fontSize: 16 },
  radiusLabel: {
    position: 'absolute',
    bottom: 6,
    right: 6,
  },
  radiusText: { fontSize: 10, color: '#9CA3AF' },
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 1,
  },
  title: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 14 },
  mapRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  legend: { flex: 1, gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendEmoji: { fontSize: 16 },
  legendText: { fontSize: 13, color: '#374151', flexShrink: 1 },
  gpsWait: { color: '#9CA3AF', fontSize: 13 },
  distPill: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  distPillIn: { backgroundColor: '#D1FAE5' },
  distPillOut: { backgroundColor: '#FEF3C7' },
  distPillText: { fontWeight: '700', fontSize: 14 },
  distPillTextIn: { color: '#065F46' },
  distPillTextOut: { color: '#92400E' },
});

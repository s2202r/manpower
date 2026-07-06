/**
 * SelfieCapture — a component that:
 *   1. Shows a large "Take Selfie" button when no photo is captured
 *   2. Shows a thumbnail preview + retake option when captured
 *
 * Uses expo-image-picker (launchCameraAsync with front camera when available).
 */
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

type Props = {
  selfieUri: string | null;
  onCapture: (uri: string) => void;
};

export default function SelfieCapture({ selfieUri, onCapture }: Props) {
  const takeSelfie = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert(
        'Camera Permission',
        'Camera permission is required to take a selfie for check-in.\n\nPlease allow camera access in your phone settings.'
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.75,
      allowsEditing: false,
      cameraType: ImagePicker.CameraType.front,
    });
    if (!result.canceled) {
      onCapture(result.assets[0].uri);
    }
  };

  if (selfieUri) {
    return (
      <View style={styles.doneContainer}>
        <Image source={{ uri: selfieUri }} style={styles.preview} />
        <View style={styles.doneInfo}>
          <Text style={styles.doneTitle}>✅  Selfie ली गई</Text>
          <Text style={styles.doneSubtitle}>Selfie captured</Text>
          <TouchableOpacity style={styles.retakeBtn} onPress={takeSelfie} activeOpacity={0.8}>
            <Text style={styles.retakeBtnText}>📷  दोबारा लें  /  Retake</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.captureBtn} onPress={takeSelfie} activeOpacity={0.85}>
      <Text style={styles.cameraEmoji}>🤳</Text>
      <Text style={styles.captureBtnTitle}>Selfie लें</Text>
      <Text style={styles.captureBtnSub}>Take selfie to check in</Text>
      <Text style={styles.captureBtnRequired}>Required  /  जरूरी है</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  captureBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  cameraEmoji: { fontSize: 48, marginBottom: 4 },
  captureBtnTitle: { fontSize: 22, fontWeight: '800', color: '#1E3A8A' },
  captureBtnSub: { fontSize: 15, color: '#3B82F6' },
  captureBtnRequired: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  doneContainer: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#16A34A',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  preview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#16A34A',
  },
  doneInfo: { flex: 1, gap: 4 },
  doneTitle: { fontSize: 18, fontWeight: '800', color: '#15803D' },
  doneSubtitle: { fontSize: 13, color: '#6B7280' },
  retakeBtn: {
    marginTop: 6,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  retakeBtnText: { color: '#166534', fontWeight: '700', fontSize: 14 },
});

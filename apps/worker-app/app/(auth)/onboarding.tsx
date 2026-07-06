import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, SafeAreaView, StatusBar, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { updateMyProfile } from '@/lib/api';

const SKILLS: { key: string; hi: string; en: string; emoji: string }[] = [
  { key: 'GENERAL_HELPER',  hi: 'सामान्य हेल्पर',  en: 'General Helper',  emoji: '📦' },
  { key: 'FORKLIFT_MHE',    hi: 'फोर्कलिफ्ट',      en: 'Forklift / MHE',  emoji: '🚜' },
  { key: 'SCANNER_TRAINED', hi: 'स्कैनर',            en: 'Scanner Trained', emoji: '📡' },
  { key: 'COLD_STORAGE',    hi: 'कोल्ड स्टोरेज',     en: 'Cold Storage',    emoji: '❄️' },
];

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [kycUri, setKycUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=name+skills, 2=photo+kyc

  const toggleSkill = (key: string) => {
    setSelectedSkills(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') { Alert.alert('Camera permission needed'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const pickKYC = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled) setKycUri(result.assets[0].uri);
  };

  const goToStep2 = () => {
    if (!name.trim()) { Alert.alert('नाम डालें', 'Please enter your full name.'); return; }
    if (selectedSkills.length === 0) { Alert.alert('Skill चुनें', 'Please select at least one skill.'); return; }
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await updateMyProfile({
        name: name.trim(),
        skills: selectedSkills,
        kycStatus: kycUri ? 'PENDING' : 'NOT_SUBMITTED',
      });
      router.replace('/(tabs)/shifts');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Progress */}
        <View style={styles.progressRow}>
          <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
          <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
          <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
        </View>

        {step === 1 ? (
          <>
            <Text style={styles.stepLabel}>Step 1 of 2</Text>
            <Text style={styles.title}>अपना नाम बताएं</Text>
            <Text style={styles.titleEn}>Tell us about yourself</Text>

            <Text style={styles.fieldLabel}>पूरा नाम  /  Full Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Ramesh Kumar"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
              fontSize={18}
            />

            <Text style={styles.fieldLabel}>आपकी Skills  /  Your Skills</Text>
            <View style={styles.skillsGrid}>
              {SKILLS.map(skill => {
                const active = selectedSkills.includes(skill.key);
                return (
                  <TouchableOpacity
                    key={skill.key}
                    style={[styles.skillCard, active && styles.skillCardActive]}
                    onPress={() => toggleSkill(skill.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.skillEmoji}>{skill.emoji}</Text>
                    <Text style={[styles.skillHi, active && styles.skillTextActive]}>{skill.hi}</Text>
                    <Text style={[styles.skillEn, active && styles.skillTextActive]}>{skill.en}</Text>
                    {active && <Text style={styles.skillCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={goToStep2} activeOpacity={0.85}>
              <Text style={styles.nextBtnText}>Next  →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={styles.backBtn}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.stepLabel}>Step 2 of 2</Text>
            <Text style={styles.title}>फोटो और दस्तावेज़</Text>
            <Text style={styles.titleEn}>Photo & Documents</Text>

            {/* Profile Photo */}
            <Text style={styles.fieldLabel}>Profile Photo  /  प्रोफाइल फोटो</Text>
            <TouchableOpacity style={[styles.uploadCard, photoUri && styles.uploadCardDone]} onPress={pickPhoto} activeOpacity={0.8}>
              {photoUri ? (
                <View style={styles.photoPreviewRow}>
                  <Image source={{ uri: photoUri }} style={styles.photoThumb} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.uploadDoneText}>✓  Photo captured</Text>
                    <Text style={styles.uploadChangeTip}>Tap to retake</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadPrompt}>
                  <Text style={styles.uploadIcon}>📷</Text>
                  <Text style={styles.uploadMainText}>अपनी फोटो लें</Text>
                  <Text style={styles.uploadSubText}>Take your photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* KYC */}
            <Text style={styles.fieldLabel}>
              KYC Document  <Text style={styles.optionalTag}>(Optional)</Text>
            </Text>
            <TouchableOpacity style={[styles.uploadCard, kycUri && styles.uploadCardDone]} onPress={pickKYC} activeOpacity={0.8}>
              {kycUri ? (
                <View style={styles.uploadPrompt}>
                  <Text style={styles.uploadIcon}>✅</Text>
                  <Text style={styles.uploadDoneText}>Document selected</Text>
                  <Text style={styles.uploadChangeTip}>Tap to change</Text>
                </View>
              ) : (
                <View style={styles.uploadPrompt}>
                  <Text style={styles.uploadIcon}>🪪</Text>
                  <Text style={styles.uploadMainText}>Aadhaar / PAN card</Text>
                  <Text style={styles.uploadSubText}>Upload for faster KYC</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.kycNotice}>
              <Text style={styles.kycNoticeText}>
                KYC verification launches soon. Upload now for priority approval.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnOff]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>
                {loading ? 'Saving…' : 'Profile बनाएं  /  Complete Profile'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 60 },

  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  progressDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#E5E7EB' },
  progressDotActive: { backgroundColor: '#1E3A8A' },
  progressLine: { flex: 1, height: 3, backgroundColor: '#E5E7EB', marginHorizontal: 6 },
  progressLineActive: { backgroundColor: '#1E3A8A' },

  backBtn: { fontSize: 17, color: '#2563EB', fontWeight: '600', marginBottom: 16 },
  stepLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827' },
  titleEn: { fontSize: 15, color: '#6B7280', marginTop: 2, marginBottom: 28 },

  fieldLabel: { fontSize: 17, fontWeight: '700', color: '#374151', marginBottom: 10, marginTop: 8 },
  optionalTag: { fontWeight: '400', color: '#9CA3AF', fontSize: 14 },

  textInput: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#111827',
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
  },

  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  skillCard: {
    width: '47%',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  skillCardActive: { borderColor: '#1E3A8A', backgroundColor: '#EFF6FF' },
  skillEmoji: { fontSize: 30, marginBottom: 6 },
  skillHi: { fontSize: 15, fontWeight: '700', color: '#374151', textAlign: 'center' },
  skillEn: { fontSize: 12, color: '#6B7280', marginTop: 2, textAlign: 'center' },
  skillTextActive: { color: '#1E3A8A' },
  skillCheck: { position: 'absolute', top: 8, right: 10, fontSize: 16, color: '#1E3A8A', fontWeight: '800' },

  nextBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 14,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  nextBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 20 },

  uploadCard: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
  },
  uploadCardDone: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  uploadPrompt: { alignItems: 'center' },
  uploadIcon: { fontSize: 40, marginBottom: 8 },
  uploadMainText: { fontSize: 18, fontWeight: '700', color: '#111827' },
  uploadSubText: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  uploadDoneText: { fontSize: 17, fontWeight: '700', color: '#15803D' },
  uploadChangeTip: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  photoPreviewRow: { flexDirection: 'row', alignItems: 'center' },
  photoThumb: { width: 64, height: 64, borderRadius: 32 },

  kycNotice: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 28,
  },
  kycNoticeText: { color: '#1D4ED8', fontSize: 14 },

  submitBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 14,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  submitBtnOff: { backgroundColor: '#93C5FD', elevation: 0 },
  submitBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 20 },
});

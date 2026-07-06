import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { updateMyProfile } from '@/lib/api';

const SKILLS = ['GENERAL_HELPER', 'FORKLIFT_MHE', 'SCANNER_TRAINED', 'COLD_STORAGE'];
const SKILL_LABELS: Record<string, string> = {
  GENERAL_HELPER: 'General Helper',
  FORKLIFT_MHE: 'Forklift / MHE',
  SCANNER_TRAINED: 'Scanner Trained',
  COLD_STORAGE: 'Cold Storage',
};

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [kycUri, setKycUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const pickKYC = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) setKycUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!name) { Alert.alert('Enter your name'); return; }
    if (selectedSkills.length === 0) { Alert.alert('Select at least one skill'); return; }
    setLoading(true);
    try {
      await updateMyProfile({ name, skills: selectedSkills, kycStatus: kycUri ? 'PENDING' : 'NOT_SUBMITTED' });
      router.replace('/(tabs)/shifts');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Set Up Your Profile</Text>
      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} placeholder="Your name" value={name} onChangeText={setName} />
      <Text style={styles.label}>Skills</Text>
      <View style={styles.skillsRow}>
        {SKILLS.map(skill => (
          <TouchableOpacity
            key={skill}
            style={[styles.skillChip, selectedSkills.includes(skill) && styles.skillChipActive]}
            onPress={() => toggleSkill(skill)}
          >
            <Text style={[styles.skillText, selectedSkills.includes(skill) && styles.skillTextActive]}>
              {SKILL_LABELS[skill]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>Profile Photo</Text>
      <TouchableOpacity style={styles.uploadBtn} onPress={pickPhoto}>
        <Text style={styles.uploadText}>{photoUri ? '✓ Photo captured' : 'Take Photo'}</Text>
      </TouchableOpacity>
      <Text style={styles.label}>KYC Document <Text style={styles.optional}>(Optional — verification coming soon)</Text></Text>
      <TouchableOpacity style={styles.uploadBtn} onPress={pickKYC}>
        <Text style={styles.uploadText}>{kycUri ? '✓ Document selected' : 'Upload Aadhaar / PAN'}</Text>
      </TouchableOpacity>
      <View style={styles.kycNote}>
        <Text style={styles.kycNoteText}>📋 KYC verification (Aadhaar/police verification) is coming soon. Upload now to get priority verification when it launches.</Text>
      </View>
      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Saving...' : 'Complete Profile'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700', color: '#1E3A5F', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  optional: { fontWeight: '400', color: '#9CA3AF' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  skillChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  skillText: { color: '#374151', fontSize: 14 },
  skillTextActive: { color: '#fff' },
  uploadBtn: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 14, alignItems: 'center', borderStyle: 'dashed' },
  uploadText: { color: '#6B7280', fontSize: 15 },
  kycNote: { backgroundColor: '#EFF6FF', borderRadius: 8, padding: 12, marginTop: 8 },
  kycNoteText: { color: '#1D4ED8', fontSize: 13 },
  btn: { backgroundColor: '#2563EB', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 32 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

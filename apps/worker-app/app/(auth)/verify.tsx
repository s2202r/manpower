import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) { Alert.alert('Enter the 6-digit OTP'); return; }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    setLoading(false);
    if (error) { Alert.alert('Invalid OTP', error.message); }
    else { router.replace('/(tabs)/shifts'); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to {phone}</Text>
        <TextInput
          style={styles.otpInput}
          placeholder="------"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          textAlign="center"
        />
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify & Continue'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#1E3A5F', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 32 },
  otpInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 16, fontSize: 24, letterSpacing: 8, marginBottom: 16 },
  btn: { backgroundColor: '#2563EB', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

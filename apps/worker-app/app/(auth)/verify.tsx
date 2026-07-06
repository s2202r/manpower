import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, SafeAreaView,
  StatusBar, TouchableWithoutFeedback,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const isReady = otp.length === 6;

  const handleVerify = async () => {
    if (!isReady) { Alert.alert('Enter the 6-digit OTP sent to your phone'); return; }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    setLoading(false);
    if (error) {
      Alert.alert('गलत OTP', 'Wrong OTP. Please check and try again.\nOTP गलत है। फिर से जांचें।');
    } else {
      router.replace('/(tabs)/shifts');
    }
  };

  const displayPhone = phone?.replace('+91', '') ?? '';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <TouchableWithoutFeedback onPress={() => router.back()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableWithoutFeedback>

          <View style={styles.topArea}>
            <Text style={styles.smsEmoji}>💬</Text>
            <Text style={styles.title}>OTP डालें</Text>
            <Text style={styles.titleEn}>Enter OTP</Text>
            <Text style={styles.sentTo}>
              Code sent to  <Text style={styles.phoneNum}>+91 {displayPhone}</Text>
            </Text>
          </View>

          <View style={[styles.otpWrap, isReady && styles.otpWrapReady]}>
            <TextInput
              style={styles.otpInput}
              placeholder="• • • • • •"
              placeholderTextColor="#CBD5E1"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              textAlign="center"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleVerify}
            />
          </View>

          <TouchableOpacity
            style={[styles.cta, (!isReady || loading) && styles.ctaOff]}
            onPress={handleVerify}
            disabled={!isReady || loading}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>
              {loading ? 'Verifying…' : 'Confirm  /  पुष्टि करें'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendBtn}
            onPress={() => Alert.alert('Resend', 'A new OTP will be sent shortly.')}
          >
            <Text style={styles.resendText}>Resend OTP  /  OTP दोबारा भेजें</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  kav: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 16, paddingBottom: 32 },

  backBtn: { fontSize: 17, color: '#2563EB', fontWeight: '600', marginBottom: 36 },

  topArea: { alignItems: 'center', marginBottom: 40 },
  smsEmoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  titleEn: { fontSize: 16, color: '#6B7280', marginTop: 2, marginBottom: 14 },
  sentTo: { fontSize: 16, color: '#6B7280' },
  phoneNum: { fontWeight: '700', color: '#1E3A8A' },

  otpWrap: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    height: 80,
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
  },
  otpWrapReady: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  otpInput: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 14,
    paddingHorizontal: 24,
  },

  cta: {
    backgroundColor: '#1E3A8A',
    borderRadius: 14,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    marginBottom: 16,
  },
  ctaOff: { backgroundColor: '#93C5FD', elevation: 0 },
  ctaText: { color: '#FFFFFF', fontWeight: '800', fontSize: 20 },

  resendBtn: { alignItems: 'center', padding: 14 },
  resendText: { color: '#2563EB', fontSize: 15, fontWeight: '600' },
});

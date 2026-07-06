import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, StatusBar, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const isReady = phone.length === 10;

  const handleSendOTP = async () => {
    if (!isReady) {
      Alert.alert('गलत नंबर', 'Please enter a 10-digit mobile number.');
      return;
    }
    setLoading(true);
    const formattedPhone = `+91${phone}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.push({ pathname: '/(auth)/verify', params: { phone: formattedPhone } });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* Logo / Brand */}
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>🏭</Text>
            <Text style={styles.heroTitle}>Manpower</Text>
            <Text style={styles.heroSub}>Worker App</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>अपना नंबर डालें</Text>
            <Text style={styles.labelEn}>Enter your mobile number</Text>

            <View style={[styles.inputWrap, isReady && styles.inputWrapActive]}>
              <View style={styles.dialCode}>
                <Text style={styles.flag}>🇮🇳</Text>
                <Text style={styles.dialText}>+91</Text>
              </View>
              <View style={styles.divider} />
              <TextInput
                style={styles.numberInput}
                placeholder="9876543210"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                returnKeyType="done"
                onSubmitEditing={handleSendOTP}
                autoFocus
              />
              {isReady && <Text style={styles.tick}>✓</Text>}
            </View>

            <TouchableOpacity
              style={[styles.cta, (!isReady || loading) && styles.ctaOff]}
              onPress={handleSendOTP}
              disabled={!isReady || loading}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>
                {loading ? 'भेज रहे हैं…  Sending…' : 'OTP भेजें  /  Send OTP'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.privacy}>
              🔒  Your number is private and secure
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  kav: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 28, justifyContent: 'center', paddingBottom: 32 },

  hero: { alignItems: 'center', marginBottom: 52 },
  heroEmoji: { fontSize: 64, marginBottom: 10 },
  heroTitle: { fontSize: 36, fontWeight: '800', color: '#1E3A8A', letterSpacing: -0.5 },
  heroSub: { fontSize: 17, color: '#6B7280', marginTop: 2 },

  form: { gap: 0 },
  label: { fontSize: 24, fontWeight: '700', color: '#111827' },
  labelEn: { fontSize: 15, color: '#6B7280', marginTop: 2, marginBottom: 20 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    height: 68,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
  },
  inputWrapActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  dialCode: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  flag: { fontSize: 22, marginRight: 6 },
  dialText: { fontSize: 20, fontWeight: '700', color: '#374151' },
  divider: { width: 1, height: 36, backgroundColor: '#E5E7EB', marginRight: 4 },
  numberInput: { flex: 1, paddingHorizontal: 12, fontSize: 24, fontWeight: '600', color: '#111827', letterSpacing: 2 },
  tick: { fontSize: 26, color: '#16A34A', paddingRight: 16 },

  cta: {
    backgroundColor: '#1E3A8A',
    borderRadius: 14,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    marginBottom: 20,
  },
  ctaOff: { backgroundColor: '#93C5FD', elevation: 0 },
  ctaText: { color: '#FFFFFF', fontWeight: '800', fontSize: 20 },

  privacy: { textAlign: 'center', color: '#9CA3AF', fontSize: 14 },
});

import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Enter a valid phone number');
      return;
    }
    setLoading(true);
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.push({ pathname: '/(auth)/verify', params: { phone: formattedPhone } });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text style={styles.title}>Manpower Worker</Text>
        <Text style={styles.subtitle}>Enter your mobile number to get started</Text>
        <View style={styles.inputRow}>
          <Text style={styles.prefix}>+91</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        </View>
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSendOTP}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Sending...' : 'Get OTP'}</Text>
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
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, marginBottom: 16 },
  prefix: { paddingHorizontal: 12, fontSize: 16, color: '#374151' },
  input: { flex: 1, padding: 12, fontSize: 16 },
  btn: { backgroundColor: '#2563EB', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import { OtpInput } from '../../src/components/OtpInput';
import { ErrorMessage } from '../../src/components/ui/ErrorMessage';
import { colors } from '../../src/theme/colors';

export default function VerifyOtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const router = useRouter();
  const auth = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const maskedPhone = phone
    ? `+90 ${phone.slice(0, 3)} *** ** ${phone.slice(-2)}`
    : '';

  const handleComplete = async (code: string) => {
    if (!phone || loading) return;
    setError('');
    setLoading(true);
    setHasError(false);
    try {
      await auth.verifyOtp(phone, code);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'OTP dogrulama basarisiz');
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>📱</Text>
        </View>
        <Text style={styles.title}>SMS Dogrulama</Text>
        <Text style={styles.subtitle}>{maskedPhone}</Text>
        <Text style={styles.desc}>Telefonunuza gonderilen 6 haneli kodu girin</Text>
      </View>

      <View style={styles.card}>
        {error ? <ErrorMessage message={error} onDismiss={() => setError('')} /> : null}

        <OtpInput onComplete={handleComplete} error={hasError} />

        {loading && (
          <Text style={styles.loadingText}>Dogrulaniyor...</Text>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Gelistirme Modu</Text>
          <Text style={styles.infoText}>OTP kodu: 111111</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoBox: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: colors.primary[600], justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  iconText: { fontSize: 28 },
  title: { fontSize: 24, fontWeight: '800', color: colors.gray[900] },
  subtitle: { fontSize: 16, fontWeight: '600', color: colors.primary[600], marginTop: 8 },
  desc: { fontSize: 14, color: colors.gray[500], marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: colors.white, borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5,
  },
  loadingText: {
    textAlign: 'center', marginTop: 16, fontSize: 14, color: colors.primary[600], fontWeight: '500',
  },
  infoBox: {
    backgroundColor: colors.yellow[50], borderWidth: 1, borderColor: colors.yellow[300],
    borderRadius: 10, padding: 12, marginTop: 24,
  },
  infoTitle: { fontSize: 13, fontWeight: '600', color: colors.yellow[800] },
  infoText: { fontSize: 13, color: colors.yellow[700], marginTop: 2, fontFamily: 'monospace' },
});

import React, { useState } from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { ErrorMessage } from '../../src/components/ui/ErrorMessage';
import { colors } from '../../src/theme/colors';

export default function LoginScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [tckn, setTckn] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await auth.login(tckn, phone);
      router.push({ pathname: '/(auth)/verify-otp', params: { phone } });
    } catch (e: any) {
      setError(e.message || 'Giris basarisiz');
    } finally {
      setLoading(false);
    }
  };

  const isValid = tckn.length === 11 && phone.length === 10;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBox}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🔐</Text>
          </View>
          <Text style={styles.title}>SecureLend</Text>
          <Text style={styles.subtitle}>Hesabiniza giris yapin</Text>
        </View>

        <View style={styles.card}>
          {error ? <ErrorMessage message={error} onDismiss={() => setError('')} /> : null}

          <Input
            label="TCKN"
            placeholder="11 haneli TC Kimlik No"
            value={tckn}
            onChangeText={(t) => setTckn(t.replace(/\D/g, '').slice(0, 11))}
            keyboardType="number-pad"
            maxLength={11}
          />

          <Input
            label="Telefon"
            prefix="+90"
            placeholder="5XX XXX XX XX"
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
            keyboardType="phone-pad"
            maxLength={10}
          />

          <Button
            title={loading ? 'Giris yapiliyor...' : 'Giris Yap'}
            onPress={handleLogin}
            loading={loading}
            disabled={!isValid}
            style={{ marginTop: 8 }}
          />

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Hesabiniz yok mu? </Text>
            <Link href="/(auth)/register">
              <Text style={styles.linkBold}>Kayit Ol</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoBox: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: { fontSize: 28 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary[800],
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray[500],
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  linkText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  linkBold: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
});

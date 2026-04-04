import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/lib/auth-context';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { ErrorMessage } from '../../src/components/ui/ErrorMessage';
import { colors } from '../../src/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 280;
const CARD_OVERLAP = 24;

export default function RegisterScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [fullName, setFullName] = useState('');
  const [tckn, setTckn] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      await auth.register(tckn, phone, fullName);
      router.push({ pathname: '/(auth)/verify-otp', params: { phone } });
    } catch (e: any) {
      setError(e.message || 'Kayit basarisiz');
    } finally {
      setLoading(false);
    }
  };

  const isValid = fullName.length >= 3 && tckn.length === 11 && phone.length === 10;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand.dark} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Dark Navy Header */}
          <View style={styles.header}>
            {/* Decorative dots pattern */}
            <View style={styles.dotsContainer}>
              {Array.from({ length: 5 }).map((_, row) =>
                Array.from({ length: 8 }).map((__, col) => (
                  <View
                    key={`${row}-${col}`}
                    style={[
                      styles.dot,
                      {
                        top: 40 + row * 28,
                        left: 20 + col * (SCREEN_WIDTH / 8),
                        opacity: 0.04 + (row % 3) * 0.02,
                      },
                    ]}
                  />
                ))
              )}
            </View>

            <View style={styles.headerContent}>
              <View style={styles.iconWrapper}>
                <Ionicons name="person-add" size={44} color={colors.white} />
              </View>
              <Text style={styles.brandName}>SecureLend</Text>
              <Text style={styles.brandTagline}>Yeni hesap olusturun</Text>
            </View>
          </View>

          {/* White Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Kayit Ol</Text>
            <Text style={styles.cardSubtitle}>
              Hesabinizi olusturmak icin bilgilerinizi girin
            </Text>

            {error ? (
              <ErrorMessage message={error} onDismiss={() => setError('')} />
            ) : null}

            <Input
              label="Ad Soyad"
              placeholder="Tam adinizi girin"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

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
              title="Kayit Ol"
              onPress={handleRegister}
              loading={loading}
              disabled={!isValid}
              size="lg"
              style={styles.submitButton}
            />

            <View style={styles.linkRow}>
              <Text style={styles.linkText}>Zaten hesabiniz var mi?  </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.linkBold}>Giris Yap</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.brand.dark,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    backgroundColor: colors.brand.dark,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: CARD_OVERLAP + 32,
    overflow: 'hidden',
  },
  dotsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 6,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  card: {
    flex: 1,
    backgroundColor: colors.brand.cardBg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -CARD_OVERLAP,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.brand.dark,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 15,
    color: colors.gray[400],
    fontWeight: '500',
    marginBottom: 28,
    lineHeight: 22,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 16,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  linkText: {
    fontSize: 15,
    color: colors.gray[400],
    fontWeight: '500',
  },
  linkBold: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary[600],
  },
});

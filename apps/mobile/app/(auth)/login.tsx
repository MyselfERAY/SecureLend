import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Switch,
  Dimensions,
} from 'react-native';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/lib/auth-context';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { ErrorMessage } from '../../src/components/ui/ErrorMessage';
import { colors } from '../../src/theme/colors';
import {
  getSavedCredentials,
  setSavedCredentials,
  clearSavedCredentials,
} from '../../src/lib/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 280;
const CARD_OVERLAP = 24;

export default function LoginScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [tckn, setTckn] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Reload saved credentials every time this screen comes into focus
  // (not just on mount — screen may persist after logout)
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const saved = await getSavedCredentials();
        if (saved) {
          setTckn(saved.tckn);
          setPhone(saved.phone);
          setRememberMe(true);
        } else {
          setTckn('');
          setPhone('');
          setRememberMe(false);
        }
      })();
    }, []),
  );

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await auth.login(tckn, phone);
      // Save/clear credentials BEFORE navigation to avoid race condition
      if (rememberMe) {
        await setSavedCredentials({ tckn, phone });
      } else {
        await clearSavedCredentials();
      }
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { phone, tckn, rememberMe: rememberMe ? '1' : '0' },
      });
    } catch (e: any) {
      setError(e.message || 'Giris basarisiz');
    } finally {
      setLoading(false);
    }
  };

  const isValid = tckn.length === 11 && phone.length === 10;

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
              <View style={styles.shieldIcon}>
                <Ionicons name="shield-checkmark" size={44} color={colors.white} />
              </View>
              <Text style={styles.brandName}>Kira Guvence</Text>
              <Text style={styles.brandTagline}>Guvenli Kira Yonetimi</Text>
            </View>
          </View>

          {/* White Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Giris Yap</Text>
            <Text style={styles.cardSubtitle}>
              Devam etmek icin bilgilerinizi girin
            </Text>

            {error ? (
              <ErrorMessage message={error} onDismiss={() => setError('')} />
            ) : null}

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

            {/* Remember Me Toggle */}
            <View style={styles.rememberRow}>
              <Text style={styles.rememberLabel}>Beni Hatirla</Text>
              <Switch
                value={rememberMe}
                onValueChange={setRememberMe}
                trackColor={{
                  false: colors.gray[200],
                  true: colors.primary[400],
                }}
                thumbColor={rememberMe ? colors.primary[600] : colors.gray[50]}
                ios_backgroundColor={colors.gray[200]}
              />
            </View>

            <Button
              title="Giris Yap"
              onPress={handleLogin}
              loading={loading}
              disabled={!isValid}
              size="lg"
              style={styles.submitButton}
            />

            <View style={styles.linkRow}>
              <Text style={styles.linkText}>Hesabiniz yok mu?  </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.linkBold}>Kayit Ol</Text>
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
  shieldIcon: {
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 2,
  },
  rememberLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[600],
  },
  submitButton: {
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

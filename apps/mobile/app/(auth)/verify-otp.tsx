import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/lib/auth-context';
import { OtpInput } from '../../src/components/OtpInput';
import { ErrorMessage } from '../../src/components/ui/ErrorMessage';
import { colors } from '../../src/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 200;
const CARD_OVERLAP = 24;
const RESEND_COOLDOWN = 45;

export default function VerifyOtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const router = useRouter();
  const auth = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);

  const maskedPhone = phone
    ? `+90 ${phone.slice(0, 3)} *** ** ${phone.slice(-2)}`
    : '';

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleComplete = useCallback(
    async (code: string) => {
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
    },
    [phone, loading, auth, router],
  );

  const handleResend = useCallback(() => {
    if (resendTimer > 0) return;
    setResendTimer(RESEND_COOLDOWN);
    // Resend logic would go here
  }, [resendTimer]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand.dark} />

      {/* Dark Navy Header - shorter */}
      <View style={styles.header}>
        {/* Decorative dots */}
        <View style={styles.dotsContainer}>
          {Array.from({ length: 3 }).map((_, row) =>
            Array.from({ length: 8 }).map((__, col) => (
              <View
                key={`${row}-${col}`}
                style={[
                  styles.dot,
                  {
                    top: 30 + row * 28,
                    left: 20 + col * (SCREEN_WIDTH / 8),
                    opacity: 0.04 + (row % 3) * 0.02,
                  },
                ]}
              />
            )),
          )}
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={36} color={colors.white} />
          </View>
          <Text style={styles.headerTitle}>Dogrulama</Text>
        </View>
      </View>

      {/* White Card */}
      <View style={styles.card}>
        <Text style={styles.cardSubtitle}>
          6 haneli dogrulama kodunu girin
        </Text>
        <Text style={styles.phoneText}>{maskedPhone}</Text>

        {error ? (
          <ErrorMessage
            message={error}
            onDismiss={() => {
              setError('');
              setHasError(false);
            }}
          />
        ) : null}

        <View style={styles.otpSection}>
          <OtpInput onComplete={handleComplete} error={hasError} />
        </View>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary[600]} />
            <Text style={styles.loadingText}>Dogrulaniyor...</Text>
          </View>
        )}

        {/* Resend */}
        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResend}
          disabled={resendTimer > 0}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.resendText,
              resendTimer > 0 && styles.resendTextDisabled,
            ]}
          >
            {resendTimer > 0
              ? `Tekrar gonder (${resendTimer}s)`
              : 'Tekrar gonder'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.brand.dark,
  },
  header: {
    height: HEADER_HEIGHT,
    backgroundColor: colors.brand.dark,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: CARD_OVERLAP + 24,
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
  backButton: {
    position: 'absolute',
    top: 56,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  lockIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.3,
  },
  card: {
    flex: 1,
    backgroundColor: colors.brand.cardBg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -CARD_OVERLAP,
    paddingHorizontal: 24,
    paddingTop: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  cardSubtitle: {
    fontSize: 16,
    color: colors.gray[500],
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
  },
  phoneText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.brand.dark,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 28,
    letterSpacing: 0.5,
  },
  otpSection: {
    marginBottom: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 32,
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary[600],
  },
  resendTextDisabled: {
    color: colors.gray[400],
    fontWeight: '500',
  },
});

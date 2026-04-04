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
  Dimensions,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/lib/auth-context';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { ErrorMessage } from '../../src/components/ui/ErrorMessage';
import { colors } from '../../src/theme/colors';
import { KVKK_AYDINLATMA_METNI, KVKK_ACIK_RIZA_METNI } from '@securelend/shared/src/legal/kvkk-texts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 280;
const CARD_OVERLAP = 24;

export default function RegisterScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [fullName, setFullName] = useState('');
  const [tckn, setTckn] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [consentAydinlatma, setConsentAydinlatma] = useState(false);
  const [consentAcikRiza, setConsentAcikRiza] = useState(false);
  const [consentModal, setConsentModal] = useState<'aydinlatma' | 'acik_riza' | null>(null);
  const [consentScrolledToBottom, setConsentScrolledToBottom] = useState(false);

  const handleConsentScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (isBottom) setConsentScrolledToBottom(true);
  };

  const openConsentModal = (type: 'aydinlatma' | 'acik_riza') => {
    setConsentScrolledToBottom(false);
    setConsentModal(type);
  };

  const approveConsent = () => {
    if (consentModal === 'aydinlatma') setConsentAydinlatma(true);
    if (consentModal === 'acik_riza') setConsentAcikRiza(true);
    setConsentModal(null);
  };

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}.${m}.${y}`;
  };

  const toIsoDate = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleRegister = async () => {
    setError('');
    if (!dateOfBirth) {
      setError('Dogum tarihi zorunludur');
      return;
    }
    setLoading(true);
    try {
      await auth.register(tckn, phone, fullName, toIsoDate(dateOfBirth), [
        { type: 'KVKK_AYDINLATMA', version: '1.0' },
        { type: 'KVKK_ACIK_RIZA', version: '1.0' },
      ]);
      router.push({ pathname: '/(auth)/verify-otp', params: { phone } });
    } catch (e: any) {
      setError(e.message || 'Kayit basarisiz');
    } finally {
      setLoading(false);
    }
  };

  const isValid = fullName.length >= 3 && tckn.length === 11 && phone.length === 10 && dateOfBirth !== null && consentAydinlatma && consentAcikRiza;

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

            {/* Date of Birth */}
            <Text style={styles.inputLabel}>Dogum Tarihi</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={20} color={dateOfBirth ? colors.brand.dark : colors.gray[400]} />
              <Text style={[styles.dateText, !dateOfBirth && styles.datePlaceholder]}>
                {dateOfBirth ? formatDate(dateOfBirth) : 'Dogum tarihinizi secin'}
              </Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' ? (
              <Modal visible={showDatePicker} transparent animationType="slide">
                <View style={styles.dateModalOverlay}>
                  <View style={styles.dateModalContent}>
                    <View style={styles.dateModalHeader}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.dateModalCancel}>Iptal</Text>
                      </TouchableOpacity>
                      <Text style={styles.dateModalTitle}>Dogum Tarihi</Text>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.dateModalDone}>Tamam</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={dateOfBirth || new Date(1990, 0, 1)}
                      mode="date"
                      display="spinner"
                      maximumDate={new Date(2010, 11, 31)}
                      minimumDate={new Date(1940, 0, 1)}
                      onChange={(_, selected) => {
                        if (selected) setDateOfBirth(selected);
                      }}
                      locale="tr"
                      themeVariant="light"
                      style={{ height: 200 }}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              showDatePicker && (
                <DateTimePicker
                  value={dateOfBirth || new Date(1990, 0, 1)}
                  mode="date"
                  display="default"
                  maximumDate={new Date(2010, 11, 31)}
                  minimumDate={new Date(1940, 0, 1)}
                  onChange={(_, selected) => {
                    setShowDatePicker(false);
                    if (selected) setDateOfBirth(selected);
                  }}
                />
              )
            )}

            {/* KVKK Consent Checkboxes */}
            <View style={styles.consentSection}>
              <TouchableOpacity
                style={styles.consentRow}
                onPress={() => {
                  if (consentAydinlatma) {
                    setConsentAydinlatma(false);
                  } else {
                    openConsentModal('aydinlatma');
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, consentAydinlatma && styles.checkboxChecked]}>
                  {consentAydinlatma && (
                    <Ionicons name="checkmark" size={14} color="#ffffff" />
                  )}
                </View>
                <Text style={styles.consentText}>
                  Aydinlatma Metnini okudum ve anladim
                </Text>
                <TouchableOpacity
                  onPress={() => openConsentModal('aydinlatma')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.consentLink}>Oku</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.consentRow}
                onPress={() => {
                  if (consentAcikRiza) {
                    setConsentAcikRiza(false);
                  } else {
                    openConsentModal('acik_riza');
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, consentAcikRiza && styles.checkboxChecked]}>
                  {consentAcikRiza && (
                    <Ionicons name="checkmark" size={14} color="#ffffff" />
                  )}
                </View>
                <Text style={styles.consentText}>
                  Kisisel verilerimin islenmesine acik riza veriyorum
                </Text>
                <TouchableOpacity
                  onPress={() => openConsentModal('acik_riza')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.consentLink}>Detay</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>

            {/* Consent Text Modal */}
            <Modal visible={consentModal !== null} animationType="slide" presentationStyle="fullScreen">
              <View style={styles.consentModalContainer}>
                <View style={styles.consentModalHeader}>
                  <Text style={styles.consentModalTitle}>
                    {consentModal === 'aydinlatma' ? 'Aydinlatma Metni' : 'Acik Riza Metni'}
                  </Text>
                  <TouchableOpacity onPress={() => setConsentModal(null)}>
                    <Ionicons name="close" size={24} color={colors.gray[600]} />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  style={styles.consentModalScroll}
                  onScroll={handleConsentScroll}
                  scrollEventThrottle={16}
                >
                  <Text style={styles.consentModalText}>
                    {consentModal === 'aydinlatma' ? KVKK_AYDINLATMA_METNI : KVKK_ACIK_RIZA_METNI}
                  </Text>
                </ScrollView>
                <View style={styles.consentModalFooter}>
                  <TouchableOpacity
                    style={[
                      styles.consentModalButton,
                      !consentScrolledToBottom && styles.consentModalButtonDisabled,
                    ]}
                    onPress={approveConsent}
                    disabled={!consentScrolledToBottom}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.consentModalButtonText,
                      !consentScrolledToBottom && styles.consentModalButtonTextDisabled,
                    ]}>
                      {consentScrolledToBottom ? 'Okudum ve Onayliyorum' : 'Sonuna kadar okuyun...'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

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
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  dateButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    height: 52,
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    marginBottom: 16,
    gap: 10,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.brand.dark,
  },
  datePlaceholder: {
    color: colors.gray[400],
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end' as const,
  },
  dateModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  dateModalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  dateModalCancel: {
    fontSize: 16,
    color: colors.gray[400],
    fontWeight: '500' as const,
  },
  dateModalTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: colors.brand.dark,
  },
  dateModalDone: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '700' as const,
  },
  consentSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  consentRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.gray[700],
    lineHeight: 18,
  },
  consentLink: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#2563eb',
    marginLeft: 8,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 16,
  },
  consentModalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  consentModalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  consentModalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.brand.dark,
  },
  consentModalScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  consentModalText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.gray[700],
    paddingBottom: 40,
  },
  consentModalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  consentModalButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center' as const,
  },
  consentModalButtonDisabled: {
    backgroundColor: colors.gray[200],
  },
  consentModalButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  consentModalButtonTextDisabled: {
    color: colors.gray[400],
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

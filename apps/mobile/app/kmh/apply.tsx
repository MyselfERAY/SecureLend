import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
  KeyboardAvoidingView, Modal, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/lib/auth-context';
import { api, extractError } from '../../src/lib/api';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { ErrorMessage } from '../../src/components/ui/ErrorMessage';
import { colors } from '../../src/theme/colors';

const DARK_NAVY = '#0a1628';

const employmentOptions = [
  { value: 'EMPLOYED', label: 'Calisan', icon: 'briefcase' as const },
  { value: 'SELF_EMPLOYED', label: 'Serbest Meslek', icon: 'person' as const },
  { value: 'RETIRED', label: 'Emekli', icon: 'heart' as const },
  { value: 'STUDENT', label: 'Ogrenci', icon: 'school' as const },
  { value: 'UNEMPLOYED', label: 'Issiz', icon: 'search' as const },
];

const APPLY_STEPS = [
  { key: 'employment', label: 'Istihdam' },
  { key: 'income', label: 'Gelir' },
  { key: 'address', label: 'Adres' },
  { key: 'consent', label: 'Onay' },
];

export default function KmhApplyScreen() {
  const { tokens } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [employment, setEmployment] = useState('EMPLOYED');
  const [income, setIncome] = useState('');
  const [employer, setEmployer] = useState('');
  const [rent, setRent] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [consentFinancial, setConsentFinancial] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentScrolledToBottom, setConsentScrolledToBottom] = useState(false);

  // Determine current step based on form completion
  const getCurrentStep = (): number => {
    if (consentFinancial) return 3; // All done, on consent/submit
    if (address.trim()) return 3; // Address filled, on consent
    if (income.trim() && rent.trim()) return 2; // Income filled, on address
    if (employment) return 0; // On employment (first step always active)
    return 0;
  };
  const currentStep = getCurrentStep();
  const isStepCompleted = (index: number): boolean => {
    switch (index) {
      case 0: return !!employment && (!!income.trim() || !!rent.trim() || !!address.trim() || consentFinancial);
      case 1: return !!income.trim() && !!rent.trim() && (!!address.trim() || consentFinancial);
      case 2: return !!address.trim() && consentFinancial;
      case 3: return consentFinancial;
      default: return false;
    }
  };
  const progressPercent = consentFinancial
    ? 100
    : address.trim()
    ? 75
    : (income.trim() && rent.trim())
    ? 50
    : 25;

  const showEmployer = employment === 'EMPLOYED' || employment === 'SELF_EMPLOYED';

  const handleConsentScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 40) {
      setConsentScrolledToBottom(true);
    }
  };

  const handleSubmit = async () => {
    if (!tokens || !income || !rent || !address) {
      setError('Zorunlu alanlari doldurun');
      return;
    }
    if (!consentFinancial) {
      setError('Finansal veri isleme onayi zorunludur');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        employmentStatus: employment,
        monthlyIncome: Number(income),
        residentialAddress: address,
        estimatedRent: Number(rent),
      };
      if (employer) body.employerName = employer;

      // Record KVKK consent for financial data processing
      await api('/api/v1/consents', {
        method: 'POST',
        body: { type: 'KVKK_ACIK_RIZA_KMH', version: '1.0' },
        token: tokens.accessToken,
      });

      const res = await api<{ applicationId: string }>('/api/v1/bank/kmh/apply', {
        method: 'POST',
        body,
        token: tokens.accessToken,
      });

      if (res.status === 'success' && res.data) {
        router.replace({ pathname: '/kmh/result', params: { applicationId: res.data.applicationId } });
      } else {
        setError(extractError(res));
      }
    } catch {
      setError('Bir hata olustu');
    }
    setSubmitting(false);
  };

  return (
    <View style={styles.container}>
      {/* Dark Navy Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityLabel="Geri don"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Banka Guvence Basvurusu</Text>
            <Text style={styles.headerSubtitle}>{APPLY_STEPS[currentStep].label}</Text>
          </View>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>{currentStep + 1}/4</Text>
          </View>
        </View>

        {/* Step Labels */}
        <View style={styles.stepLabelsRow}>
          {APPLY_STEPS.map((s, i) => {
            const completed = isStepCompleted(i);
            const active = i === currentStep;
            return (
              <View key={s.key} style={styles.stepLabelItem}>
                <View style={[
                  styles.stepLabelCircle,
                  completed && styles.stepLabelCircleCompleted,
                  active && !completed && styles.stepLabelCircleActive,
                ]}>
                  {completed ? (
                    <Ionicons name="checkmark" size={12} color="#ffffff" />
                  ) : (
                    <Text style={[
                      styles.stepLabelNumber,
                      active && styles.stepLabelNumberActive,
                    ]}>{i + 1}</Text>
                  )}
                </View>
                <Text style={[
                  styles.stepLabelText,
                  completed && styles.stepLabelTextCompleted,
                  active && !completed && styles.stepLabelTextActive,
                ]}>{s.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {error ? <ErrorMessage message={error} onDismiss={() => setError('')} /> : null}

          {/* Employment Status */}
          <Text style={styles.sectionLabel}>Istihdam Durumu *</Text>
          <View style={styles.pillRow}>
            {employmentOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.pill, employment === opt.value && styles.pillActive]}
                onPress={() => setEmployment(opt.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={opt.icon}
                  size={15}
                  color={employment === opt.value ? '#2563eb' : colors.gray[500]}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.pillText, employment === opt.value && styles.pillTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Income */}
          <Input
            label="Aylik Gelir *"
            value={income}
            onChangeText={(t) => setIncome(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            prefix="TL"
          />

          {/* Employer - conditional */}
          {showEmployer && (
            <Input
              label="Isveren Adi"
              value={employer}
              onChangeText={setEmployer}
              placeholder="Sirket adi"
            />
          )}

          {/* Estimated Rent */}
          <Input
            label="Tahmini Aylik Kira *"
            value={rent}
            onChangeText={(t) => setRent(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            prefix="TL"
          />

          {/* Address */}
          <Input
            label="Ikamet Adresi *"
            value={address}
            onChangeText={setAddress}
            placeholder="Adres bilgileriniz"
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: 'top', paddingTop: 14 }}
          />

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={18} color="#2563eb" />
            <Text style={styles.infoBoxText}>
              {'Onay kriterleri: Gelir >= Kira x 2 | Limit = Gelir x 3 (max 500.000 TL)'}
            </Text>
          </View>

          {/* KVKK Consent */}
          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => {
              if (consentFinancial) {
                setConsentFinancial(false);
              } else {
                setConsentScrolledToBottom(false);
                setShowConsentModal(true);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, consentFinancial && styles.checkboxChecked]}>
              {consentFinancial && (
                <Ionicons name="checkmark" size={14} color="#ffffff" />
              )}
            </View>
            <Text style={styles.consentText}>
              Banka Guvence Hesabi basvurusu icin finansal verilerimin islenmesine acik riza veriyorum
            </Text>
            <TouchableOpacity
              onPress={() => { setConsentScrolledToBottom(false); setShowConsentModal(true); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Text style={styles.consentLink}>Oku</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Submit */}
          <Button
            title="Basvuruyu Gonder"
            onPress={handleSubmit}
            loading={submitting}
            disabled={!consentFinancial}
            size="lg"
            style={{ marginBottom: 32 }}
          />

          {/* Extra space for keyboard */}
          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* KMH Financial Consent Modal */}
      <Modal visible={showConsentModal} animationType="slide">
        <View style={styles.consentModalContainer}>
          <View style={[styles.consentModalHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setShowConsentModal(false)}
              activeOpacity={0.7}
              accessibilityLabel="Kapat"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={22} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Guvence Hesabi Acik Riza</Text>
              <Text style={styles.headerSubtitle}>Finansal veri isleme onayi</Text>
            </View>
            <View style={styles.consentIconWrap}>
              <Ionicons name="shield-checkmark" size={22} color="#93c5fd" />
            </View>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20 }}
            onScroll={handleConsentScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.consentTextBox}>
              <Text style={styles.consentBodyText}>
{`BANKA GUVENCE HESABI BASVURUSU ACIK RIZA BEYANI

6698 sayili Kisisel Verilerin Korunmasi Kanunu ("KVKK") kapsaminda, Kira Guvence Teknoloji A.S. ("Sirket") tarafindan hazirlanan Aydinlatma Metnini okudum ve anladim.

Banka Guvence Hesabi (KMH) basvurusu kapsaminda, asagida belirtilen kisisel verilerimin islenmesine ozgur iradem ile acik riza veriyorum:

1. ISLENEN FINANSAL VERILER

- Aylik net gelir bilgisi
- Istihdam durumu ve isveren bilgisi
- Mevcut kredi ve borc yukumluluklerim
- Tahmini kira tutari
- Borc/gelir orani hesaplamalari
- Varlik ve yukumluluk bilgilerim

2. KKB (KREDI KAYIT BUROSU) SORGULAMASI

Kredi degerlendirmesi icin KKB nezdinde kayitli kredi gecmisimin, mevcut kredi kullanimlarimin ve odeme performansimin sorgulanmasina riza veriyorum. Bu sorgulama sonucunda elde edilen bilgiler yalnizca KMH basvuru degerlendirmesi icin kullanilacaktir.

3. FINDEKS SKORU ISLEME

Findeks kredi notu ve kredi skorumun sorgulanmasina ve degerlendirme surecinde kullanilmasina onay veriyorum. Findeks skorum, kredi limitimin belirlenmesinde temel kriterlerden biri olarak dikkate alinacaktir.

4. BANKA ILE PAYLASIM

Kimlik ve finansal bilgilerimin, KMH hesap acilisi ve kredi degerlendirmesi amaciyla anlasmali banka ile paylasilmasina riza veriyorum. Paylasilacak bilgiler:
- T.C. Kimlik Numarasi (dogrulama amacli)
- Ad soyad ve dogum tarihi
- Gelir ve istihdam bilgileri
- KKB kredi raporu ozeti
- Basvuru degerlendirme sonuclari

5. OTOMATIK KARAR VERME

KMH basvurumun degerlendirilmesinde otomatik sistemler (kredi skorlama algoritmalari) kullanildigini biliyorum. Bu otomatik degerlendirme sonucunda kredi limitim belirlenmekte veya basvurum reddedilebilmektedir. KVKK Madde 11/1-g uyarinca, otomatik isleme dayali sonuclara itiraz etme hakkima sahip oldugumu biliyorum.

6. BORC/GELIR ORANI HESAPLAMASI

Aylik gelir bilgim ve mevcut borc yukumluluklerim kullanilarak borc/gelir orani hesaplanacaktir. Bu oran, kredi limitimin belirlenmesinde ve basvurumun onaylanip onaylanmayacaginda belirleyici faktor olarak kullanilacaktir.

7. AMAC SINIRLAMASI

Yukarida belirtilen kisisel verilerim yalnizca asagidaki amaclarla islencektir:
- KMH basvuru degerlendirmesi
- Kredi limiti belirlenmesi
- Hesap acilisi islemleri
- Yasal raporlama yukumlulukleri (BDDK, MASAK)

8. VERI SAKLAMA SURESI

KMH basvuruma iliskin veriler:
- Onaylanan basvurular: Hesap aktif oldugu surece + 10 yil
- Reddedilen basvurular: Red tarihinden itibaren 3 yil
- KKB sorgulama kayitlari: 5 yil

9. RIZANIN GERI ALINMASI

Bu rizami her zaman geri alma hakkima sahip oldugumu biliyorum. Ancak rizamin geri alinmasi halinde:
- Devam eden KMH basvurum islenemeycektir
- Yeni KMH basvurusu yapabilmem icin tekrar riza vermem gerekecektir
- Geri alma oncesi islenmis veriler, yasal saklama surelerine tabidir

Yukaridaki hususlari okudum, anladim ve kabul ediyorum.

Kira Guvence Teknoloji A.S.
info@kiraguvence.com`}
              </Text>
            </View>
            <View style={{ height: 100 }} />
          </ScrollView>
          <View style={[styles.consentStickyBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              style={[styles.consentApproveBtn, !consentScrolledToBottom && styles.consentApproveBtnDisabled]}
              onPress={() => {
                if (consentScrolledToBottom) {
                  setConsentFinancial(true);
                  setShowConsentModal(false);
                }
              }}
              activeOpacity={consentScrolledToBottom ? 0.7 : 1}
            >
              <Text style={[styles.consentApproveBtnText, !consentScrolledToBottom && styles.consentApproveBtnTextDisabled]}>
                {consentScrolledToBottom ? 'Okudum ve Onayliyorum' : 'Sona kadar okuyun'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  // Header
  header: {
    backgroundColor: DARK_NAVY,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, marginLeft: 14 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    fontWeight: '500',
  },
  stepBadge: {
    backgroundColor: 'rgba(37,99,235,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#93c5fd',
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  stepLabelItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepLabelCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepLabelCircleCompleted: {
    backgroundColor: '#10b981',
  },
  stepLabelCircleActive: {
    backgroundColor: '#2563eb',
  },
  stepLabelNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
  },
  stepLabelNumberActive: {
    color: '#ffffff',
  },
  stepLabelText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
  },
  stepLabelTextCompleted: {
    color: '#6ee7b7',
    fontWeight: '600',
  },
  stepLabelTextActive: {
    color: '#93c5fd',
    fontWeight: '600',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },

  // Form
  scrollArea: { flex: 1 },
  formContent: { padding: 20 },

  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    minHeight: 44,
  },
  pillActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[600],
  },
  pillTextActive: {
    color: '#1d4ed8',
    fontWeight: '600',
  },

  // Consent
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[700],
    lineHeight: 18,
  },
  consentLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 8,
  },

  // Info
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#1d4ed8',
    lineHeight: 17,
  },

  // Consent Modal
  consentModalContainer: { flex: 1, backgroundColor: '#f1f5f9' },
  consentModalHeader: {
    backgroundColor: DARK_NAVY,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  consentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37,99,235,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentTextBox: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: '#0a1628', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  consentBodyText: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 22,
  },
  consentStickyBar: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray[200],
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  consentApproveBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  consentApproveBtnDisabled: {
    backgroundColor: colors.gray[200],
  },
  consentApproveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  consentApproveBtnTextDisabled: {
    color: colors.gray[400],
  },
});

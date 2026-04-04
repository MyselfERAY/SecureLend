import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
  ActivityIndicator, Animated, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/lib/auth-context';
import { api, extractError } from '../../src/lib/api';
import { Button } from '../../src/components/ui/Button';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { colors } from '../../src/theme/colors';
import { KycStatus, KycStep } from '../../src/types';

const DARK_NAVY = '#0a1628';

interface StepConfig {
  key: string;
  label: string;
  description: string;
  icon: string;
  buttonLabel: string;
  processIcon: string;
  processText: string;
  processDuration: number;
}

const STEP_CONFIGS: StepConfig[] = [
  {
    key: 'identity_verification',
    label: 'Kimlik Dogrulama',
    description: 'NFC ile kimlik tarama',
    icon: 'id-card',
    buttonLabel: 'Dogrula',
    processIcon: 'phone-portrait',
    processText: 'Kimliginizi telefonunuzun arkasina yaklastirin...',
    processDuration: 3000,
  },
  {
    key: 'liveness_check',
    label: 'Canlilik Testi',
    description: 'Yuz tanima ve canlilik dogrulamasi',
    icon: 'scan',
    buttonLabel: 'Basla',
    processIcon: 'camera',
    processText: 'Yuzunuzu cerceve icinde tutun...',
    processDuration: 2000,
  },
  {
    key: 'video_call',
    label: 'Goruntulu Gorusme',
    description: 'Banka yetkili ile gorusme',
    icon: 'videocam',
    buttonLabel: 'Baslat',
    processIcon: 'videocam',
    processText: 'Banka yetkilisi ile baglantiniz kuruluyor...',
    processDuration: 4000,
  },
  {
    key: 'agreements',
    label: 'Sozlesme Onaylari',
    description: 'KMH, KVKK ve diger sozlesmeler',
    icon: 'document-text',
    buttonLabel: 'Onayla',
    processIcon: 'document-text',
    processText: '',
    processDuration: 0,
  },
];

type ProcessingState = 'idle' | 'processing' | 'success';

export default function KmhOnboardingScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { tokens } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [showAgreements, setShowAgreements] = useState(false);
  const [agreementChecks, setAgreementChecks] = useState({ kmh: false, kvkk: false, genel: false });
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for current step
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const ensureOfferAcceptedAndKycStarted = async () => {
    if (!tokens || !applicationId) return;

    // First check application status
    const appRes = await api<any>(`/api/v1/bank/kmh/${applicationId}`, {
      token: tokens.accessToken,
    });
    if (appRes.status !== 'success' || !appRes.data) return;
    const appData = appRes.data;

    // Auto-accept offer if not yet accepted
    if (!appData.offerAccepted) {
      await api(`/api/v1/bank/kmh/${applicationId}/accept-offer`, {
        method: 'POST',
        token: tokens.accessToken,
      });
    }

    // Start KYC if not yet started
    if (!appData.kycStatus || appData.kycStatus === 'NOT_STARTED') {
      await api(`/api/v1/bank/kmh/${applicationId}/kyc/start`, {
        method: 'POST',
        token: tokens.accessToken,
      });
    }
  };

  const loadKycStatus = async () => {
    if (!tokens || !applicationId) return;
    const res = await api<KycStatus>(`/api/v1/bank/kmh/${applicationId}/kyc/status`, {
      token: tokens.accessToken,
    });
    if (res.status === 'success' && res.data) {
      // Map backend step keys to our STEP_CONFIGS keys
      const data = res.data;
      const mappedSteps: KycStep[] = (data.steps || []).map((s: any) => {
        const keyMap: Record<string, string> = {
          id_verification: 'identity_verification',
          selfie: 'liveness_check',
          video_call: 'video_call',
          agreements: 'agreements',
        };
        return { ...s, key: keyMap[s.key] || s.key };
      });
      setKycStatus({ ...data, steps: mappedSteps });
    }
  };

  useEffect(() => {
    (async () => {
      await ensureOfferAcceptedAndKycStarted();
      await loadKycStatus();
      setLoading(false);
    })();
  }, [tokens, applicationId]);

  const getStepStatus = (step: KycStep): 'completed' | 'current' | 'pending' | 'skipped' => {
    if (!step.required) return 'skipped';
    if (step.completed) return 'completed';
    // First incomplete required step is current
    const steps = kycStatus?.steps || [];
    const firstIncomplete = steps.find((s) => s.required && !s.completed);
    if (firstIncomplete?.key === step.key) return 'current';
    return 'pending';
  };

  const handleStepAction = async (stepKey: string) => {
    const config = STEP_CONFIGS.find((c) => c.key === stepKey);
    if (!config) return;

    // Agreements step has special handling
    if (stepKey === 'agreements') {
      setShowAgreements(true);
      return;
    }

    // Start processing simulation
    setProcessingStep(stepKey);
    setProcessingState('processing');

    // Simulate the process
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), config.processDuration);
    });

    // Call API to mark step complete
    if (tokens && applicationId) {
      const apiPath = stepKey === 'identity_verification'
        ? `/api/v1/bank/kmh/${applicationId}/kyc/verify-id`
        : stepKey === 'liveness_check'
        ? `/api/v1/bank/kmh/${applicationId}/kyc/verify-selfie`
        : `/api/v1/bank/kmh/${applicationId}/kyc/complete-video`;

      await api(apiPath, { method: 'POST', token: tokens.accessToken });
    }

    setProcessingState('success');
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 800);
    });

    // Update local state
    if (kycStatus) {
      const updatedSteps = kycStatus.steps.map((s) =>
        s.key === stepKey ? { ...s, completed: true } : s,
      );
      const completedCount = updatedSteps.filter((s) => s.completed || !s.required).length;
      setKycStatus({
        ...kycStatus,
        steps: updatedSteps,
        completedSteps: completedCount,
        canComplete: updatedSteps.every((s) => s.completed || !s.required),
      });
    }

    setProcessingStep(null);
    setProcessingState('idle');
  };

  const handleAgreementSubmit = async () => {
    if (!agreementChecks.kmh || !agreementChecks.kvkk || !agreementChecks.genel) return;

    setProcessingStep('agreements');
    setProcessingState('processing');

    if (tokens && applicationId) {
      await api(`/api/v1/bank/kmh/${applicationId}/kyc/sign-agreements`, {
        method: 'POST',
        token: tokens.accessToken,
      });
    }

    // Small delay for UX
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 500);
    });

    // Update local state
    if (kycStatus) {
      const updatedSteps = kycStatus.steps.map((s) =>
        s.key === 'agreements' ? { ...s, completed: true } : s,
      );
      const completedCount = updatedSteps.filter((s) => s.completed || !s.required).length;
      setKycStatus({
        ...kycStatus,
        steps: updatedSteps,
        completedSteps: completedCount,
        canComplete: updatedSteps.every((s) => s.completed || !s.required),
      });
    }

    setShowAgreements(false);
    setProcessingStep(null);
    setProcessingState('idle');
  };

  const handleComplete = async () => {
    if (!tokens || !applicationId) return;
    setCompleting(true);
    setError('');
    try {
      const res = await api(`/api/v1/bank/kmh/${applicationId}/complete-onboarding`, {
        method: 'POST',
        token: tokens.accessToken,
      });
      if (res.status === 'success') {
        router.replace({ pathname: '/kmh/complete', params: { applicationId } });
      } else {
        setError(extractError(res));
      }
    } catch {
      setError('Bir hata olustu');
    }
    setCompleting(false);
  };

  const handleCancel = () => {
    Alert.alert(
      'Basvuruyu Iptal Et',
      'Bu basvuruyu iptal etmek istediginizden emin misiniz? Bu islem geri alinamaz.',
      [
        { text: 'Hayir', style: 'cancel' },
        {
          text: 'Evet, Iptal Et',
          style: 'destructive',
          onPress: async () => {
            if (!tokens || !applicationId) return;
            setCancelling(true);
            try {
              const res = await api(`/api/v1/bank/kmh/${applicationId}/cancel`, {
                method: 'POST',
                token: tokens.accessToken,
              });
              if (res.status === 'success') {
                router.replace('/(tabs)/bank');
              } else {
                setError(extractError(res));
              }
            } catch {
              setError('Iptal islemi basarisiz');
            }
            setCancelling(false);
          },
        },
      ],
    );
  };

  if (loading) return <LoadingSpinner text="KYC durumu yukleniyor..." />;

  const steps = kycStatus?.steps || [];
  const completedCount = steps.filter((s) => s.completed || !s.required).length;
  const totalSteps = steps.length;
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;
  const canComplete = kycStatus?.canComplete || steps.every((s) => s.completed || !s.required);

  // Processing overlay
  if (processingStep && processingStep !== 'agreements') {
    const config = STEP_CONFIGS.find((c) => c.key === processingStep);
    return (
      <View style={styles.processingOverlay}>
        <View style={styles.processingContent}>
          {processingState === 'processing' ? (
            <>
              <View style={styles.processingIconWrap}>
                <Ionicons name={config?.processIcon as any} size={48} color="#2563eb" />
              </View>
              {/* Pulsing circles for NFC effect */}
              {processingStep === 'identity_verification' && (
                <View style={styles.pulseContainer}>
                  <View style={[styles.pulseCircle, styles.pulseCircle1]} />
                  <View style={[styles.pulseCircle, styles.pulseCircle2]} />
                  <View style={[styles.pulseCircle, styles.pulseCircle3]} />
                </View>
              )}
              {processingStep === 'liveness_check' && (
                <View style={styles.faceOutline}>
                  <View style={styles.faceOval} />
                </View>
              )}
              <Text style={styles.processingText}>{config?.processText}</Text>
              <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 24 }} />
            </>
          ) : (
            <>
              <View style={[styles.processingIconWrap, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="checkmark-circle" size={48} color="#10b981" />
              </View>
              <Text style={styles.processingSuccessText}>Tamamlandi!</Text>
            </>
          )}
        </View>
      </View>
    );
  }

  // Agreements view
  if (showAgreements) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setShowAgreements(false)}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={22} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Sozlesme Onaylari</Text>
            </View>
          </View>
        </View>
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* Agreement text */}
          <View style={styles.agreementTextBox}>
            <Text style={styles.agreementBody}>
              {'KMH Sozlesmesi\n\n' +
                'Bu sozlesme, SecureLend platformu uzerinden acilan Kira Mevduat Hesabi (KMH) hizmetine iliskin kosullari duzenlemektedir.\n\n' +
                '1. Hesap Acilisi: KMH, kiracinin kira guvenceligi icin kullanilacak ozel bir mevduat hesabidir.\n\n' +
                '2. Kredi Limiti: Onaylanan kredi limiti, belirlenen kriterler dogrultusunda hesaplanmistir.\n\n' +
                '3. Faiz Orani: Uygulanacak faiz orani, sozlesme tarihinde gecerli olan orandir.\n\n' +
                '4. Geri Odeme: Aylik taksitler, belirlenen odeme gunu itibariyle tahsil edilir.\n\n' +
                '5. Temerrut: Odeme gecikmeleri durumunda gecikme faizi uygulanir.\n\n' +
                'KVKK Aydinlatma Metni\n\n' +
                'Kisisel verileriniz, 6698 sayili Kisisel Verilerin Korunmasi Kanunu kapsaminda islenmektedir. ' +
                'Kimlik, iletisim ve finansal bilgileriniz hizmet sunumu amaciyla kullanilacaktir.\n\n' +
                'Verileriniz yasal sureler boyunca saklanir ve yasal zorunluluklar disinda ucuncu taraflarla paylasilmaz.'}
            </Text>
          </View>

          {/* Checkboxes */}
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setAgreementChecks((p) => ({ ...p, kmh: !p.kmh }))}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreementChecks.kmh && styles.checkboxChecked]}>
              {agreementChecks.kmh && <Ionicons name="checkmark" size={14} color="#ffffff" />}
            </View>
            <Text style={styles.checkLabel}>KMH Sozlesmesini okudum ve kabul ediyorum</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setAgreementChecks((p) => ({ ...p, kvkk: !p.kvkk }))}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreementChecks.kvkk && styles.checkboxChecked]}>
              {agreementChecks.kvkk && <Ionicons name="checkmark" size={14} color="#ffffff" />}
            </View>
            <Text style={styles.checkLabel}>KVKK Aydinlatma Metnini okudum ve kabul ediyorum</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setAgreementChecks((p) => ({ ...p, genel: !p.genel }))}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreementChecks.genel && styles.checkboxChecked]}>
              {agreementChecks.genel && <Ionicons name="checkmark" size={14} color="#ffffff" />}
            </View>
            <Text style={styles.checkLabel}>Genel kulllanim kosullarini kabul ediyorum</Text>
          </TouchableOpacity>

          <Button
            title="Onayliyorum"
            onPress={handleAgreementSubmit}
            disabled={!agreementChecks.kmh || !agreementChecks.kvkk || !agreementChecks.genel}
            size="lg"
            style={{ marginTop: 20, marginBottom: 40 }}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Musteri Edinim</Text>
            <Text style={styles.headerSubtitle}>
              {completedCount}/{totalSteps} adim tamamlandi
            </Text>
          </View>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>3/4</Text>
          </View>
        </View>
        {/* Progress */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step Cards */}
        {steps.map((step, index) => {
          const status = getStepStatus(step);
          const config = STEP_CONFIGS.find((c) => c.key === step.key);
          const isProcessing = processingStep === step.key;

          return (
            <View key={step.key} style={styles.stepCard}>
              <View style={styles.stepCardHeader}>
                <View style={styles.stepNumberRow}>
                  <View style={[
                    styles.stepNumberCircle,
                    status === 'completed' && styles.stepNumberCompleted,
                    status === 'current' && styles.stepNumberCurrent,
                    status === 'skipped' && styles.stepNumberSkipped,
                  ]}>
                    {status === 'completed' ? (
                      <Ionicons name="checkmark" size={16} color="#ffffff" />
                    ) : status === 'current' ? (
                      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <Text style={styles.stepNumberTextCurrent}>{index + 1}</Text>
                      </Animated.View>
                    ) : status === 'skipped' ? (
                      <Ionicons name="remove" size={16} color={colors.gray[400]} />
                    ) : (
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    )}
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={[
                      styles.stepLabel,
                      status === 'skipped' && styles.stepLabelSkipped,
                    ]}>
                      {step.label}
                    </Text>
                    <Text style={[
                      styles.stepDescription,
                      status === 'skipped' && styles.stepDescriptionSkipped,
                    ]}>
                      {status === 'skipped' ? 'Mevcut musteri - atlanabilir' : step.description}
                    </Text>
                  </View>
                  {/* Status indicator */}
                  {status === 'completed' && (
                    <View style={styles.stepStatusDone}>
                      <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                    </View>
                  )}
                  {status === 'skipped' && (
                    <Text style={styles.stepSkippedLabel}>Atlandi</Text>
                  )}
                </View>

                {/* Action button for current step */}
                {status === 'current' && config && !isProcessing && (
                  <TouchableOpacity
                    style={styles.stepActionBtn}
                    onPress={() => handleStepAction(step.key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={config.icon as any} size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.stepActionText}>{config.buttonLabel}</Text>
                  </TouchableOpacity>
                )}

                {isProcessing && (
                  <View style={styles.stepProcessingRow}>
                    <ActivityIndicator size="small" color="#2563eb" />
                    <Text style={styles.stepProcessingText}>Isleniyor...</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.errorBoxText}>{error}</Text>
          </View>
        ) : null}

        {/* Complete Button */}
        {canComplete && (
          <Button
            title="Hesap Acilisini Tamamla"
            onPress={handleComplete}
            loading={completing}
            size="lg"
            variant="success"
            style={{ marginTop: 16 }}
          />
        )}

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleCancel}
          disabled={cancelling}
          activeOpacity={0.7}
        >
          {cancelling ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <>
              <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
              <Text style={styles.cancelBtnText}>Basvuruyu Iptal Et</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, marginLeft: 14 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2, fontWeight: '500' },
  stepBadge: {
    backgroundColor: 'rgba(37,99,235,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepText: { fontSize: 13, fontWeight: '700', color: '#93c5fd' },
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

  scrollArea: { flex: 1 },
  scrollContent: { padding: 20 },

  // Step Cards
  stepCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#0a1628',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  stepCardHeader: {},
  stepNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stepNumberCompleted: {
    backgroundColor: '#10b981',
  },
  stepNumberCurrent: {
    backgroundColor: '#2563eb',
  },
  stepNumberSkipped: {
    backgroundColor: colors.gray[100],
  },
  stepNumberText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray[400],
  },
  stepNumberTextCurrent: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  stepInfo: { flex: 1 },
  stepLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
  },
  stepLabelSkipped: {
    color: colors.gray[400],
    textDecorationLine: 'line-through',
  },
  stepDescription: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  stepDescriptionSkipped: {
    color: colors.gray[300],
  },
  stepStatusDone: {
    marginLeft: 8,
  },
  stepSkippedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[400],
    marginLeft: 8,
  },

  // Step action
  stepActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 14,
    minHeight: 48,
  },
  stepActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  stepProcessingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 8,
  },
  stepProcessingText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },

  // Processing overlay
  processingOverlay: {
    flex: 1,
    backgroundColor: DARK_NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  processingContent: {
    alignItems: 'center',
  },
  processingIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  processingText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
  },
  processingSuccessText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
    textAlign: 'center',
  },
  pulseContainer: {
    position: 'absolute',
    top: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -80,
  },
  pulseCircle: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(37,99,235,0.2)',
  },
  pulseCircle1: { width: 130, height: 130 },
  pulseCircle2: { width: 170, height: 170, borderColor: 'rgba(37,99,235,0.1)' },
  pulseCircle3: { width: 210, height: 210, borderColor: 'rgba(37,99,235,0.05)' },
  faceOutline: {
    marginBottom: 16,
  },
  faceOval: {
    width: 150,
    height: 200,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: 'rgba(37,99,235,0.3)',
    borderStyle: 'dashed',
  },

  // Agreements
  agreementTextBox: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    maxHeight: 300,
    ...Platform.select({
      ios: {
        shadowColor: '#0a1628',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  agreementBody: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 22,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    minHeight: 56,
    ...Platform.select({
      ios: {
        shadowColor: '#0a1628',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[800],
    lineHeight: 20,
  },

  // Cancel
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 16,
    gap: 8,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  errorBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#ef4444',
  },
});

import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
  ActivityIndicator, Animated, Alert, Modal, NativeSyntheticEvent, NativeScrollEvent,
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
    label: 'Kimlik Doğrulama',
    description: 'NFC ile kimlik tarama',
    icon: 'id-card',
    buttonLabel: 'Doğrula',
    processIcon: 'phone-portrait',
    processText: 'Kimliğinizi telefonunuzun arkasına yaklaştırın...',
    processDuration: 3000,
  },
  {
    key: 'liveness_check',
    label: 'Canlılık Testi',
    description: 'Yüz tanıma ve canlılık doğrulaması',
    icon: 'scan',
    buttonLabel: 'Başla',
    processIcon: 'camera',
    processText: 'Yüzünüzü çerçeve içinde tutun...',
    processDuration: 2000,
  },
  {
    key: 'video_call',
    label: 'Görüntülü Görüşme',
    description: 'Banka yetkili ile görüşme',
    icon: 'videocam',
    buttonLabel: 'Başlat',
    processIcon: 'videocam',
    processText: 'Banka yetkilisi ile bağlantınız kuruluyor...',
    processDuration: 4000,
  },
  {
    key: 'agreements',
    label: 'Sözleşme Onayları',
    description: 'Güvence Hesabı, KVKK ve diğer sözleşmeler',
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
  const [activeAgreement, setActiveAgreement] = useState<'kmh' | 'kvkk' | 'genel' | null>(null);
  const [agreementScrolled, setAgreementScrolled] = useState(false);
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

  // Motivational messages shown after completing a step
  const getMotivationMessage = (): { text: string; progressText: string } | null => {
    if (!kycStatus) return null;
    const completed = kycStatus.steps.filter((s) => s.completed).length;
    const total = kycStatus.steps.filter((s) => s.required).length;
    if (completed === 0) return null;
    const progressText = `${total} adımdan ${completed}'${completed === 1 ? 'i' : completed === 2 ? 'si' : 'ü'} tamamlandı`;
    if (completed === 1) return { text: 'Harika! Kimliğiniz doğrulandı \u2713', progressText };
    if (completed === 2) return { text: 'Neredeyse bitti! Son 2 adım kaldı', progressText };
    if (completed === 3) return { text: 'Son adım! Sözleşmeleri onaylayın', progressText };
    return null;
  };
  const motivationMsg = getMotivationMessage();

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
      setError('Bir hata oluştu');
    }
    setCompleting(false);
  };

  const handleCancel = () => {
    Alert.alert(
      'Başvuruyu İptal Et',
      'Bu başvuruyu iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'Hayır', style: 'cancel' },
        {
          text: 'Evet, İptal Et',
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
              setError('İptal işlemi başarısız');
            }
            setCancelling(false);
          },
        },
      ],
    );
  };

  if (loading) return <LoadingSpinner text="KYC durumu yükleniyor..." />;

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
              <Text style={styles.processingSuccessText}>Tamamlandı!</Text>
            </>
          )}
        </View>
      </View>
    );
  }

  const AGREEMENT_TEXTS: Record<string, { title: string; subtitle: string; body: string }> = {
    kmh: {
      title: 'Banka Güvence Hesabı Sözleşmesi',
      subtitle: 'Banka Güvence Hesabı (KMH) koşulları',
      body: `KREDİLİ MEVDUAT HESABI (KMH) SÖZLEŞMESİ

Sözleşme No: [Otomatik atanacaktır]
Tarih: [Başvuru tarihi]

TARAFLAR

Banka: Kira Güvence Anlaşmalı Banka A.Ş.
Müşteri: [Kullanıcı bilgileri]
Platform: Kira Güvence Teknoloji A.Ş.

MADDE 1 - TANIMLAR

1.1. KMH (Kredili Mevduat Hesabı): Kiracının kira güvencesi olarak kullanılmak üzere açılan özel mevduat hesabıdır.
1.2. Kredi Limiti: Müşterinin gelir durumu, kredi geçmişi ve diğer kriterlere göre belirlenen azami kredi kullanım tutarıdır.
1.3. Platform: Kira Güvence Teknoloji A.Ş. tarafından işletilen kiraguvence.com web sitesi ve Kira Güvence mobil uygulamasıdır.

MADDE 2 - HESAP AÇILIŞI VE KULLANIM KOŞULLARI

2.1. KMH, müşterinin başvurusunun onaylanması ve müşteri edinim sürecinin (KYC) tamamlanmasının ardından açılır.
2.2. Hesap, yalnızca kira ödeme işlemleri için kullanılabilir. Başka amaçlarla kullanım yasaktır.
2.3. Hesap açılışı için müşterinin 18 yaşını doldurmuş T.C. vatandaşı olması gereklidir.
2.4. Müşteri, hesap açılışı sırasında verdiği tüm bilgilerin doğru ve güncel olduğunu beyan eder.

MADDE 3 - KREDİ LİMİTİ VE FAİZ ORANI

3.1. Kredi limiti, müşterinin aylık geliri, mevcut borç yükümlülükleri, KKB kredi geçmişi ve Findeks skoru dikkate alınarak belirlenir.
3.2. Onaylanan kredi limiti, başvuru tarihinde geçerli olan değerlendirme kriterlerine göre hesaplanmıştır.
3.3. Uygulanacak faiz oranı, sözleşme tarihinde geçerli olan ve TCMB politika faiz oranına endeksli orandır.
3.4. Banka, faiz oranını TCMB kararlarındaki değişikliklere paralel olarak güncelleme hakkını saklı tutar.

MADDE 4 - KİRA ÖDEME MEKANİZMASI

4.1. Kira ödemesi, her ayın belirlenen günü otomatik olarak KMH hesabından ev sahibinin hesabına aktarılır.
4.2. Platform garanti ücreti (%1) kira tutarından düşülerek ev sahibine net tutar transfer edilir.
4.3. Hesapta yeterli bakiye bulunmaması durumunda kredi limiti kullanılır.
4.4. Kredi limitinin aşıldığı durumlarda ödeme gerçekleştirilemez ve kiracı temerrüde düşer.

MADDE 5 - GERİ ÖDEME

5.1. Kullanılan kredi tutarı, belirlenen vadelerde aylık taksitler halinde geri ödenir.
5.2. Taksit ödeme günü, sözleşme imzalanırken belirlenen gündür.
5.3. Erken ödeme halinde kalan vade faizi tahsil edilmez (tüketici kredisi hükümleri uygulanır).

MADDE 6 - TEMERRÜT VE GECİKME FAİZİ

6.1. Taksit ödeme tarihinde ödeme yapılmaması halinde müşteri temerrüde düşer.
6.2. Temerrüt faizi, sözleşme faiz oranının 1.5 katı olarak uygulanır.
6.3. Ardışık 3 taksit ödenmemesi halinde sözleşme feshedilebilir ve borcun tamamı muaccel hale gelir.
6.4. Geciken ödemeler KKB ve Findeks'e olumsuz olarak bildirilir.

MADDE 7 - HESAP KAPATMA

7.1. Mevcut borcun tamamen ödenmesi halinde hesap kapatılabilir.
7.2. Kira sözleşmesinin sona ermesi durumunda, kalan borç yapılandırılarak hesap kapatma süreci başlatılır.
7.3. Müşterinin vefatı halinde kanuni mirasçılarla borç tasfiyesi yapılır.

MADDE 8 - GENEL HÜKÜMLER

8.1. Bu sözleşme Türk Borçlar Kanunu, Tüketici Kanunu ve Bankacılık Kanunu hükümlerine tabidir.
8.2. Uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
8.3. Bu sözleşme 3 (üç) nüsha olarak düzenlenmiştir.

Kira Güvence Anlaşmalı Banka A.Ş.
Kira Güvence Teknoloji A.Ş.`,
    },
    kvkk: {
      title: 'KVKK Aydınlatma',
      subtitle: 'Kişisel verilerin korunması',
      body: `KİŞİSEL VERİLERİN İŞLENMESİNE İLİŞKİN AYDINLATMA METNİ

Kira Güvence Teknoloji A.Ş. ("Şirket") olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla sizleri bilgilendirmek istiyoruz.

1. VERİ SORUMLUSU

Kira Güvence Teknoloji A.Ş.
Adres: İstanbul, Türkiye
Web: https://kiraguvence.com
E-posta: info@kiraguvence.com

2. İŞLENEN KİŞİSEL VERİLER

KMH hizmeti kapsamında aşağıdaki kişisel verileriniz işlenmektedir:

a) Kimlik Bilgileri: T.C. Kimlik Numarası (TCKN), ad soyad, doğum tarihi. TCKN, SHA-256 algoritmasıyla hash'lenerek saklanır.
b) İletişim Bilgileri: Cep telefonu numarası, e-posta adresi.
c) Finansal Bilgiler: Aylık net gelir, istihdam durumu, işveren bilgisi, tahmini kira tutarı, mevcut kredi ve borç bilgileri.
d) Kredi Değerlendirme Bilgileri: KKB kredi raporu, Findeks skoru, borç/gelir oranı, kredi geçmişi.
e) KYC Bilgileri: Kimlik doğrulama sonuçları, canlılık testi sonuçları, görüntülü görüşme kayıtları.
f) İşlem Bilgileri: Kira ödeme geçmişi, sözleşme detayları, hesap hareketleri.
g) Teknik Bilgiler: IP adresi, cihaz bilgisi, işletim sistemi, erişim zamanları, oturum bilgileri.

3. İŞLENME AMACI VE HUKUKİ SEBEBİ

Kişisel verileriniz aşağıdaki amaç ve hukuki sebeplerle işlenmektedir:

a) Sözleşmenin kurulması ve ifası (KVKK m.5/2-c): KMH hesap açılışı, kredi değerlendirmesi, ödeme işlemleri.
b) Hukuki yükümlülük (KVKK m.5/2-c): BDDK, MASAK, SPK mevzuatı uyumluluğu, vergi mevzuatı.
c) Hakkın tesisi ve korunması (KVKK m.5/2-e): Hukuki süreçlerin yürütülmesi, alacak takibi.
d) Meşru menfaat (KVKK m.5/2-f): Risk değerlendirmesi, hizmet iyileştirme, dolandırıcılık önleme.
e) Açık rıza (KVKK m.5/1): Pazarlama iletişimleri, profilleme, üçüncü taraf paylaşımları.

4. VERİLERİN AKTARIMI

Kişisel verileriniz aşağıdaki taraflarla paylaşılabilir:
- Anlaşmalı bankalar (KMH hesap işlemleri)
- KKB/Findeks (kredi sorgulama)
- BDDK, MASAK (yasal raporlama)
- Bulut hizmet sağlayıcıları (güvenli veri saklama)
- Hukuk müşavirleri (hukuki süreçlerde)

5. SAKLAMA SÜRESİ

- Hesap bilgileri: Üyelik süresi + 10 yıl
- Finansal işlemler: 10 yıl (TTK)
- KYC verileri: 10 yıl (MASAK)
- KKB sorgulama kayıtları: 5 yıl
- Log kayıtları: 2 yıl

6. HAKLARINIZ (KVKK Madde 11)

a) Kişisel verilerinizin işlenip işlenmediğini öğrenme
b) İşlenmişse buna ilişkin bilgi talep etme
c) İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
d) Yurt içinde/dışında aktarıldığı üçüncü kişileri bilme
e) Eksik veya yanlış işlenmesi halinde düzeltilmesini isteme
f) Silinmesini veya yok edilmesini isteme
g) Aktarım yapılan üçüncü kişilere bildirilmesini isteme
h) Otomatik analiz sonucu aleyhinize bir sonuca itiraz etme
i) Kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme

Haklarınızı kullanmak için info@kiraguvence.com adresine başvurabilirsiniz.

Kira Güvence Teknoloji A.Ş.`,
    },
    genel: {
      title: 'Kullanım Koşulları',
      subtitle: 'Genel hüküm ve koşullar',
      body: `GENEL KULLANIM KOŞULLARI

Son güncelleme: Nisan 2026

Kira Güvence Teknoloji A.Ş. ("Kira Güvence") tarafından işletilen kiraguvence.com web sitesi ve Kira Güvence mobil uygulamasını ("Platform") kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız.

MADDE 1 - HİZMET TANIMI

1.1. Kira Güvence, kiracıları, ev sahiplerini ve bankaları bir araya getiren dijital bir platformdur.
1.2. Platform, Kredili Mevduat Hesabı (KMH) başvurusu, kira sözleşmesi yönetimi ve ödeme takibi hizmetleri sunar.
1.3. Kira Güvence bir banka veya finansal kuruluş değildir. Kredi kararları ve hesap yönetimi tamamen anlaşmalı bankalar tarafından yürütülür.

MADDE 2 - UYGUNLUK KOŞULLARI

2.1. Platform'u kullanabilmek için:
- 18 yaşını doldurmuş olmak
- T.C. vatandaşı olmak ve geçerli bir TCKN'ye sahip olmak
- Aktif bir cep telefonu numarasına sahip olmak
- Bu koşulları kabul etmek

2.2. Tüzel kişiler platform'u kullanamazlar.

MADDE 3 - HESAP YÜKÜMLÜLÜKLERİ

3.1. Kullanıcı, kayıt sırasında doğru ve güncel bilgi sağlamakla yükümlüdür.
3.2. Hesap güvenliğinden (şifre, OTP kodları) kullanıcı sorumludur.
3.3. Hesap bilgilerinin üçüncü kişilerle paylaşılmaması gerekmektedir.
3.4. Şüpheli erişim durumunda derhal info@kiraguvence.com adresine bildirimde bulunulmalıdır.

MADDE 4 - YASAKLAR

4.1. Platform aşağıdaki amaçlarla kullanılamaz:
- Sahte kimlik veya yanıltıcı bilgi ile işlem yapma
- Kara para aklama veya terör finansmanı
- Diğer kullanıcıların haklarını ihlal etme
- Platform'un teknik altyapısına zarar verme
- Otomatik botlar veya scraping araçları kullanma

MADDE 5 - GARANTİ ÜCRETİ VE ÜCRETLER

5.1. Platform, başarılı kira ödemeleri üzerinden %1 oranında garanti ücreti tahsil eder.
5.2. Garanti ücreti, kira tutarından düşülerek ev sahibine net tutar aktarılır.
5.3. KMH hesap açılışı ve yönetimi için banka tarafından ayrıca ücret alınabilir.
5.4. Garanti ücreti oranları değişiklikleri en az 30 gün önceden bildirilir.

MADDE 6 - SORUMLULUK SINIRI

6.1. Kira Güvence, banka tarafından verilen kredi kararları, faiz oranları ve hesap yönetimi konularında sorumluluk kabul etmez.
6.2. Platform kesintileri, teknik arızalar veya üçüncü taraf hizmet sağlayıcı kaynaklı sorunlardan dolayı doğrudan veya dolaylı zararlardan Kira Güvence sorumlu tutulamaz.
6.3. Kira Güvence'in toplam sorumluluğu, kullanıcının son 12 ayda platform'a ödediği toplam garanti ücreti tutarı ile sınırlıdır.

MADDE 7 - FİKRİ MÜLKİYET

7.1. Platform üzerindeki tüm içerik, tasarım, logo, yazılım ve algoritmalar Kira Güvence'e aittir.
7.2. Kullanıcılar, platform içeriğini kopyalayamaz, dağıtamaz veya ticari amaçla kullanamazlar.

MADDE 8 - SÖZLEŞME DEĞİŞİKLİKLERİ

8.1. Kira Güvence, bu koşulları değiştirme hakkını saklı tutar.
8.2. Önemli değişiklikler en az 30 gün öncesinden uygulama içi bildirim ile duyurulur.
8.3. Değişikliklerin yürürlüğe girmesinden sonra Platform'un kullanılmaya devam edilmesi, değişikliklerin kabul edilmesi anlamına gelir.

MADDE 9 - FESİH

9.1. Kullanıcı, hesabını her zaman kapatarak bu sözleşmeyi feshedebilir.
9.2. Aktif KMH kredi borcu bulunan hesaplar, borç tamamen ödenmeden kapatılamaz.
9.3. Kira Güvence, koşulların ihlali halinde hesabı askıya alma veya kapatma hakkına sahiptir.

MADDE 10 - UYGULANACAK HUKUK VE UYUŞMAZLIK

10.1. Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir.
10.2. Uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
10.3. Tüketici uyuşmazlıklarında 7036 sayılı Kanun hükümleri saklıdır.

İLETİŞİM
E-posta: info@kiraguvence.com
Web: https://kiraguvence.com

Kira Güvence Teknoloji A.Ş.`,
    },
  };

  const handleAgreementScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 40) {
      setAgreementScrolled(true);
    }
  };

  // Individual agreement reading modal
  if (activeAgreement) {
    const agr = AGREEMENT_TEXTS[activeAgreement];
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setActiveAgreement(null)}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={22} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>{agr.title}</Text>
              <Text style={styles.headerSubtitle}>{agr.subtitle}</Text>
            </View>
            <View style={styles.agrIconWrap}>
              <Ionicons name="shield-checkmark" size={22} color="#93c5fd" />
            </View>
          </View>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          onScroll={handleAgreementScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.agreementTextBox}>
            <Text style={styles.agreementBody}>{agr.body}</Text>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
        <View style={[styles.agrStickyBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.agrApproveBtn, !agreementScrolled && styles.agrApproveBtnDisabled]}
            onPress={() => {
              if (agreementScrolled) {
                setAgreementChecks((p) => ({ ...p, [activeAgreement]: true }));
                setActiveAgreement(null);
              }
            }}
            activeOpacity={agreementScrolled ? 0.7 : 1}
          >
            <Text style={[styles.agrApproveBtnText, !agreementScrolled && styles.agrApproveBtnTextDisabled]}>
              {agreementScrolled ? 'Okudum ve Onayliyorum' : 'Sona kadar okuyun'}
            </Text>
          </TouchableOpacity>
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
              <Text style={styles.headerTitle}>Sözleşme Onayları</Text>
              <Text style={styles.headerSubtitle}>Tüm sözleşmeleri okuyun ve onaylayın</Text>
            </View>
          </View>
        </View>
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* KMH Agreement */}
          <TouchableOpacity
            style={[styles.checkRow, agreementChecks.kmh && styles.checkRowDone]}
            onPress={() => {
              if (agreementChecks.kmh) {
                setAgreementChecks((p) => ({ ...p, kmh: false }));
              } else {
                setAgreementScrolled(false);
                setActiveAgreement('kmh');
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreementChecks.kmh && styles.checkboxChecked]}>
              {agreementChecks.kmh && <Ionicons name="checkmark" size={14} color="#ffffff" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.checkLabel}>Banka Güvence Hesabı Sözleşmesini okudum ve kabul ediyorum</Text>
              {!agreementChecks.kmh && <Text style={styles.checkHint}>Okumak için dokunun</Text>}
            </View>
            {!agreementChecks.kmh && <Ionicons name="chevron-forward" size={18} color={colors.gray[400]} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkRow, agreementChecks.kvkk && styles.checkRowDone]}
            onPress={() => {
              if (agreementChecks.kvkk) {
                setAgreementChecks((p) => ({ ...p, kvkk: false }));
              } else {
                setAgreementScrolled(false);
                setActiveAgreement('kvkk');
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreementChecks.kvkk && styles.checkboxChecked]}>
              {agreementChecks.kvkk && <Ionicons name="checkmark" size={14} color="#ffffff" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.checkLabel}>KVKK Aydınlatma Metnini okudum ve kabul ediyorum</Text>
              {!agreementChecks.kvkk && <Text style={styles.checkHint}>Okumak için dokunun</Text>}
            </View>
            {!agreementChecks.kvkk && <Ionicons name="chevron-forward" size={18} color={colors.gray[400]} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkRow, agreementChecks.genel && styles.checkRowDone]}
            onPress={() => {
              if (agreementChecks.genel) {
                setAgreementChecks((p) => ({ ...p, genel: false }));
              } else {
                setAgreementScrolled(false);
                setActiveAgreement('genel');
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreementChecks.genel && styles.checkboxChecked]}>
              {agreementChecks.genel && <Ionicons name="checkmark" size={14} color="#ffffff" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.checkLabel}>Genel kullanım koşullarını kabul ediyorum</Text>
              {!agreementChecks.genel && <Text style={styles.checkHint}>Okumak için dokunun</Text>}
            </View>
            {!agreementChecks.genel && <Ionicons name="chevron-forward" size={18} color={colors.gray[400]} />}
          </TouchableOpacity>

          <Button
            title="Onaylıyorum"
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
            <Text style={styles.headerTitle}>Müşteri Edinim</Text>
            <Text style={styles.headerSubtitle}>
              {completedCount}/{totalSteps} adım tamamlandı
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
        {/* Motivation Banner */}
        {motivationMsg && (
          <View style={styles.motivationBanner}>
            <View style={styles.motivationTop}>
              <Ionicons name="sparkles" size={18} color="#2563eb" />
              <Text style={styles.motivationText}>{motivationMsg.text}</Text>
            </View>
            <View style={styles.motivationProgressRow}>
              <View style={styles.motivationProgressTrack}>
                <View style={[styles.motivationProgressFill, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.motivationProgressLabel}>{motivationMsg.progressText}</Text>
            </View>
          </View>
        )}

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
                      {status === 'skipped' ? 'Mevcut müşteri - atlanabilir' : step.description}
                    </Text>
                  </View>
                  {/* Status indicator */}
                  {status === 'completed' && (
                    <View style={styles.stepStatusDone}>
                      <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                    </View>
                  )}
                  {status === 'skipped' && (
                    <Text style={styles.stepSkippedLabel}>Atlandı</Text>
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
                    <Text style={styles.stepProcessingText}>İşleniyor...</Text>
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
            title="Hesap Açılışını Tamamla"
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
              <Text style={styles.cancelBtnText}>Başvuruyu İptal Et</Text>
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

  // Motivation Banner
  motivationBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  motivationTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  motivationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d4ed8',
    flex: 1,
  },
  motivationProgressRow: {
    gap: 6,
  },
  motivationProgressTrack: {
    height: 6,
    backgroundColor: '#dbeafe',
    borderRadius: 3,
  },
  motivationProgressFill: {
    height: 6,
    backgroundColor: '#2563eb',
    borderRadius: 3,
  },
  motivationProgressLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3b82f6',
  },

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
  checkRowDone: {
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  checkHint: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 2,
  },
  agrIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37,99,235,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agrStickyBar: {
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
  agrApproveBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  agrApproveBtnDisabled: {
    backgroundColor: colors.gray[200],
  },
  agrApproveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  agrApproveBtnTextDisabled: {
    color: colors.gray[400],
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

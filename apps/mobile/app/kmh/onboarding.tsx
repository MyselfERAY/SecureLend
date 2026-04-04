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

  const AGREEMENT_TEXTS: Record<string, { title: string; subtitle: string; body: string }> = {
    kmh: {
      title: 'KMH Sozlesmesi',
      subtitle: 'Kira Mevduat Hesabi kosullari',
      body: `KIRA MEVDUAT HESABI (KMH) SOZLESMESI

Sozlesme No: [Otomatik atanacaktir]
Tarih: [Basvuru tarihi]

TARAFLAR

Banka: Kira Guvence Anlasmali Banka A.S.
Musteri: [Kullanici bilgileri]
Platform: Kira Guvence Teknoloji A.S.

MADDE 1 - TANIMLAR

1.1. KMH (Kira Mevduat Hesabi): Kiracinin kira guvencesi olarak kullanilmak uzere acilan ozel mevduat hesabidir.
1.2. Kredi Limiti: Musterinin gelir durumu, kredi gecmisi ve diger kriterlere gore belirlenen azami kredi kullanim tutaridir.
1.3. Platform: Kira Guvence Teknoloji A.S. tarafindan isletilen kiraguvence.com web sitesi ve Kira Guvence mobil uygulamasidir.

MADDE 2 - HESAP ACILISI VE KULLANIM KOSULLARI

2.1. KMH, musterinin basvurusunun onaylanmasi ve musteri edinim surecinin (KYC) tamamlanmasinin ardindan acilir.
2.2. Hesap, yalnizca kira odeme islemleri icin kullanilabilir. Baska amaclarla kullanim yasaktir.
2.3. Hesap acilisi icin musterinin 18 yasini doldurmus T.C. vatandasi olmasi gereklidir.
2.4. Musteri, hesap acilisi sirasinda verdigi tum bilgilerin dogru ve guncel oldugunu beyan eder.

MADDE 3 - KREDI LIMITI VE FAIZ ORANI

3.1. Kredi limiti, musterinin aylik geliri, mevcut borc yukumlulukleri, KKB kredi gecmisi ve Findeks skoru dikkate alinarak belirlenir.
3.2. Onaylanan kredi limiti, basvuru tarihinde gecerli olan degerlendirme kriterlerine gore hesaplanmistir.
3.3. Uygulanacak faiz orani, sozlesme tarihinde gecerli olan ve TCMB politika faiz oranina endeksli orandir.
3.4. Banka, faiz oranini TCMB kararlarindaki degisikliklere paralel olarak guncelleme hakkini sakli tutar.

MADDE 4 - KIRA ODEME MEKANIZMASI

4.1. Kira odemesi, her ayin belirlenen gunu otomatik olarak KMH hesabindan ev sahibinin hesabina aktarilir.
4.2. Platform komisyonu (%1) kira tutarindan dusulerek ev sahibine net tutar transfer edilir.
4.3. Hesapta yeterli bakiye bulunmamasi durumunda kredi limiti kullanilir.
4.4. Kredi limitinin asildigi durumlarda odeme gerceklestirilemez ve kiraci temerrude duser.

MADDE 5 - GERI ODEME

5.1. Kullanilan kredi tutari, belirlenen vadelerde aylik taksitler halinde geri odenir.
5.2. Taksit odeme gunu, sozlesme imzalanirken belirlenen gundur.
5.3. Erken odeme halinde kalan vade faizi tahsil edilmez (tuketici kredisi hukumleri uygulanir).

MADDE 6 - TEMERUT VE GECIKME FAIZI

6.1. Taksit odeme tarihinde odeme yapilmamasi halinde musteri temerrude duser.
6.2. Temerut faizi, sozlesme faiz oraninin 1.5 kati olarak uygulanir.
6.3. Ardisik 3 taksit odenmemesi halinde sozlesme feshedilebilir ve borcun tamami muaccel hale gelir.
6.4. Geciken odemeler KKB ve Findeks'e olumsuz olarak bildirilir.

MADDE 7 - HESAP KAPATMA

7.1. Mevcut borcun tamamen odenmesi halinde hesap kapatilabilir.
7.2. Kira sozlesmesinin sona ermesi durumunda, kalan borc yapılandırılarak hesap kapatma sureci baslatilir.
7.3. Musterinin vefati halinde kanuni mirascilarla borcs tasfiyesi yapilir.

MADDE 8 - GENEL HUKUMLER

8.1. Bu sozlesme Turk Borclar Kanunu, Tuketici Kanunu ve Bankacilik Kanunu hukumlerine tabidir.
8.2. Uyusmazliklarda Istanbul Mahkemeleri ve Icra Daireleri yetkilidir.
8.3. Bu sozlesme 3 (uc) nusaha olarak duzenlenmisstir.

Kira Guvence Anlasmali Banka A.S.
Kira Guvence Teknoloji A.S.`,
    },
    kvkk: {
      title: 'KVKK Aydinlatma',
      subtitle: 'Kisisel verilerin korunmasi',
      body: `KISISEL VERILERIN ISLENMESINE ILISKIN AYDINLATMA METNI

Kira Guvence Teknoloji A.S. ("Sirket") olarak, 6698 sayili Kisisel Verilerin Korunmasi Kanunu ("KVKK") kapsaminda veri sorumlusu sifatiyla sizleri bilgilendirmek istiyoruz.

1. VERI SORUMLUSU

Kira Guvence Teknoloji A.S.
Adres: Istanbul, Turkiye
Web: https://kiraguvence.com
E-posta: info@kiraguvence.com

2. ISLENEN KISISEL VERILER

KMH hizmeti kapsaminda asagidaki kisisel verileriniz islenmektedir:

a) Kimlik Bilgileri: T.C. Kimlik Numarasi (TCKN), ad soyad, dogum tarihi. TCKN, SHA-256 algoritmasiyla hash'lenerek saklanir.
b) Iletisim Bilgileri: Cep telefonu numarasi, e-posta adresi.
c) Finansal Bilgiler: Aylik net gelir, istihdam durumu, isveren bilgisi, tahmini kira tutari, mevcut kredi ve borc bilgileri.
d) Kredi Degerlendirme Bilgileri: KKB kredi raporu, Findeks skoru, borc/gelir orani, kredi gecmisi.
e) KYC Bilgileri: Kimlik dogrulama sonuclari, canlilik testi sonuclari, goruntulu gorusme kayitlari.
f) Islem Bilgileri: Kira odeme gecmisi, sozlesme detaylari, hesap hareketleri.
g) Teknik Bilgiler: IP adresi, cihaz bilgisi, isletim sistemi, erisim zamanlari, oturum bilgileri.

3. ISLENME AMACI VE HUKUKI SEBEBI

Kisisel verileriniz asagidaki amac ve hukuki sebeplerle islenmektedir:

a) Sozlesmenin kurulmasi ve ifasi (KVKK m.5/2-c): KMH hesap acilisi, kredi degerlendirmesi, odeme islemleri.
b) Hukuki yukumluluk (KVKK m.5/2-c): BDDK, MASAK, SPK mevzuati uyumlulugu, vergi mevzuati.
c) Hakkin tesisi ve korunmasi (KVKK m.5/2-e): Hukuki sureclerin yurutulmesi, alacak takibi.
d) Mesru menfaat (KVKK m.5/2-f): Risk degerlendirmesi, hizmet iyilestirme, dolandiricilik onleme.
e) Acik riza (KVKK m.5/1): Pazarlama iletisimleri, profilleme, ucuncu taraf paylasimlari.

4. VERILERIN AKTARIMI

Kisisel verileriniz asagidaki taraflarla paylasilabilir:
- Anlasmali bankalar (KMH hesap islemleri)
- KKB/Findeks (kredi sorgulama)
- BDDK, MASAK (yasal raporlama)
- Bulut hizmet saglayicilari (guvenli veri saklama)
- Hukuk musavirleri (hukuki sureclerde)

5. SAKLAMA SURESI

- Hesap bilgileri: Uyelik suresi + 10 yil
- Finansal islemler: 10 yil (TTK)
- KYC verileri: 10 yil (MASAK)
- KKB sorgulama kayitlari: 5 yil
- Log kayitlari: 2 yil

6. HAKLARINIZ (KVKK Madde 11)

a) Kisisel verilerinizin islenip islenmedigini ogrenme
b) Islenmisse buna iliskin bilgi talep etme
c) Islenme amacini ve amacina uygun kullanilip kullanilmadigini ogrenme
d) Yurt icinde/disinda aktarildigi ucuncu kisileri bilme
e) Eksik veya yanlis islenmesi halinde duzeltilmesini isteme
f) Silinmesini veya yok edilmesini isteme
g) Aktarim yapilan ucuncu kisilere bildirilmesini isteme
h) Otomatik analiz sonucu aleyhinize bir sonuca itiraz etme
i) Kanuna aykiri isleme nedeniyle zararin giderilmesini talep etme

Haklarinizi kullanmak icin info@kiraguvence.com adresine basvurabilirsiniz.

Kira Guvence Teknoloji A.S.`,
    },
    genel: {
      title: 'Kullanim Kosullari',
      subtitle: 'Genel hukum ve kosullar',
      body: `GENEL KULLANIM KOSULLARI

Son guncelleme: Nisan 2026

Kira Guvence Teknoloji A.S. ("Kira Guvence") tarafindan isletilen kiraguvence.com web sitesi ve Kira Guvence mobil uygulamasini ("Platform") kullanarak asagidaki kosullari kabul etmis sayilirsiniz.

MADDE 1 - HIZMET TANIMI

1.1. Kira Guvence, kiracilari, ev sahiplerini ve bankalari bir araya getiren dijital bir platformdur.
1.2. Platform, Kira Mevduat Hesabi (KMH) basvurusu, kira sozlesmesi yonetimi ve odeme takibi hizmetleri sunar.
1.3. Kira Guvence bir banka veya finansal kurulus degildir. Kredi kararlari ve hesap yonetimi tamamen anlasmali bankalar tarafindan yurutulur.

MADDE 2 - UYGUNLUK KOSULLARI

2.1. Platform'u kullanabilmek icin:
- 18 yasini doldurmus olmak
- T.C. vatandasi olmak ve gecerli bir TCKN'ye sahip olmak
- Aktif bir cep telefonu numarasina sahip olmak
- Bu kosullari kabul etmek

2.2. Tüzel kisiler platform'u kullanamazlar.

MADDE 3 - HESAP YUKUMLULUKLERI

3.1. Kullanici, kayit sirasinda dogru ve guncel bilgi saglamakla yukumludur.
3.2. Hesap guvenliginden (sifre, OTP kodlari) kullanici sorumludur.
3.3. Hesap bilgilerinin ucuncu kisilerle paylasilmamasi gerekmektedir.
3.4. Supheli erisim durumunda derhal info@kiraguvence.com adresine bildirimde bulunulmalidir.

MADDE 4 - YASAKLAR

4.1. Platform asagidaki amaclarla kullanilamaz:
- Sahte kimlik veya yaniltici bilgi ile islem yapma
- Kara para aklama veya teror finansmani
- Diger kullanicilarin haklarini ihlal etme
- Platform'un teknik altyapisina zarar verme
- Otomatik botlar veya scraping araclari kullanma

MADDE 5 - KOMISYON VE UCRETLER

5.1. Platform, basarili kira odemeleri uzerinden %1 oraninda komisyon tahsil eder.
5.2. Komisyon, kira tutarindan dusulerek ev sahibine net tutar aktarilir.
5.3. KMH hesap acilisi ve yonetimi icin banka tarafindan ayrica ucret alinabilir.
5.4. Komisyon oranlari degisiklikleri en az 30 gun onceden bildirilir.

MADDE 6 - SORUMLULUK SINIRI

6.1. Kira Guvence, banka tarafindan verilen kredi kararlari, faiz oranlari ve hesap yonetimi konularinda sorumluluk kabul etmez.
6.2. Platform kesintileri, teknik arizalar veya ucuncu taraf hizmet saglayici kaynakli sorunlardan dolayi dogrudan veya dolayli zararladan Kira Guvence sorumlu tutulamaz.
6.3. Kira Guvence'in toplam sorumlulugu, kullanicinin son 12 ayda platform'a odedigi toplam komisyon tutari ile sinirlidir.

MADDE 7 - FIKRI MULKIYET

7.1. Platform uzerindeki tum icerik, tasarim, logo, yazilim ve algoritmalar Kira Guvence'e aittir.
7.2. Kullanicilar, platform icerigini kopyalayamaz, dagitamaz veya ticari amacla kullanamazlar.

MADDE 8 - SOZLESME DEGISIKLIKLERI

8.1. Kira Guvence, bu kosullari degistirme hakkini sakli tutar.
8.2. Onemli degisiklikler en az 30 gun oncesinden uygulama ici bildirim ile duyurulur.
8.3. Degisikliklerin yururluge girmesinden sonra Platform'un kullanilmaya devam edilmesi, degisikliklerin kabul edilmesi anlamina gelir.

MADDE 9 - FESIH

9.1. Kullanici, hesabini her zaman kapatarak bu sozlesmeyi feshedebilir.
9.2. Aktif KMH kredi borcu bulunan hesaplar, borc tamamen odenmeden kapatilamaz.
9.3. Kira Guvence, kosullarin ihlali halinde hesabi askiya alma veya kapatma hakkina sahiptir.

MADDE 10 - UYGULANACAK HUKUK VE UYUSMAZLIK

10.1. Bu kosullar Turkiye Cumhuriyeti hukukuna tabidir.
10.2. Uyusmazliklarda Istanbul Mahkemeleri ve Icra Daireleri yetkilidir.
10.3. Tuketici uyusmazliklarinda 7036 sayili Kanun hukumleri saklidir.

ILETISIM
E-posta: info@kiraguvence.com
Web: https://kiraguvence.com

Kira Guvence Teknoloji A.S.`,
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
              <Text style={styles.headerTitle}>Sozlesme Onaylari</Text>
              <Text style={styles.headerSubtitle}>Tum sozlesmeleri okuyun ve onaylayin</Text>
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
              <Text style={styles.checkLabel}>KMH Sozlesmesini okudum ve kabul ediyorum</Text>
              {!agreementChecks.kmh && <Text style={styles.checkHint}>Okumak icin dokunun</Text>}
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
              <Text style={styles.checkLabel}>KVKK Aydinlatma Metnini okudum ve kabul ediyorum</Text>
              {!agreementChecks.kvkk && <Text style={styles.checkHint}>Okumak icin dokunun</Text>}
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
              <Text style={styles.checkLabel}>Genel kullanim kosullarini kabul ediyorum</Text>
              {!agreementChecks.genel && <Text style={styles.checkHint}>Okumak icin dokunun</Text>}
            </View>
            {!agreementChecks.genel && <Ionicons name="chevron-forward" size={18} color={colors.gray[400]} />}
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

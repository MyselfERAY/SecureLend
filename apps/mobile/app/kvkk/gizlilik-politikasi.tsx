import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { markConsentScrolled } from '../../src/lib/consent-store';

const DARK_NAVY = '#0a1628';

const GIZLILIK_POLITIKASI = `GIZLILIK POLITIKASI

Son Guncelleme: 01.04.2026

Kira Guvence Teknoloji A.S. ("Kira Guvence") olarak kullanicilarimizin gizliligine onem veriyoruz. Bu politika, platformumuz uzerinden toplanan kisisel verilerin nasil kullanildigini, paylasildigini ve korundugrunu aciklamaktadir.

TOPLANAN BILGILER

Hesap Olusturma Sirasinda:
- Ad soyad
- T.C. Kimlik Numarasi (TCKN)
- Telefon numarasi
- Dogum tarihi

KMH Basvurusu Sirasinda:
- Istihdam durumu ve isveren bilgisi
- Aylik gelir bilgisi
- Ikamet adresi
- Tahmini kira tutari

Platform Kullanimi Sirasinda:
- Odeme islem bilgileri
- Sozlesme detaylari
- Cihaz ve tarayici bilgileri
- IP adresi ve erisim loglarit
- Konum bilgileri (izin verildiginde)

KULLANIMI

Toplanan bilgileriniz asagidaki amaclarla kullanilmaktadir:

1. Hesap Yonetimi: Kullanici hesabinizin olusturulmasi, dogrulanmasi ve yonetimi
2. Hizmet Sunumu: KMH basvurusu, kira odeme islemleri ve sozlesme yonetimi
3. Kimlik Dogrulama: KYC surecleri ve MASAK uyumlulugu
4. Guvenlik: Dolandiricilik tespiti, yetkisiz erisim onleme
5. Iletisim: Islem bildirimleri, odeme hatirlatalari, hizmet guncellemeleri
6. Yasal Uyumluluk: BDDK, MASAK ve diger duzenlayici kurumlarin gerekliliklerinin karsilanmasi
7. Hizmet Iyilestirme: Kullanici deneyiminin analizi ve platform gelistirme

PAYLASILMASI

Kisisel verileriniz asagidaki durumlarda ucuncu taraflarla paylasilabilir:

Banka ve Finans Kuruluslari: KMH hesap islemleri ve odeme sureclerinin yurutulmesi icin
Odeme Altyapi Saglayicilari: Kira odeme islemlerinin gerceklestirilmesi icin
Bulut Hizmet Saglayicilari: Verilerin guvenli bir sekilde saklanmasi icin
Yetkili Kamu Kurumlari: Yasal zorunluluklar geregi (BDDK, MASAK, mahkeme kararlari)
Hukuk Musavirleri: Hukuki sureclerin yurutulmesi icin

Verileriniz, ticari amaclarla ucuncu taraflara satilmaz veya kiralanmaz.

GUVENLIK

Kisisel verilerinizin guvenligini saglamak icin asagidaki onlemleri almaktayiz:

- SSL/TLS sifreleme ile veri iletimi
- Veritabaninda sifrelenmis saklama (TCKN hashleme dahil)
- Erisim kontrolleri ve yetkilendirme mekanizmalari
- Duzenli guvenlik denetimleri ve penetrasyon testleri
- Calisanlara yonelik bilgi guvenligi egitimleri
- OWASP standartlarina uygun uygulama guvenligi
- JWT tabanli kimlik dogrulama ve oturum yonetimi
- Rate limiting ve DDoS korumasi

CEREZLER VE IZLEME

Mobil uygulamamizda:
- Oturum yonetimi icin guvenli token saklama kullanilmaktadir
- Analitik amacli anonim kullanim verileri toplanabilir
- Ucuncu taraf izleme araclari kullanilmamaktadir

COCUKLARIN GIZLILIGI

Platformumuz 18 yasindan kucuk bireylere yonelik degildir. Bilerek 18 yasindan kucuk bireylerden kisisel veri toplamamaktayiz.

HAKLARINIZ

6698 sayili KVKK kapsaminda asagidaki haklara sahipsiniz:

1. Kisisel verilerinizin islenip islenmedigini ogrenme
2. Islenmisse bilgi talep etme
3. Islenme amacini ve amacina uygun kullanilip kullanilmadigini ogrenme
4. Aktarildigi ucuncu kisileri bilme
5. Eksik veya yanlis islenmesi halinde duzeltilmesini isteme
6. Silinmesini veya yok edilmesini isteme
7. Aktarildigi ucuncu kisilere bildirilmesini isteme
8. Otomatik analiz sonucu aleyhinize bir sonuca itiraz etme
9. Kanuna aykiri isleme nedeniyle zararin giderilmesini talep etme

HESAP SILME

Hesabinizi ve iliskili verilerinizi silmek istemeniz durumunda info@kiraguvence.com adresine basvurabilirsiniz. Yasal saklama yukumluluklerine tabi veriler haric, tum verileriniz 30 gun icinde silinir.

POLITIKA GUNCELLEMELERI

Bu gizlilik politikasi zaman zaman guncellenebilir. Onemli degisiklikler yapildiginda uygulama icinden ve/veya e-posta yoluyla bilgilendirilirsiniz.

ILETISIM

Gizlilik ile ilgili sorulariniz icin:
E-posta: info@kiraguvence.com
Web: https://kiraguvence.com

Kira Guvence Teknoloji A.S.`;

export default function GizlilikPolitikasiScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const paddingToBottom = 40;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - paddingToBottom) {
      setScrolledToBottom(true);
    }
  };

  const handleApprove = () => {
    markConsentScrolled('acik_riza');
    router.back();
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
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Gizlilik Politikasi</Text>
            <Text style={styles.headerSubtitle}>Veri koruma ve gizlilik</Text>
          </View>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed" size={22} color="#93c5fd" />
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Text style={styles.bodyText}>{GIZLILIK_POLITIKASI}</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.approveButton,
            !scrolledToBottom && styles.approveButtonDisabled,
          ]}
          onPress={handleApprove}
          disabled={!scrolledToBottom}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.approveButtonText,
              !scrolledToBottom && styles.approveButtonTextDisabled,
            ]}
          >
            {scrolledToBottom ? 'Okudum ve Onayliyorum' : 'Sona kadar okuyun'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  header: {
    backgroundColor: DARK_NAVY,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    fontWeight: '500',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37,99,235,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollArea: { flex: 1 },
  scrollContent: {
    padding: 20,
  },
  bodyText: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 22,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
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

  bottomBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: { elevation: 8 },
    }),
  },
  approveButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  approveButtonTextDisabled: {
    color: '#9ca3af',
  },
});

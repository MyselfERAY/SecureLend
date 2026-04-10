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

const AYDINLATMA_METNI = `KISISEL VERILERIN ISLENMESINE ILISKIN AYDINLATMA METNI

Son Guncelleme: 01.04.2026

VERI SORUMLUSU

Kira Guvence Teknoloji A.S. ("Kira Guvence" veya "Sirket") olarak, 6698 sayili Kisisel Verilerin Korunmasi Kanunu ("KVKK") kapsaminda veri sorumlusu sifatiyla sizleri aydinlatmak istiyoruz.

Adres: Istanbul, Turkiye
E-posta: info@kiraguvence.com
Web: https://kiraguvence.com

ISLENEN KISISEL VERILER

Platformumuz uzerinden asagidaki kisisel verileriniz islenmektedir:

Kimlik Bilgileri: Ad soyad, T.C. Kimlik Numarasi (TCKN), dogum tarihi
Iletisim Bilgileri: Telefon numarasi, e-posta adresi
Finansal Bilgiler: Aylik gelir, istihdam durumu, isveren bilgisi, kira tutari, banka hesap bilgileri
Konum Bilgileri: Ikamet adresi
Islem Bilgileri: Odeme gecmisi, sozlesme detaylari, KMH basvuru bilgileri
Dijital Kimlik Bilgileri: Cihaz bilgileri, IP adresi, oturum bilgileri

ISLENME AMACI

Kisisel verileriniz asagidaki amaclarla islenmektedir:

1. Uyelik ve hesap islemlerinin yurutulmesi
2. Kimlik dogrulama ve KYC (Know Your Customer) sureclerinin tamamlanmasi
3. Kredili Mevduat Hesabi (KMH) basvuru ve degerlendirme sureclerinin yurutulmesi
4. Kira odeme islemlerinin gerceklestirilmesi ve takibi
5. Sozlesme sureclerinin yurutulmesi
6. Yasal yukumluluklerin yerine getirilmesi (BDDK, MASAK, SPK mevzuati)
7. Risk degerlendirmesi ve kredi skorlama
8. Musteriye ozel hizmet ve urun onerileri sunulmasi
9. Platform guvenliginin saglanmasi ve dolandiricilik onleme
10. Istatistiksel analizler ve hizmet iyilestirme

HUKUKI SEBEPLER

Kisisel verileriniz asagidaki hukuki sebeplere dayanilarak islenmektedir:

- Bir sozlesmenin kurulmasi veya ifasi (KVKK m.5/2-c)
- Veri sorumlusunun hukuki yukumlulugu (KVKK m.5/2-c)
- Bir hakkin tesisi, kullanilmasi veya korunmasi (KVKK m.5/2-e)
- Veri sorumlusunun mesru menfaati (KVKK m.5/2-f)
- Acik rizaniz (KVKK m.5/1)

AKTARIM

Kisisel verileriniz, yukaridaki amaclar dogrultusunda:

- Is ortaklari ve hizmet saglayicilarla (odeme altyapisi, bulut hizmetleri)
- Bankalar ve finansal kuruluslarla (KMH islemleri kapsaminda)
- Yasal zorunluluklar geregi yetkili kamu kurum ve kuruluslariyla (BDDK, MASAK, mahkemeler)
- Hukuk musavirleri ve denetcilerle

paylasilabilmektedir. Verileriniz yurt disina aktarilmasi durumunda KVKK m.9 hukumleri uygulanir.

SAKLAMA SURESI

Kisisel verileriniz, isleme amacinin gerektirdigi sure boyunca ve yasal saklama surelerince muhafaza edilir:

- Hesap bilgileri: Uyelik devam ettigi surece + 10 yil
- Finansal islem kayitlari: 10 yil (TTK ve vergi mevzuati)
- KYC/Kimlik dogrulama verileri: 10 yil (MASAK mevzuati)
- Iletisim kayitlari: 3 yil
- Log kayitlari: 2 yil

Saklama suresi sona erdikten sonra verileriniz silinir, yok edilir veya anonim hale getirilir.

HAKLARINIZ

KVKK'nin 11. maddesi uyarinca asagidaki haklara sahipsiniz:

a) Kisisel verilerinizin islenip islenmedigini ogrenme
b) Kisisel verileriniz islenmisse buna iliskin bilgi talep etme
c) Kisisel verilerinizin islenme amacini ve bunlarin amacina uygun kullanilip kullanilmadigini ogrenme
d) Yurt icinde veya yurt disinda kisisel verilerin aktarildigi ucuncu kisileri bilme
e) Kisisel verilerin eksik veya yanlis islenmesi halinde bunlarin duzeltilmesini isteme
f) KVKK'nin 7. maddesinde ongotrulen kosullar cercevesinde kisisel verilerin silinmesini veya yok edilmesini isteme
g) Yapilan islemlerin, kisisel verilerin aktarildigi ucuncu kisilere bildirilmesini isteme
h) Islenen verilerin munhasiran otomatik sistemler vasitasiyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya cikmasina itiraz etme
i) Kisisel verilerin kanuna aykiri olarak islenmesi sebebiyle zarara ugramaniz halinde zararin giderilmesini talep etme

Haklarinizi kullanmak icin info@kiraguvence.com adresine yazili olarak basvurabilirsiniz.

Kira Guvence Teknoloji A.S.`;

export default function AydinlatmaMetniScreen() {
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
    markConsentScrolled('aydinlatma');
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
            <Text style={styles.headerTitle}>Aydinlatma Metni</Text>
            <Text style={styles.headerSubtitle}>KVKK 6698 Sayili Kanun</Text>
          </View>
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark" size={22} color="#93c5fd" />
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
        <Text style={styles.bodyText}>{AYDINLATMA_METNI}</Text>
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

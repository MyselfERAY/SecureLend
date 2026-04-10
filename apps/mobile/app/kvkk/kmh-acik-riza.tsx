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

const KMH_ACIK_RIZA_METNI = `KREDILI MEVDUAT HESABI (KMH) FINANSAL VERILERIN ISLENMESINE ILISKIN ACIK RIZA METNI

Son Guncelleme: 01.04.2026

VERI SORUMLUSU

Kira Guvence Teknoloji A.S. ("Kira Guvence" veya "Sirket")
Adres: Istanbul, Turkiye
E-posta: info@kiraguvence.com

ACIK RIZA BEYANI

6698 sayili Kisisel Verilerin Korunmasi Kanunu ("KVKK") kapsaminda, Kredili Mevduat Hesabi (KMH) basvurumun degerlendirilmesi ve hesap islemlerimin yurutulmesi amaciyla asagidaki finansal ve kisisel verilerimin islenmesine acik rizamla onay veriyorum:

ISLENEN FINANSAL VERILER

KMH basvuru ve degerlendirme surecinde asagidaki verilerim islenmektedir:

1. Gelir Bilgileri: Aylik net gelir, gelir belgesi bilgileri
2. Istihdam Bilgileri: Calisma durumu, isveren adi, is baslangic tarihi
3. Kira Bilgileri: Mevcut/tahmini kira tutari, kira sozlesme bilgileri
4. Adres Bilgileri: Ikamet adresi, kiralanacak tasinmaz adresi
5. Banka Hesap Bilgileri: IBAN, hesap hareketleri, bakiye bilgileri
6. Kredi Skorlama Verileri: Kredi gecmisi, risk degerlendirmesi sonuclari
7. KMH Hesap Bilgileri: Hesap numarasi, bakiye, faiz oranlari, vade bilgileri

ISLENME AMACLARI

Finansal verilerim asagidaki amaclarla islenmektedir:

1. KMH basvuru uygunlugumun degerlendirilmesi
2. Kredi risk analizi ve skorlama yapilmasi
3. KMH hesap limitinin belirlenmesi (Gelir x 3, maksimum 500.000 TL)
4. Gelir-kira orani kontrolu (Gelir >= Kira x 2)
5. KMH hesabinin acilmasi ve yonetilmesi
6. Kira odeme islemlerinin gerceklestirilmesi
7. Yasal raporlama yukumluluklerinin yerine getirilmesi (BDDK, MASAK)
8. Dolandiricilik ve usulsuzluk onleme

VERILERIN AKTARILDIGI TARAFLAR

Finansal verilerim asagidaki taraflarla paylasilabilir:

- Anlasmali bankalar ve finansal kuruluslar (KMH hesap islemleri icin)
- Kredi kayit burosu (KKB) ve risk merkezi
- Bankalar arasi kart merkezi (BKM)
- BDDK ve MASAK (yasal zorunluluklar geregi)
- Bagimsiz denetim ve hukuk musavirlik firmalari

SAKLAMA SURESI

Finansal verilerim asagidaki surelerle saklanacaktir:

- KMH hesap bilgileri: Hesap kapanisina kadar + 10 yil
- Basvuru degerlendirme verileri: 5 yil
- Odeme islem kayitlari: 10 yil (TTK ve vergi mevzuati)
- Risk degerlendirme sonuclari: 5 yil

HAKLARIM

KVKK'nin 11. maddesi kapsaminda:
- Verilerimin islenip islenmedigini ogrenmek
- Islenen verilerim hakkinda bilgi talep etmek
- Islenme amacini ve amaca uygunlugu sorgulamak
- Eksik veya yanlis islenmesi halinde duzeltme talep etmek
- Isleme sartlari ortadan kalktginda silinmesini talep etmek
- Otomatik analiz sonucu aleyhime bir sonuca itiraz etmek

haklarima sahibim.

RIZANIN GERI ALINMASI

Acik rizami her zaman info@kiraguvence.com adresine yazili bildirimde bulunarak geri alabilirim. Rizanin geri alinmasi, geri alma oncesinde yapilan islemlerin hukuka uygunlugunu etkilemez. Rizanin geri alinmasi durumunda aktif KMH hesabimin kapatilmasi soz konusu olabilir.

ONAY

Yukaridaki bilgilendirmeyi okudum ve anlaldim. Finansal verilerimin belirtilen amaclar dogrultusunda islenmesine, yukaridaki taraflarla paylasilmasina ve belirtilen surelerle saklanmasina acik rizamla onay veriyorum.

Kira Guvence Teknoloji A.S.`;

export default function KmhAcikRizaScreen() {
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
    markConsentScrolled('kmh_finansal');
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
            <Text style={styles.headerTitle}>KMH Acik Riza</Text>
            <Text style={styles.headerSubtitle}>Finansal veri isleme onay</Text>
          </View>
          <View style={styles.iconWrap}>
            <Ionicons name="document-text" size={22} color="#93c5fd" />
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
        <Text style={styles.bodyText}>{KMH_ACIK_RIZA_METNI}</Text>
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

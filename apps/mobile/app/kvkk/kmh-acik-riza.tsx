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

const KMH_ACIK_RIZA_METNI = `KREDİLİ MEVDUAT HESABI (KMH) FİNANSAL VERİLERİN İŞLENMESİNE İLİŞKİN AÇIK RIZA METNİ

Son Güncelleme: 01.04.2026

VERİ SORUMLUSU

Kira Güvence Teknoloji A.Ş. ("Kira Güvence" veya "Şirket")
Adres: İstanbul, Türkiye
E-posta: info@kiraguvence.com

AÇIK RIZA BEYANI

6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, Kredili Mevduat Hesabı (KMH) başvurumun değerlendirilmesi ve hesap işlemlerimin yürütülmesi amacıyla aşağıdaki finansal ve kişisel verilerimin işlenmesine açık rızamla onay veriyorum:

İŞLENEN FİNANSAL VERİLER

KMH başvuru ve değerlendirme sürecinde aşağıdaki verilerim işlenmektedir:

1. Gelir Bilgileri: Aylık net gelir, gelir belgesi bilgileri
2. İstihdam Bilgileri: Çalışma durumu, işveren adı, iş başlangıç tarihi
3. Kira Bilgileri: Mevcut/tahmini kira tutarı, kira sözleşme bilgileri
4. Adres Bilgileri: İkamet adresi, kiralanacak taşınmaz adresi
5. Banka Hesap Bilgileri: IBAN, hesap hareketleri, bakiye bilgileri
6. Kredi Skorlama Verileri: Kredi geçmişi, risk değerlendirmesi sonuçları
7. KMH Hesap Bilgileri: Hesap numarası, bakiye, faiz oranları, vade bilgileri

İŞLENME AMAÇLARI

Finansal verilerim aşağıdaki amaçlarla işlenmektedir:

1. KMH başvuru uygunluğumun değerlendirilmesi
2. Kredi risk analizi ve skorlama yapılması
3. KMH hesap limitinin belirlenmesi (Gelir x 3, maksimum 500.000 TL)
4. Gelir-kira oranı kontrolü (Gelir >= Kira x 2)
5. KMH hesabının açılması ve yönetilmesi
6. Kira ödeme işlemlerinin gerçekleştirilmesi
7. Yasal raporlama yükümlülüklerinin yerine getirilmesi (BDDK, MASAK)
8. Dolandırıcılık ve usulsüzlük önleme

VERİLERİN AKTARILDIĞI TARAFLAR

Finansal verilerim aşağıdaki taraflarla paylaşılabilir:

- Anlaşmalı bankalar ve finansal kuruluşlar (KMH hesap işlemleri için)
- Kredi kayıt bürosu (KKB) ve risk merkezi
- Bankalar arası kart merkezi (BKM)
- BDDK ve MASAK (yasal zorunluluklar gereği)
- Bağımsız denetim ve hukuk müşavirlik firmaları

SAKLAMA SÜRESİ

Finansal verilerim aşağıdaki sürelerle saklanacaktır:

- KMH hesap bilgileri: Hesap kapanışına kadar + 10 yıl
- Başvuru değerlendirme verileri: 5 yıl
- Ödeme işlem kayıtları: 10 yıl (TTK ve vergi mevzuatı)
- Risk değerlendirme sonuçları: 5 yıl

HAKLARIM

KVKK'nin 11. maddesi kapsamında:
- Verilerimin işlenip işlenmediğini öğrenmek
- İşlenen verilerim hakkında bilgi talep etmek
- İşlenme amacını ve amaca uygunluğu sorgulamak
- Eksik veya yanlış işlenmesi halinde düzeltme talep etmek
- İşleme şartları ortadan kalktığında silinmesini talep etmek
- Otomatik analiz sonucu aleyhime bir sonuca itiraz etmek

haklarıma sahibim.

RIZANIN GERİ ALINMASI

Açık rızamı her zaman info@kiraguvence.com adresine yazılı bildirimde bulunarak geri alabilirim. Rızanın geri alınması, geri alma öncesinde yapılan işlemlerin hukuka uygunluğunu etkilemez. Rızanın geri alınması durumunda aktif KMH hesabımın kapatılması söz konusu olabilir.

ONAY

Yukarıdaki bilgilendirmeyi okudum ve anladım. Finansal verilerimin belirtilen amaçlar doğrultusunda işlenmesine, yukarıdaki taraflarla paylaşılmasına ve belirtilen sürelerle saklanmasına açık rızamla onay veriyorum.

Kira Güvence Teknoloji A.Ş.`;

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
            <Text style={styles.headerTitle}>Güvence Hesabı Açık Rıza</Text>
            <Text style={styles.headerSubtitle}>Finansal veri işleme onayı</Text>
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

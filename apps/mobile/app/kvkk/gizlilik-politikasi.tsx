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

const GIZLILIK_POLITIKASI = `GİZLİLİK POLİTİKASI

Son Güncelleme: 01.04.2026

Kira Güvence Teknoloji A.Ş. ("Kira Güvence") olarak kullanıcılarımızın gizliliğine önem veriyoruz. Bu politika, platformumuz üzerinden toplanan kişisel verilerin nasıl kullanıldığını, paylaşıldığını ve korunduğunu açıklamaktadır.

TOPLANAN BİLGİLER

Hesap Oluşturma Sırasında:
- Ad soyad
- T.C. Kimlik Numarası (TCKN)
- Telefon numarası
- Doğum tarihi

KMH Başvurusu Sırasında:
- İstihdam durumu ve işveren bilgisi
- Aylık gelir bilgisi
- İkamet adresi
- Tahmini kira tutarı

Platform Kullanımı Sırasında:
- Ödeme işlem bilgileri
- Sözleşme detayları
- Cihaz ve tarayıcı bilgileri
- IP adresi ve erişim logları
- Konum bilgileri (izin verildiğinde)

KULLANIMI

Toplanan bilgileriniz aşağıdaki amaçlarla kullanılmaktadır:

1. Hesap Yönetimi: Kullanıcı hesabınızın oluşturulması, doğrulanması ve yönetimi
2. Hizmet Sunumu: KMH başvurusu, kira ödeme işlemleri ve sözleşme yönetimi
3. Kimlik Doğrulama: KYC süreçleri ve MASAK uyumluluğu
4. Güvenlik: Dolandırıcılık tespiti, yetkisiz erişim önleme
5. İletişim: İşlem bildirimleri, ödeme hatırlatıcıları, hizmet güncellemeleri
6. Yasal Uyumluluk: BDDK, MASAK ve diğer düzenleyici kurumların gerekliliklerinin karşılanması
7. Hizmet İyileştirme: Kullanıcı deneyiminin analizi ve platform geliştirme

PAYLAŞILMASI

Kişisel verileriniz aşağıdaki durumlarda üçüncü taraflarla paylaşılabilir:

Banka ve Finans Kuruluşları: KMH hesap işlemleri ve ödeme süreçlerinin yürütülmesi için
Ödeme Altyapı Sağlayıcıları: Kira ödeme işlemlerinin gerçekleştirilmesi için
Bulut Hizmet Sağlayıcıları: Verilerin güvenli bir şekilde saklanması için
Yetkili Kamu Kurumları: Yasal zorunluluklar gereği (BDDK, MASAK, mahkeme kararları)
Hukuk Müşavirleri: Hukuki süreçlerin yürütülmesi için

Verileriniz, ticari amaçlarla üçüncü taraflara satılmaz veya kiralanmaz.

GÜVENLİK

Kişisel verilerinizin güvenliğini sağlamak için aşağıdaki önlemleri almaktayız:

- SSL/TLS şifreleme ile veri iletimi
- Veritabanında şifrelenmiş saklama (TCKN hashleme dahil)
- Erişim kontrolleri ve yetkilendirme mekanizmaları
- Düzenli güvenlik denetimleri ve penetrasyon testleri
- Çalışanlara yönelik bilgi güvenliği eğitimleri
- OWASP standartlarına uygun uygulama güvenliği
- JWT tabanlı kimlik doğrulama ve oturum yönetimi
- Rate limiting ve DDoS koruması

ÇEREZLER VE İZLEME

Mobil uygulamamızda:
- Oturum yönetimi için güvenli token saklama kullanılmaktadır
- Analitik amaçlı anonim kullanım verileri toplanabilir
- Üçüncü taraf izleme araçları kullanılmamaktadır

ÇOCUKLARIN GİZLİLİĞİ

Platformumuz 18 yaşından küçük bireylere yönelik değildir. Bilerek 18 yaşından küçük bireylerden kişisel veri toplamamaktayız.

HAKLARINIZ

6698 sayılı KVKK kapsamında aşağıdaki haklara sahipsiniz:

1. Kişisel verilerinizin işlenip işlenmediğini öğrenme
2. İşlenmişse bilgi talep etme
3. İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
4. Aktarıldığı üçüncü kişileri bilme
5. Eksik veya yanlış işlenmesi halinde düzeltilmesini isteme
6. Silinmesini veya yok edilmesini isteme
7. Aktarıldığı üçüncü kişilere bildirilmesini isteme
8. Otomatik analiz sonucu aleyhinize bir sonuca itiraz etme
9. Kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme

HESAP SİLME

Hesabınızı ve ilişkili verilerinizi silmek istemeniz durumunda info@kiraguvence.com adresine başvurabilirsiniz. Yasal saklama yükümlülüklerine tabi veriler hariç, tüm verileriniz 30 gün içinde silinir.

POLİTİKA GÜNCELLEMELERİ

Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişiklikler yapıldığında uygulama içinden ve/veya e-posta yoluyla bilgilendirilirsiniz.

İLETİŞİM

Gizlilik ile ilgili sorularınız için:
E-posta: info@kiraguvence.com
Web: https://kiraguvence.com

Kira Güvence Teknoloji A.Ş.`;

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
            <Text style={styles.headerTitle}>Gizlilik Politikası</Text>
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

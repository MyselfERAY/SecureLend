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

const AYDINLATMA_METNI = `KİŞİSEL VERİLERİN İŞLENMESİNE İLİŞKİN AYDINLATMA METNİ

Son Güncelleme: 01.04.2026

VERİ SORUMLUSU

Kira Güvence Teknoloji A.Ş. ("Kira Güvence" veya "Şirket") olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla sizleri aydınlatmak istiyoruz.

Adres: İstanbul, Türkiye
E-posta: info@kiraguvence.com
Web: https://kiraguvence.com

İŞLENEN KİŞİSEL VERİLER

Platformumuz üzerinden aşağıdaki kişisel verileriniz işlenmektedir:

Kimlik Bilgileri: Ad soyad, T.C. Kimlik Numarası (TCKN), doğum tarihi
İletişim Bilgileri: Telefon numarası, e-posta adresi
Finansal Bilgiler: Aylık gelir, istihdam durumu, işveren bilgisi, kira tutarı, banka hesap bilgileri
Konum Bilgileri: İkamet adresi
İşlem Bilgileri: Ödeme geçmişi, sözleşme detayları, KMH başvuru bilgileri
Dijital Kimlik Bilgileri: Cihaz bilgileri, IP adresi, oturum bilgileri

İŞLENME AMACI

Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:

1. Üyelik ve hesap işlemlerinin yürütülmesi
2. Kimlik doğrulama ve KYC (Know Your Customer) süreçlerinin tamamlanması
3. Kredili Mevduat Hesabı (KMH) başvuru ve değerlendirme süreçlerinin yürütülmesi
4. Kira ödeme işlemlerinin gerçekleştirilmesi ve takibi
5. Sözleşme süreçlerinin yürütülmesi
6. Yasal yükümlülüklerin yerine getirilmesi (BDDK, MASAK, SPK mevzuatı)
7. Risk değerlendirmesi ve kredi skorlama
8. Müşteriye özel hizmet ve ürün önerileri sunulması
9. Platform güvenliğinin sağlanması ve dolandırıcılık önleme
10. İstatistiksel analizler ve hizmet iyileştirme

HUKUKİ SEBEPLER

Kişisel verileriniz aşağıdaki hukuki sebeplere dayanılarak işlenmektedir:

- Bir sözleşmenin kurulması veya ifası (KVKK m.5/2-c)
- Veri sorumlusunun hukuki yükümlülüğü (KVKK m.5/2-c)
- Bir hakkın tesisi, kullanılması veya korunması (KVKK m.5/2-e)
- Veri sorumlusunun meşru menfaati (KVKK m.5/2-f)
- Açık rızanız (KVKK m.5/1)

AKTARIM

Kişisel verileriniz, yukarıdaki amaçlar doğrultusunda:

- İş ortakları ve hizmet sağlayıcılarla (ödeme altyapısı, bulut hizmetleri)
- Bankalar ve finansal kuruluşlarla (KMH işlemleri kapsamında)
- Yasal zorunluluklar gereği yetkili kamu kurum ve kuruluşlarıyla (BDDK, MASAK, mahkemeler)
- Hukuk müşavirleri ve denetçilerle

paylaşılabilmektedir. Verileriniz yurt dışına aktarılması durumunda KVKK m.9 hükümleri uygulanır.

SAKLAMA SÜRESİ

Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca ve yasal saklama sürellerince muhafaza edilir:

- Hesap bilgileri: Üyelik devam ettiği sürece + 10 yıl
- Finansal işlem kayıtları: 10 yıl (TTK ve vergi mevzuatı)
- KYC/Kimlik doğrulama verileri: 10 yıl (MASAK mevzuatı)
- İletişim kayıtları: 3 yıl
- Log kayıtları: 2 yıl

Saklama süresi sona erdikten sonra verileriniz silinir, yok edilir veya anonim hale getirilir.

HAKLARINIZ

KVKK'nin 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:

a) Kişisel verilerinizin işlenip işlenmediğini öğrenme
b) Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme
c) Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme
d) Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme
e) Kişisel verilerin eksik veya yanlış işlenmesi halinde bunların düzeltilmesini isteme
f) KVKK'nin 7. maddesinde öngörülen koşullar çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme
g) Yapılan işlemlerin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme
h) İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme
i) Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme

Haklarınızı kullanmak için info@kiraguvence.com adresine yazılı olarak başvurabilirsiniz.

Kira Güvence Teknoloji A.Ş.`;

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
            <Text style={styles.headerTitle}>Aydınlatma Metni</Text>
            <Text style={styles.headerSubtitle}>KVKK 6698 Sayılı Kanun</Text>
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

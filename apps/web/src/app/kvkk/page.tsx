import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni | Kira Guvence',
};

export default function KVKKPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-6 flex items-center justify-between">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">&larr; Ana Sayfa</Link>
          <Link
            href="/veri-talebi"
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition"
          >
            Veri Talebi Formu
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">KVKK Aydınlatma Metni</h1>
        <p className="text-sm text-slate-500 mb-10">Son güncelleme: Nisan 2026 · Sürüm 1.0</p>

        <div className="space-y-8 text-slate-700 leading-relaxed">

          {/* Veri Sorumlusu */}
          <section>
            <p>
              <strong>Veri Sorumlusu:</strong> SecureLend Teknoloji A.Ş. (&quot;Şirket&quot;, &quot;SecureLend&quot;)
              — <a href="mailto:info@kiraguvence.com" className="text-blue-600 hover:underline">info@kiraguvence.com</a>
              {' '}— <a href="https://kiraguvence.com" className="text-blue-600 hover:underline">kiraguvence.com</a>
            </p>
            <p className="mt-2 text-sm text-slate-500">
              VERBİS Sicil No: [VERBİS Kayıt No] · KEP: [KEP Adresi]
            </p>
          </section>

          {/* 1. İşleme Amacı */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Kişisel Verilerin İşlenme Amacı ve Hukuki Sebebi</h2>
            <p className="mb-3">
              Kişisel verileriniz; 6698 sayılı KVKK kapsamında aşağıdaki amaç ve hukuki sebeplerle işlenmektedir:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Sözleşmenin kurulması / ifası (KVKK m.5/2-c):</strong> Hesap oluşturma, kimlik doğrulama, kira sözleşmesi yönetimi, KMH başvurusu, ödeme takibi.</li>
              <li><strong>Kanuni yükümlülük (KVKK m.5/2-a):</strong> Vergi mevzuatı, 5549 sayılı MASAK Kanunu, BDDK ve diğer düzenleyici kurum gereklilikleri.</li>
              <li><strong>Meşru menfaat (KVKK m.5/2-f):</strong> Bilgi güvenliği, dolandırıcılık tespiti, istatistiksel analiz, hukuki süreç takibi.</li>
              <li><strong>Açık rıza (KVKK m.5/1):</strong> Profilleme, pazarlama bildirimleri, KKB/Findeks sorgulama, üçüncü taraf veri aktarımı (rıza gerektiren haller), otomatik kredi değerlendirmesi.</li>
            </ul>
          </section>

          {/* 2. İşlenen Veriler */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. İşlenen Kişisel Veri Kategorileri</h2>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>Kimlik:</strong> T.C. Kimlik No (geri dönüşümsüz hash ile saklanır), ad, soyad, doğum tarihi.</li>
              <li><strong>İletişim:</strong> Cep telefonu, e-posta adresi.</li>
              <li><strong>Adres:</strong> İkametgah, iş adresi, kira konusu taşınmazın adresi.</li>
              <li><strong>Finansal:</strong> Gelir, istihdam, banka hesap bilgileri (IBAN), kredi notu (Findeks/KKB), mevcut borçlar — <em>yalnızca KMH başvurusunda ve açık rıza ile</em>.</li>
              <li><strong>İşlem:</strong> Kira sözleşmesi detayları, ödeme geçmişi, KMH başvuru sonucu.</li>
              <li><strong>Teknik:</strong> IP adresi, tarayıcı/cihaz bilgisi, oturum ve erişim kayıtları.</li>
            </ul>
          </section>

          {/* 3. Aktarım */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Kişisel Verilerin Aktarıldığı Taraflar</h2>
            <p className="mb-2 text-sm">
              Verileriniz KVKK&apos;nın 8. ve 9. maddeleri kapsamında aşağıdaki taraflara aktarılabilir:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>Anlaşmalı bankalar ve finans kuruluşları:</strong> KMH başvurusu, hesap açılışı ve ödeme işlemleri.</li>
              <li><strong>KKB / Risk Merkezi:</strong> Kredi geçmişi sorgusu — yalnızca açık rıza ile.</li>
              <li><strong>Kamu kurumları:</strong> BDDK, MASAK, Gelir İdaresi, adli/idari makamlar — yasal zorunluluk halinde.</li>
              <li><strong>Bulut altyapı sağlayıcıları:</strong> ISO 27001 sertifikalı, veriler şifreli olarak saklanır.</li>
              <li><strong>SMS/e-posta hizmet sağlayıcıları:</strong> Bildirim iletimi için asgari veri ile ve gizlilik sözleşmesi altında.</li>
            </ul>
          </section>

          {/* 4. Saklama */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Saklama Süreleri</h2>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Kimlik ve iletişim bilgileri: Üyelik süresi + 10 yıl (Türk Ticaret Kanunu)</li>
              <li>Finansal kayıtlar ve işlem geçmişi: İşlem tarihinden itibaren 10 yıl (Vergi Usul Kanunu)</li>
              <li>KMH başvuru bilgileri: Başvuru tarihinden itibaren 5 yıl (bankacılık mevzuatı)</li>
              <li>MASAK kimlik tespiti kayıtları: 8 yıl</li>
              <li>Teknik log kayıtları: 2 yıl (5651 sayılı Kanun)</li>
              <li>Pazarlama izinleri ve açık rıza kayıtları: Rıza geri çekilene kadar + 3 yıl ispat yükümlülüğü</li>
            </ul>
            <p className="mt-2 text-sm text-slate-500">
              Saklama süresi dolan veriler, Şirket&apos;in Kişisel Veri Saklama ve İmha Politikası&apos;na uygun
              olarak silinir, yok edilir veya anonimleştirilir.
            </p>
          </section>

          {/* 5. Haklar */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. KVKK Madde 11 Kapsamındaki Haklarınız</h2>
            <p className="mb-2 text-sm">Veri sahibi sıfatıyla aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme</li>
              <li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde/dışında aktarıldığı üçüncü kişileri bilme</li>
              <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
              <li>KVKK m.7 kapsamında silinmesini / yok edilmesini isteme</li>
              <li>Düzeltme ve silme işlemlerinin aktarılan üçüncü kişilere bildirilmesini isteme</li>
              <li>Münhasıran otomatik sistemlerle analiz sonucu aleyhinize çıkan karara itiraz etme</li>
              <li>Kanuna aykırı işleme nedeniyle uğradığınız zararın tazminini talep etme</li>
            </ul>
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Haklarınızı kullanmak için{' '}
              <Link href="/veri-talebi" className="font-semibold underline">
                Veri Talebi Formu
              </Link>
              &apos;nu doldurun veya{' '}
              <a href="mailto:info@kiraguvence.com" className="font-semibold underline">
                info@kiraguvence.com
              </a>{' '}
              adresine yazın. Başvurular en geç <strong>30 gün</strong> içinde ücretsiz yanıtlanır.
            </div>
          </section>

          {/* 6. Veri İhlali Bildirim Prosedürü */}
          <section className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Veri İhlali Bildirim Prosedürü</h2>
            <p className="text-sm mb-3">
              Kişisel verilerinizin güvenliğini tehdit eden bir veri ihlali tespit edilmesi durumunda
              SecureLend aşağıdaki prosedürü uygular:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-sm">
              <li>
                <strong>Kurul Bildirimi:</strong> Kişisel Verileri Koruma Kurulu&apos;na ihlal tespitinden
                itibaren en geç <strong>72 saat</strong> içinde bildirimde bulunulur (KVKK m.12/5).
              </li>
              <li>
                <strong>Kullanıcı Bildirimi:</strong> İhlalin haklarınız ve özgürlükleriniz üzerinde yüksek
                risk oluşturması halinde, tarafınıza en kısa sürede bildirim yapılır. Bildirimde ihlalin
                niteliği, etkilenen veri kategorileri, olası sonuçları ve alınan önlemler yer alır.
              </li>
              <li>
                <strong>Acil Müdahale:</strong> İhlal tespit edilir edilmez güvenlik açığı kapatılır,
                etkilenen sistemler izole edilir ve delil niteliğindeki kayıtlar muhafaza edilir.
              </li>
              <li>
                <strong>Olay Sonrası:</strong> İhlal kök nedeni analizi yapılır; benzer olayların önlenmesi
                için teknik ve idari tedbirler güncellenir. Sonuçlar iç denetim raporuna eklenir.
              </li>
              <li>
                <strong>İletişim:</strong> Veri ihlali bildirimi için{' '}
                <a href="mailto:info@kiraguvence.com" className="text-blue-600 hover:underline font-medium">
                  info@kiraguvence.com
                </a>{' '}
                adresine ulaşabilirsiniz.
              </li>
            </ol>
          </section>

          {/* 7. VERBİS */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. VERBİS Kaydı</h2>
            <p className="text-sm">
              SecureLend, 6698 sayılı KVKK&apos;nın 16. maddesi uyarınca Veri Sorumluları Sicil Bilgi Sistemi
              (VERBİS)&apos;ne kayıtlıdır. Kayıt bilgileri güncel tutulmakta ve yıllık güncelleme
              yükümlülükleri yerine getirilmektedir.
            </p>
          </section>

          {/* İletişim */}
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-5">
            <h2 className="text-xl font-bold text-slate-900 mb-3">İletişim ve Başvuru Yolları</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <strong>Platform üzerinden:</strong>{' '}
                <Link href="/veri-talebi" className="text-blue-600 hover:underline font-medium">
                  Veri Talebi Formu
                </Link>
              </li>
              <li>
                <strong>E-posta:</strong>{' '}
                <a href="mailto:info@kiraguvence.com" className="text-blue-600 hover:underline">
                  info@kiraguvence.com
                </a>
              </li>
              <li><strong>KEP:</strong> [KEP Adresi]</li>
              <li><strong>Posta/Noter:</strong> [Şirket Merkez Adresi], İstanbul, Türkiye</li>
            </ul>
            <p className="mt-3 text-sm text-slate-500">
              Kişisel Verileri Koruma Kurumu hakkında bilgi:{' '}
              <span className="font-medium text-slate-700">kvkk.gov.tr</span> · ALO 198
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}

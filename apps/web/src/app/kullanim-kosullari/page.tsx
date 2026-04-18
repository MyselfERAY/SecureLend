import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kullanım Koşulları',
  description: 'Kira Güvence kullanım koşulları, zorunlu arabuluculuk ve yetki mahkemesi hükümleri.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/kullanim-kosullari' },
};

export default function KullanimKosullariPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">&larr; Ana Sayfa</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Kullanım Koşulları</h1>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed">
          <p>
            Bu kullanım koşulları, SecureLend platformunu (&quot;Platform&quot;) kullanımınızı düzenler.
            Platformu kullanarak bu koşulları kabul etmiş sayılırsınız.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">1. Hizmet Tanımı</h2>
          <p>
            SecureLend, kiracılar, ev sahipleri ve bankalar arasında kira ödeme süreçlerini dijitalleştiren
            bir fintech platformudur. KMH (Kredili Mevduat Hesabı) finansmanı ve güvenli ödeme altyapısı sunar.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">2. Hesap Oluşturma</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Hesap oluşturmak için 18 yaşından büyük olmanız gerekmektedir</li>
            <li>Sağladığınız bilgilerin doğru ve güncel olması sizin sorumluluğunuzdadır</li>
            <li>Hesap güvenliğinden siz sorumlusunuz</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8">3. Kabul Edilemez Kullanım</h2>
          <p>Aşağıdaki davranışlar yasaktır:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Sahte veya yanıltıcı bilgi sağlama</li>
            <li>Platformu yasadışı amaçlarla kullanma</li>
            <li>Başkalarının hesaplarına yetkisiz erişim</li>
            <li>Platformun güvenliğini tehdit eden faaliyetler</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8">4. Ödeme Koşulları</h2>
          <p>
            Kira ödemeleri, Platform üzerinden belirlenen tarih ve tutarlarda gerçekleştirilir.
            Gecikme durumunda sözleşmede belirtilen koşullar geçerlidir.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">5. Sorumluluk Sınırı</h2>
          <p>
            SecureLend, platformun kesintisiz çalışacağını garanti etmez. Teknik arızalar veya
            bakım çalışmaları nedeniyle oluşabilecek geçici kesintilerden sorumlu tutulamaz.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">6. Değişiklikler</h2>
          <p>
            Bu koşullar önceden bildirim yapılarak değiştirilebilir. Güncel koşullar her zaman
            bu sayfada yayınlanır.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">7. İletişim</h2>
          <p>
            Sorularınız için <a href="mailto:info@kiraguvence.com" className="text-blue-600 hover:underline">info@kiraguvence.com</a> adresine ulaşabilirsiniz.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">8. Zorunlu Arabuluculuk (7155 Sayılı Kanun)</h2>
          <p>
            7155 sayılı Kanun ile 6102 sayılı Türk Ticaret Kanunu&apos;na eklenen m.5/A hükmü uyarınca,
            ticari nitelikteki para alacaklarına ilişkin uyuşmazlıklarda dava açılmadan önce
            arabuluculuğa başvurulması zorunludur. Arabuluculuk dava şartı niteliğindedir; bu
            aşamaya başvurmaksızın açılan dava usulden reddedilir.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Yetkili Arabuluculuk Merkezi:</strong> Adalet Bakanlığı Arabuluculuk Daire
              Başkanlığı siciline kayıtlı İstanbul Arabuluculuk Merkezi ya da uyuşmazlık konusu
              veya tarafların yerleşim yerine göre yetkili diğer resmi arabuluculuk merkezi.
            </li>
            <li>
              Arabuluculuk başvurusu; arabulucuya doğrudan, Arabuluculuk Daire Başkanlığı&apos;na
              veya yetkili mahkeme yazı işleri müdürlüğüne yapılabilir.
            </li>
            <li>
              Arabuluculuk görüşmelerinin başarısızlıkla sonuçlandığının tutanakla tespitinden
              itibaren dava açma hakkı doğar.
            </li>
            <li>
              <strong>İstisna:</strong> Tüketici sıfatıyla işlem yapan kullanıcıların
              uyuşmazlıklarında 6502 sayılı TKHK kapsamındaki tüketici hakem heyeti ve tüketici
              mahkemesi yolu geçerlidir; bu kullanıcılara zorunlu ticari arabuluculuk hükmü
              uygulanmaz.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8">9. Yetkili Mahkeme ve Yetki Anlaşması</h2>
          <p>
            İşbu sözleşmeden doğan ve arabuluculuk yoluyla çözüme kavuşturulamayan
            uyuşmazlıklarda yetkili yargı mercii aşağıda belirtilmiştir:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Ticari uyuşmazlıklar:</strong> İstanbul Mahkemeleri ve İcra Daireleri
              münhasıran yetkilidir. Bu yetki anlaşması Hukuk Muhakemeleri Kanunu m.17 uyarınca
              yapılmış olup yalnızca tacir sıfatı taşıyan veya ticari amaçla işlem yapan taraflar
              arasında geçerlidir.
            </li>
            <li>
              <strong>Tüketici uyuşmazlıkları:</strong> 6502 sayılı TKHK m.73 uyarınca tüketicinin
              yerleşim yeri veya hizmetin ifa edildiği yer mahkemesi yetkilidir; yukarıdaki ticari
              yetki anlaşması bu kullanıcılara karşı ileri sürülemez.
            </li>
          </ul>

          <p className="text-sm text-slate-400 mt-12">Son güncelleme: Nisan 2026 — Sürüm 1.1</p>
        </div>
      </main>
    </div>
  );
}

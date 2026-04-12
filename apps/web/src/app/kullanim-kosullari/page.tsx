import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kullanım Koşulları',
  description: 'Kira Güvence kullanım koşulları ve hizmet şartları.',
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

          <p className="text-sm text-slate-400 mt-12">Son güncelleme: Nisan 2026</p>
        </div>
      </main>
    </div>
  );
}

import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Çerez Politikası | SecureLend',
};

export default function CerezPolitikasiPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">&larr; Ana Sayfa</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Çerez Politikası</h1>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed">
          <p>
            SecureLend web sitesi, kullanıcı deneyimini iyileştirmek amacıyla çerezler kullanmaktadır.
            Bu politika, hangi çerezlerin kullanıldığını ve bunları nasıl yönetebileceğinizi açıklar.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">1. Çerez Nedir?</h2>
          <p>
            Çerezler, web sitemizi ziyaret ettiğinizde cihazınıza yerleştirilen küçük metin dosyalarıdır.
            Tercihlerinizi hatırlamamıza ve size daha iyi bir deneyim sunmamıza yardımcı olur.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">2. Kullanılan Çerez Türleri</h2>

          <h3 className="text-lg font-semibold text-slate-800 mt-4">Zorunlu Çerezler</h3>
          <p>
            Platformun temel işlevleri için gereklidir. Oturum yönetimi ve güvenlik kontrolleri bu çerezler
            aracılığıyla sağlanır. Devre dışı bırakılamazlar.
          </p>

          <h3 className="text-lg font-semibold text-slate-800 mt-4">Performans Çerezleri</h3>
          <p>
            Ziyaretçilerin platformu nasıl kullandığını anlamamıza yardımcı olur. Toplanan veriler
            anonim olarak işlenir ve hizmet kalitesinin artırılmasında kullanılır.
          </p>

          <h3 className="text-lg font-semibold text-slate-800 mt-4">İşlevsellik Çerezleri</h3>
          <p>
            Dil tercihi ve arayüz ayarları gibi tercihlerinizi hatırlar.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">3. Çerezleri Yönetme</h2>
          <p>
            Tarayıcı ayarlarınızdan çerezleri kabul etmeyi reddedebilir veya çerezler yerleştirilmeden
            önce uyarı alabilirsiniz. Ancak bazı çerezleri devre dışı bırakmanız platformun düzgün
            çalışmasını engelleyebilir.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">4. İletişim</h2>
          <p>
            Çerez politikamız hakkında sorularınız için <a href="mailto:info@kiraguvence.com" className="text-blue-600 hover:underline">info@kiraguvence.com</a> adresine
            ulaşabilirsiniz.
          </p>

          <p className="text-sm text-slate-400 mt-12">Son güncelleme: Nisan 2026</p>
        </div>
      </main>
    </div>
  );
}

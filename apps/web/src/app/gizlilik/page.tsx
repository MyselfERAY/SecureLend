import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gizlilik Politikasi',
  description: 'Kira Güvence gizlilik politikasi. Kisisel verilerinizin nasil islendigi ve korunduguyla ilgili bilgiler.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/gizlilik' },
};

export default function GizlilikPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">&larr; Ana Sayfa</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Gizlilik Politikası</h1>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed">
          <p>
            SecureLend olarak gizliliğinize saygı duyuyoruz. Bu politika, kişisel verilerinizin nasıl toplandığını,
            kullanıldığını ve korunduğunu açıklamaktadır.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">1. Toplanan Bilgiler</h2>
          <p>Platformumuzu kullanırken aşağıdaki bilgiler toplanabilir:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Hesap oluşturma sırasında sağladığınız kişisel bilgiler</li>
            <li>Platform üzerindeki işlem ve aktivite verileri</li>
            <li>Cihaz ve tarayıcı bilgileri, IP adresi</li>
            <li>Çerezler aracılığıyla toplanan kullanım verileri</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8">2. Bilgilerin Kullanımı</h2>
          <p>Toplanan bilgiler şu amaçlarla kullanılır:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Hesabınızın oluşturulması ve yönetilmesi</li>
            <li>Kira ödeme ve sözleşme hizmetlerinin sunulması</li>
            <li>Güvenlik ve dolandırıcılık önleme</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>Hizmet kalitesinin artırılması</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8">3. Bilgilerin Korunması</h2>
          <p>
            Verileriniz SSL şifreleme, güvenli sunucularda barındırma ve erişim kontrolleri ile korunmaktadır.
            Hassas bilgiler (TCKN gibi) tek yönlü hash algoritmaları ile saklanır.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">4. Üçüncü Taraflarla Paylaşım</h2>
          <p>
            Kişisel verileriniz, yasal zorunluluklar ve hizmet gereksinimleri dışında üçüncü taraflarla paylaşılmaz.
            Ödeme işlemleri için anlaşmalı bankalar ve ödeme kuruluşları ile gerekli minimum veri paylaşılır.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">5. İletişim</h2>
          <p>
            Gizlilik politikamız hakkında sorularınız için <a href="mailto:info@kiraguvence.com" className="text-blue-600 hover:underline">info@kiraguvence.com</a> adresine
            ulaşabilirsiniz.
          </p>

          <p className="text-sm text-slate-400 mt-12">Son güncelleme: Nisan 2026</p>
        </div>
      </main>
    </div>
  );
}

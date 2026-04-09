import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni | SecureLend',
};

export default function KVKKPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">&larr; Ana Sayfa</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">KVKK Aydınlatma Metni</h1>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed">
          <p><strong>Veri Sorumlusu:</strong> SecureLend Teknoloji A.Ş. (&quot;Şirket&quot;)</p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">1. Kişisel Verilerin İşlenme Amacı</h2>
          <p>
            Kişisel verileriniz; hizmetlerimizin sunulması, sözleşmelerin kurulması ve ifası, ödeme işlemlerinin gerçekleştirilmesi,
            yasal yükümlülüklerin yerine getirilmesi, müşteri ilişkilerinin yönetimi ve güvenliğin sağlanması amaçlarıyla
            6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında işlenmektedir.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">2. İşlenen Kişisel Veriler</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Kimlik bilgileri (ad, soyad, T.C. kimlik numarası)</li>
            <li>İletişim bilgileri (e-posta, telefon numarası, adres)</li>
            <li>Finansal bilgiler (banka hesap bilgileri, ödeme geçmişi)</li>
            <li>İşlem güvenliği bilgileri (IP adresi, giriş kayıtları)</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8">3. Kişisel Verilerin Aktarımı</h2>
          <p>
            Kişisel verileriniz, yasal zorunluluklar çerçevesinde yetkili kamu kurum ve kuruluşlarına,
            hizmet aldığımız iş ortaklarına ve ödeme kuruluşlarına KVKK&apos;nın 8. ve 9. maddeleri
            kapsamında aktarılabilmektedir.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">4. Veri Sahibinin Hakları</h2>
          <p>KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
            <li>KVKK&apos;nın 7. maddesindeki şartlar çerçevesinde silinmesini isteme</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8">5. İletişim</h2>
          <p>
            KVKK kapsamındaki taleplerinizi <a href="mailto:info@kiraguvence.com" className="text-blue-600 hover:underline">info@kiraguvence.com</a> adresine
            iletebilirsiniz.
          </p>

          <p className="text-sm text-slate-400 mt-12">Son güncelleme: Nisan 2026</p>
        </div>
      </main>
    </div>
  );
}

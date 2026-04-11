import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acik Riza Formu',
  description: 'Kira Guvence acik riza formu. KVKK kapsaminda kisisel veri isleme onayi.',
  alternates: { canonical: '/acik-riza' },
};

export default function AcikRizaPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-6 flex items-center justify-between">
          <Link href="/kvkk" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            &larr; KVKK Aydınlatma Metni
          </Link>
          <Link
            href="/veri-talebi"
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition"
          >
            Rızamı Geri Al
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Açık Rıza Beyannamesi</h1>
        <p className="text-sm text-slate-500 mb-10">
          Sürüm 2.0 · Nisan 2026 · 6698 sayılı KVKK m.5/1 kapsamında
        </p>

        <div className="space-y-8 text-slate-700 leading-relaxed">

          {/* Giriş */}
          <section className="rounded-2xl border border-blue-100 bg-blue-50 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Açık Rıza Nedir?</h2>
            <p className="text-sm">
              6698 sayılı KVKK&apos;nın 3. maddesi uyarınca açık rıza;{' '}
              <strong>belirli bir konuya ilişkin, bilgilendirilmeye dayanan ve özgür iradeyle
              açıklanan onay</strong> anlamına gelir. Aşağıdaki rızaları dilediğiniz zaman,
              herhangi bir gerekçe göstermeksizin geri çekebilirsiniz. Rıza geri çekimi ileriye
              dönük geçerlidir; önceden yapılan işlemlerin hukuki geçerliliğini etkilemez.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Rızanızı geri çekmek için:{' '}
              <Link href="/veri-talebi" className="text-blue-600 font-medium hover:underline">
                Veri Talebi Formu
              </Link>{' '}
              → <em>&quot;Açık rızamın geri alınması&quot;</em> seçeneğini kullanın.
            </p>
          </section>

          {/* Rıza 1: KVKK Aydınlatma */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white">
                1
              </span>
              <h2 className="text-xl font-bold text-slate-900">KVKK Aydınlatma Bildirimi</h2>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 space-y-3 text-sm">
              <p className="text-slate-600">
                Bu onay teknik olarak bir &quot;rıza&quot; değil,{' '}
                <strong>aydınlatma bildirimidir</strong>. KVKK m.10 uyarınca veri sorumlusu
                (SecureLend), veri işleme faaliyetleri hakkında sizi bilgilendirmekle yükümlüdür.
                Bu onay ile:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>
                  <Link href="/kvkk" className="text-blue-600 hover:underline">
                    KVKK Aydınlatma Metni
                  </Link>
                  &apos;ni okuduğunuzu ve anladığınızı beyan edersiniz.
                </li>
                <li>
                  Hangi verilerinizin, hangi amaçla ve hangi hukuki dayanak ile işlendiği
                  konusunda bilgilendirilmiş olursunuz.
                </li>
              </ul>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 text-xs">
                Bu bildirim hizmet kullanımı için <strong>zorunludur</strong>. Veri işleme
                faaliyetlerine itiraz hakkınız, KVKK m.11 kapsamında ayrıca kullanılabilir.
              </div>
            </div>
          </section>

          {/* Rıza 2: KMH Finansal Veri */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                2
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                KMH Finansal Veri İşleme ve Paylaşım Açık Rızası
              </h2>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 space-y-4 text-sm">
              <p className="text-slate-600">
                Bu açık rıza beyanı, Kredili Mevduat Hesabı (KMH) başvurusu kapsamında aşağıdaki
                finansal ve kişisel verilerin işlenmesi ile belirtilen taraflarla paylaşılması için
                gereklidir. KMH başvurusu yapmayı planlamıyorsanız bu onay zorunlu değildir; ancak
                KMH hizmetinden yararlanamayabilirsiniz.
              </p>

              <div>
                <p className="font-semibold text-slate-800 mb-3">
                  KYC Sürecinde İşlenen Veri Kategorileri, Amaçları ve Hukuki Dayanakları:
                </p>
                <div className="space-y-2">
                  {[
                    {
                      label: 'T.C. Kimlik Numarası (TCKN)',
                      purpose:
                        'Kimlik tespiti (KPS doğrulaması), MASAK uyum kaydı, KMH hesap açılışı',
                      basis: 'Kanuni yükümlülük (m.5/2-a); Sözleşme ifası (m.5/2-c)',
                      note: 'Geri dönüşümsüz kriptografik hash ile saklanır; ham hali tutulmaz.',
                    },
                    {
                      label: 'IBAN',
                      purpose:
                        'Kira ödemelerinin kiracıdan ev sahibine aktarımı; KMH hesap bildirimi',
                      basis: 'Sözleşmenin ifası (m.5/2-c)',
                      note: 'Şifreli olarak saklanır.',
                    },
                    {
                      label: 'Gelir Belgesi / Gelir Beyanı',
                      purpose:
                        'KMH başvurusu kredi değerlendirmesi; anlaşmalı bankaya iletim',
                      basis: 'Açık rıza (m.5/1)',
                      note:
                        'Yalnızca KMH başvurusu yapılırsa işlenir. Rızasız işlenmez.',
                    },
                    {
                      label: 'İstihdam Durumu ve İşveren Bilgisi',
                      purpose: 'KMH risk değerlendirmesi; banka onay süreci',
                      basis: 'Açık rıza (m.5/1)',
                      note: null,
                    },
                    {
                      label: 'Kredi Notu (KKB / Findeks)',
                      purpose:
                        'KMH risk değerlendirmesi — yalnızca başvuru anında sorgulanır',
                      basis: 'Açık rıza (m.5/1)',
                      note: 'Sorgulama yalnızca başvuru yapıldığında, tek seferlik gerçekleştirilir.',
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
                    >
                      <div className="font-semibold text-slate-800">{item.label}</div>
                      <div className="text-slate-600 mt-0.5">
                        <span className="text-slate-400 text-xs">Amaç: </span>
                        {item.purpose}
                      </div>
                      <div className="text-slate-500 mt-0.5 text-xs">
                        <span className="text-slate-400">Hukuki dayanak: </span>
                        {item.basis}
                      </div>
                      {item.note && (
                        <div className="text-slate-400 mt-0.5 text-xs">Not: {item.note}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-800 mb-1">Aktarıldığı Taraflar:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>
                    Anlaşmalı bankalar ve finansal kuruluşlar (KMH hesap açılışı ve kredi
                    değerlendirmesi için asgari veri)
                  </li>
                  <li>KKB / Risk Merkezi (kredi notu sorgusu — yalnızca başvuru yapılırsa)</li>
                  <li>
                    Yasal zorunluluk halinde: BDDK, MASAK, Gelir İdaresi Başkanlığı, adli/idari makamlar
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-slate-800 mb-1">Saklama Süreleri:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>KMH başvuru bilgileri: Başvuru tarihinden itibaren 5 yıl (bankacılık mevzuatı)</li>
                  <li>Finansal kayıtlar: 10 yıl (Vergi Usul Kanunu m.253)</li>
                  <li>Açık rıza kayıtları: Rıza geri çekilene kadar + 3 yıl ispat yükümlülüğü</li>
                </ul>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-green-800 text-xs">
                <strong>Rıza Geri Çekme Hakkı:</strong> Bu onayınızı dilediğiniz zaman{' '}
                <Link href="/veri-talebi" className="underline font-medium">
                  Veri Talebi Formu
                </Link>{' '}
                üzerinden geri çekebilirsiniz. Geri çekme yalnızca ileriye dönük geçerlidir.
                KMH hizmetinin sürdürülmesi bu rızaya bağlı olduğundan, rıza geri çekimi KMH
                hizmetinin sonlandırılmasına yol açabilir.
              </div>
            </div>
          </section>

          {/* Rıza Kayıt Notu */}
          <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 space-y-2">
            <p className="font-semibold text-slate-800">Rıza Kaydı ve Güvenliği</p>
            <p>
              Kayıt sırasında verilen onaylar, sisteme tarih/saat damgası, IP adresi ve rıza sürüm
              numarası (v2.0) ile birlikte kaydedilmekte; KVKK m.12 kapsamındaki teknik ve idari
              tedbirler çerçevesinde güvenli şekilde saklanmaktadır. İspat yükümlülüğü kapsamında
              rıza kayıtları, geri çekilmeden itibaren 3 yıl süreyle tutulur.
            </p>
            <p>
              Sorularınız için:{' '}
              <a
                href="mailto:info@kiraguvence.com"
                className="text-blue-600 hover:underline"
              >
                info@kiraguvence.com
              </a>
              {' '}veya{' '}
              <Link href="/veri-talebi" className="text-blue-600 hover:underline">
                Veri Talebi Formu
              </Link>
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}

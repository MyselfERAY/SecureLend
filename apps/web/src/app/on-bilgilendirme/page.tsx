import Link from 'next/link';

export const metadata = {
  title: 'Ön Bilgilendirme Formu | KiraGüvence',
  description:
    '6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında zorunlu ön bilgilendirme formu.',
};

export default function OnBilgilendirmePage() {
  return (
    <div className="min-h-screen bg-[#060e1a] text-white">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">
            &larr; Ana Sayfa
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
              <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Ön Bilgilendirme Formu</h1>
              <p className="text-sm text-slate-400">6502 Sayılı TKHK m.48 — Mesafeli Sözleşmeler Yönetmeliği</p>
            </div>
          </div>
        </div>

        {/* Legal notice banner */}
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-medium text-amber-300">
            Bu form, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği (RG: 27.11.2014 / 29188) gereğince sunulmaktadır. Sözleşmeyi imzalamadan önce bu formu dikkatlice okuyunuz.
          </p>
        </div>

        <div className="space-y-6">
          {/* Section: Provider Info */}
          <Section title="Hizmet Sunucu Bilgileri">
            <InfoRow label="Unvan" value="SecureLend Teknoloji A.Ş." />
            <InfoRow label="E-posta" value="info@kiraguvence.com" />
            <InfoRow label="Web Sitesi" value="https://kiraguvence.com" />
            <InfoRow label="Hizmet" value="Dijital kira sözleşmesi yönetimi ve KMH başvuru aracılık platformu" />
          </Section>

          {/* Section: Service */}
          <Section title="Hizmetin Temel Nitelikleri">
            <p className="text-sm text-slate-300 leading-relaxed">
              KiraGüvence.com platformu aşağıdaki hizmetleri dijital ortamda (mesafeli usulde) sunmaktadır:
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
              <li className="flex gap-2"><span className="text-blue-400 mt-0.5">•</span><span>Kiracı ve ev sahibi arasında 6098 sayılı TBK kapsamında dijital kira sözleşmesi oluşturma, imzalama ve yönetimi</span></li>
              <li className="flex gap-2"><span className="text-blue-400 mt-0.5">•</span><span>Kredili Mevduat Hesabı (KMH) başvurusu için aracılık hizmeti</span></li>
              <li className="flex gap-2"><span className="text-blue-400 mt-0.5">•</span><span>Kira ödeme hatırlatması ve takip hizmetleri</span></li>
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              Platform, ödeme kuruluşu veya banka değildir. Yalnızca teknoloji tabanlı aracılık hizmeti sunmaktadır.
            </p>
          </Section>

          {/* Section: Pricing */}
          <Section title="Ücretler ve Ödeme Koşulları">
            <ul className="space-y-1.5 text-sm text-slate-300">
              <li className="flex gap-2"><span className="text-emerald-400 mt-0.5">✓</span><span>Platform temel hizmetleri <strong className="text-white">ücretsizdir</strong>.</span></li>
              <li className="flex gap-2"><span className="text-emerald-400 mt-0.5">✓</span><span>KMH başvurusu başarılı olur ve hesap açılırsa aracılık komisyonu uygulanabilir.</span></li>
              <li className="flex gap-2"><span className="text-emerald-400 mt-0.5">✓</span><span>Komisyon oranı ve tutarı, başvuru tamamlanmadan önce açıkça gösterilir.</span></li>
              <li className="flex gap-2"><span className="text-emerald-400 mt-0.5">✓</span><span>Tüm fiyatlar KDV dahildir.</span></li>
            </ul>
          </Section>

          {/* Section: Withdrawal Right — highlighted */}
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-emerald-300">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Cayma Hakkınız — Önemli Bilgilendirme
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              <WithdrawalItem label="Cayma Süresi" value="Sözleşme kurulduğundan itibaren 14 takvim günü" />
              <WithdrawalItem label="Cayma Yöntemi" value="E-posta veya platform içi form" />
              <WithdrawalItem label="E-posta Adresi" value="info@kiraguvence.com" />
              <WithdrawalItem label="Geri Ödeme Süresi" value="Bildirimden itibaren 14 gün içinde" />
            </div>
            <p className="mt-4 text-sm text-emerald-200/80">
              Herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkınızı kullanabilirsiniz. Cayma hakkının kullanıldığına ilişkin ispat yükü size aittir.
            </p>
          </div>

          {/* Section: Exceptions */}
          <Section title="Cayma Hakkının Kullanılamayacağı Durumlar">
            <p className="mb-3 text-sm text-slate-400">
              Mesafeli Sözleşmeler Yönetmeliği&apos;nin 15. maddesi uyarınca aşağıdaki hallerde cayma hakkı kullanılamaz:
            </p>
            <ul className="space-y-1.5 text-sm text-slate-300">
              <li className="flex gap-2"><span className="text-red-400 mt-0.5">a)</span><span>Cayma süresi içinde ifasına başlanmış ve tamamlanan anlık hizmetler</span></li>
              <li className="flex gap-2"><span className="text-red-400 mt-0.5">b)</span><span>Fiyatı finans piyasası dalgalanmalarına bağlı ve hizmet sunucusu kontrolünde olmayan mal/hizmetler</span></li>
              <li className="flex gap-2"><span className="text-red-400 mt-0.5">c)</span><span>Tüketicinin açık onayı ile cayma süresi dolmadan ifasına başlanmış dijital içerik teslimleri</span></li>
            </ul>
          </Section>

          {/* Section: Dispute */}
          <Section title="Uyuşmazlık Çözüm Yolları">
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex gap-2">
                <span className="text-blue-400 font-semibold min-w-[20px]">1.</span>
                <span><strong className="text-white">Tüketici Hakem Heyeti:</strong> Yerel ilçe/il ticaret müdürlükleri (2026 parasal sınırlar uygulanır)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-semibold min-w-[20px]">2.</span>
                <span><strong className="text-white">Tüketici Mahkemeleri:</strong> Tüketici davalarında yetkili mahkemeler</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-semibold min-w-[20px]">3.</span>
                <span><strong className="text-white">Ticaret Bakanlığı TUBIS:</strong> tuketici.gtb.gov.tr</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-semibold min-w-[20px]">4.</span>
                <span><strong className="text-white">Platform Şikayeti:</strong> info@kiraguvence.com (en geç 3 iş günü içinde yanıt)</span>
              </li>
            </ul>
          </Section>

          {/* Footer */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
            <p>Son Güncelleme: Nisan 2026 — Sürüm: 1.0</p>
            <p>Dayanak: 6502 sayılı TKHK m.48, Mesafeli Sözleşmeler Yönetmeliği (RG: 27.11.2014 / 29188)</p>
            <p>
              Kişisel verileriniz için:{' '}
              <Link href="/privacy-policy" className="text-blue-400 hover:underline">
                Gizlilik Politikası
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5">
      <h2 className="mb-4 text-base font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-slate-700/50 last:border-0 sm:flex-row sm:gap-4">
      <span className="min-w-[120px] text-xs font-medium text-slate-500">{label}</span>
      <span className="text-sm text-slate-200">{value}</span>
    </div>
  );
}

function WithdrawalItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
      <div className="text-xs font-medium text-emerald-400/70">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-emerald-200">{value}</div>
    </div>
  );
}

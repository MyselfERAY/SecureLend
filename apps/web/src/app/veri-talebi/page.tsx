'use client';

import { useState } from 'react';
import Link from 'next/link';

const TALEP_TURLERI = [
  { value: 'ERISIM', label: 'Kişisel verilerimin işlenip işlenmediğini öğrenme (Erişim)' },
  { value: 'DUZELTME', label: 'Hatalı/eksik verilerimin düzeltilmesi' },
  { value: 'SILME', label: 'Kişisel verilerimin silinmesi / yok edilmesi' },
  { value: 'TASIMA', label: 'Verilerimin taşınabilir formatta iletilmesi (Portabilite)' },
  { value: 'KISITLAMA', label: 'Veri işlemenin kısıtlanması' },
  { value: 'ITIRAZ', label: 'Otomatik karar / profilleme işlemine itiraz' },
  { value: 'RIZA_GERI_CEKME', label: 'Açık rızamın geri alınması' },
  { value: 'DIGER', label: 'Diğer' },
];

interface FormData {
  adSoyad: string;
  tckn: string;
  email: string;
  telefon: string;
  talepTuru: string;
  aciklama: string;
}

export default function VeriTalebiPage() {
  const [form, setForm] = useState<FormData>({
    adSoyad: '',
    tckn: '',
    email: '',
    telefon: '',
    talepTuru: '',
    aciklama: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [refNo] = useState(() => `VT-${Date.now().toString(36).toUpperCase()}`);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const mailtoLink = () => {
    const talepLabel = TALEP_TURLERI.find((t) => t.value === form.talepTuru)?.label ?? form.talepTuru;
    const body = encodeURIComponent(
      `KVKK VERİ SAHİBİ BAŞVURUSU\nReferans: ${refNo}\n\nAd Soyad: ${form.adSoyad}\nTCKN: ${form.tckn}\nE-posta: ${form.email}\nTelefon: ${form.telefon || '-'}\nTalep Türü: ${talepLabel}\n\nAçıklama:\n${form.aciklama}`,
    );
    return `mailto:info@kiraguvence.com?subject=KVKK%20Veri%20Talebi%20-%20${refNo}&body=${body}`;
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-2xl px-6 py-6">
            <Link href="/kvkk" className="text-sm text-blue-600 hover:text-blue-700 font-medium">&larr; KVKK Aydınlatma Metni</Link>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-6 py-16 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Talebiniz Alındı</h1>
          <p className="text-slate-600 mb-1">Referans numaranız: <span className="font-mono font-semibold text-slate-900">{refNo}</span></p>
          <p className="text-sm text-slate-500 mb-8">
            Başvurunuz en geç <strong>30 gün</strong> içinde info@kiraguvence.com adresinden yanıtlanacaktır.
          </p>

          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-left text-sm text-slate-700 mb-6">
            <p className="font-semibold text-slate-900 mb-3">Başvuru Özeti</p>
            <dl className="space-y-1">
              <div className="flex gap-2"><dt className="w-28 shrink-0 font-medium text-slate-500">Ad Soyad</dt><dd>{form.adSoyad}</dd></div>
              <div className="flex gap-2"><dt className="w-28 shrink-0 font-medium text-slate-500">TCKN</dt><dd>{'*'.repeat(7) + form.tckn.slice(-4)}</dd></div>
              <div className="flex gap-2"><dt className="w-28 shrink-0 font-medium text-slate-500">E-posta</dt><dd>{form.email}</dd></div>
              <div className="flex gap-2"><dt className="w-28 shrink-0 font-medium text-slate-500">Talep Türü</dt><dd>{TALEP_TURLERI.find((t) => t.value === form.talepTuru)?.label}</dd></div>
            </dl>
          </div>

          <a
            href={mailtoLink()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            E-posta ile de gönder
          </a>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-2xl px-6 py-6">
          <Link href="/kvkk" className="text-sm text-blue-600 hover:text-blue-700 font-medium">&larr; KVKK Aydınlatma Metni</Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Veri Sahibi Başvuru Formu</h1>
        <p className="text-sm text-slate-500 mb-8">
          KVKK Madde 11 kapsamındaki haklarınızı kullanmak için bu formu doldurun.
          Başvurular en geç <strong>30 gün</strong> içinde ücretsiz yanıtlanır.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Ad Soyad <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                name="adSoyad"
                value={form.adSoyad}
                onChange={handleChange}
                placeholder="Adınız ve soyadınız"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                required
                minLength={3}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                T.C. Kimlik No <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                name="tckn"
                value={form.tckn}
                onChange={(e) => setForm((p) => ({ ...p, tckn: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                placeholder="11 haneli TCKN"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                maxLength={11}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                E-posta <span className="text-rose-600">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="ornek@email.com"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Telefon (isteğe bağlı)</label>
              <div className="flex items-center">
                <span className="rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 px-3 py-3 text-sm font-semibold text-slate-500">+90</span>
                <input
                  type="text"
                  name="telefon"
                  value={form.telefon}
                  onChange={(e) => setForm((p) => ({ ...p, telefon: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="5XX XXX XX XX"
                  className="w-full rounded-r-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Talep Türü <span className="text-rose-600">*</span>
              </label>
              <select
                name="talepTuru"
                value={form.talepTuru}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                required
              >
                <option value="">Talep türünü seçin...</option>
                {TALEP_TURLERI.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Açıklama <span className="text-rose-600">*</span>
              </label>
              <textarea
                name="aciklama"
                value={form.aciklama}
                onChange={handleChange}
                placeholder="Talebinizi kısaca açıklayın..."
                rows={4}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 resize-none"
                required
                minLength={10}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Başvurunuz kimlik doğrulaması amacıyla TCKN&apos;niz ile eşleştirilerek işlenecektir.
            Bilgileriniz yalnızca talebinizin yanıtlanması amacıyla kullanılır.
          </div>

          <button
            type="submit"
            disabled={!form.adSoyad || form.tckn.length !== 11 || !form.email || !form.talepTuru || form.aciklama.length < 10}
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Başvuruyu Gönder
          </button>
        </form>
      </main>
    </div>
  );
}

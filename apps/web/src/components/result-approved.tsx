import Link from 'next/link';

interface ApplicationResult {
  applicationId: string;
  status: string;
  maskedTckn: string;
  creditLimit?: number;
  interestRate?: number;
  rejectionReason?: string;
  createdAt: string;
}

export function ResultApproved({
  application,
}: {
  application: ApplicationResult;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-[0_20px_55px_-30px_rgba(15,23,42,0.4)] sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Onaylandı
            </p>
            <h1 className="mt-4 text-3xl font-extrabold text-slate-900">Başvuru sonucu olumlu</h1>
            <p className="mt-2 text-sm text-slate-600">TCKN: {application.maskedTckn}</p>
          </div>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <DataCard
            label="Kredi Limiti"
            value={`${application.creditLimit?.toLocaleString('tr-TR')} TL`}
            tone="success"
          />
          <DataCard
            label="Yıllık Faiz"
            value={`%${application.interestRate?.toFixed(2)}`}
          />
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
          Başvuru No: {application.applicationId.slice(0, 8)}...
        </div>

        <Link
          href="/"
          className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Yeni Başvuru Başlat
        </Link>
      </div>
    </main>
  );
}

function DataCard({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' }) {
  return (
    <div className={`rounded-xl border p-4 ${tone === 'success' ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 bg-slate-50'}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

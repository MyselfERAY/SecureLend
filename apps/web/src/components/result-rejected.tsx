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

export function ResultRejected({
  application,
}: {
  application: ApplicationResult;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-[0_20px_55px_-30px_rgba(15,23,42,0.4)] sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">
              Reddedildi
            </p>
            <h1 className="mt-4 text-3xl font-extrabold text-slate-900">Basvuru sonucu olumsuz</h1>
            <p className="mt-2 text-sm text-slate-600">TCKN: {application.maskedTckn}</p>
          </div>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-rose-600">Red Nedeni</p>
          <p className="mt-2 text-base font-semibold text-rose-800">
            {application.rejectionReason || 'Kredi skoru yetersiz'}
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
          Basvuru No: {application.applicationId.slice(0, 8)}...
        </div>

        <Link
          href="/"
          className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Tekrar Dene
        </Link>
      </div>
    </main>
  );
}

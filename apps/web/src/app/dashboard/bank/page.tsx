'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';

interface KmhApplication {
  id: string;
  employmentStatus: string;
  monthlyIncome: number;
  employerName: string | null;
  residentialAddress: string;
  estimatedRent: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedLimit: number | null;
  rejectionReason: string | null;
  bankReferenceNo: string | null;
  onboardingCompleted: boolean;
  bankAccount: {
    id: string;
    accountNumber: string;
    creditLimit: number | null;
    balance: number;
    status: string;
  } | null;
  createdAt: string;
}

interface BankAccount {
  accountId: string;
  accountNumber: string;
  balance: number;
  availableBalance: number;
  creditLimit?: number;
  currency: string;
  contractId?: string;
  propertyTitle?: string;
}

interface Transaction {
  id: string;
  amount: number;
  description: string | null;
  referenceNo: string;
  status: string;
  direction: string;
  processedAt: string | null;
  createdAt: string;
}

type ActiveTab = 'kmh' | 'accounts';

const employmentLabels: Record<string, string> = {
  EMPLOYED: 'Ücretli Çalışan',
  SELF_EMPLOYED: 'Serbest Meslek',
  RETIRED: 'Emekli',
  STUDENT: 'Öğrenci',
  UNEMPLOYED: 'Çalışmayan',
};

export default function BankPage() {
  const { tokens } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('kmh');
  const [loading, setLoading] = useState(true);

  const [applications, setApplications] = useState<KmhApplication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formEmployment, setFormEmployment] = useState('');
  const [formIncome, setFormIncome] = useState('');
  const [formEmployer, setFormEmployer] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formRent, setFormRent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadApplications = async () => {
    if (!tokens?.accessToken) return;
    try {
      const res = await api<KmhApplication[]>('/api/v1/bank/kmh/my-applications', { token: tokens.accessToken });
      if (res.status === 'success' && res.data) setApplications(res.data);
    } catch {
      // ignore
    }
  };

  const loadAccounts = async () => {
    if (!tokens?.accessToken) return;
    try {
      const res = await api<BankAccount[]>('/api/v1/bank/accounts', { token: tokens.accessToken });
      if (res.status === 'success' && res.data) setAccounts(res.data);
    } catch {
      // ignore
    }
  };

  const loadTransactions = async (accountId: string) => {
    if (!tokens?.accessToken) return;
    setSelectedAccount(accountId);
    try {
      const res = await api<Transaction[]>(`/api/v1/bank/accounts/${accountId}/transactions`, { token: tokens.accessToken });
      if (res.status === 'success' && res.data) setTransactions(res.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    Promise.all([loadApplications(), loadAccounts()]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.accessToken]);

  const handleApplyKmh = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    setSubmitting(true);
    try {
      const res = await api<any>('/api/v1/bank/kmh/apply', {
        method: 'POST',
        body: {
          employmentStatus: formEmployment,
          monthlyIncome: Number(formIncome),
          employerName: formEmployer || undefined,
          residentialAddress: formAddress,
          estimatedRent: Number(formRent),
        },
        token: tokens!.accessToken,
      });
      if (res.status === 'success' && res.data) {
        if (res.data.status === 'APPROVED') {
          setFormSuccess(`Banka güvence başvurunuz ONAYLANDI! Limit: ${Number(res.data.approvedLimit).toLocaleString('tr-TR')} TL. Digital onboarding işleminizi tamamlayın.`);
        } else {
          setFormError(`Başvurunuz reddedildi: ${res.data.rejectionReason}`);
        }
        setShowForm(false);
        setFormEmployment(''); setFormIncome(''); setFormEmployer(''); setFormAddress(''); setFormRent('');
        await loadApplications();
      } else {
        setFormError((res as any).data?.validation?.[0] || (res as any).data?.message || res.message || 'Hata oluştu');
      }
    } catch (err: any) { setFormError(err.message); }
    finally { setSubmitting(false); }
  };

  // Digital onboarding is only available on mobile app

  const pendingOnboarding = applications.find(
    (a) => a.status === 'APPROVED' && !a.onboardingCompleted,
  );

  const canApply = !applications.some(
    (a) => (a.status === 'PENDING') || (a.status === 'APPROVED' && !a.onboardingCompleted),
  );

  const inputCls = 'w-full rounded-lg border border-slate-600 bg-[#0a1628] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
  const labelCls = 'mb-1.5 block text-sm font-medium text-slate-300';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Banka</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-700/50 bg-[#0a1628] p-1">
        {[
          { key: 'kmh' as ActiveTab, label: 'Banka Güvencesi' },
          { key: 'accounts' as ActiveTab, label: 'Hesaplar & İşlemler' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {formError && (
        <div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          <span>{formError}</span>
          <button onClick={() => setFormError('')} className="ml-2 font-bold text-red-400/60 hover:text-red-400">X</button>
        </div>
      )}
      {formSuccess && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
          <span>{formSuccess}</span>
          <button onClick={() => setFormSuccess('')} className="ml-2 font-bold text-emerald-400/60 hover:text-emerald-400">X</button>
        </div>
      )}

      {/* KMH Tab */}
      {activeTab === 'kmh' && (
        <>
          {pendingOnboarding && (
            <div className="rounded-xl border-2 border-yellow-500/30 bg-yellow-500/10 p-6">
              <h3 className="mb-2 text-lg font-bold text-yellow-400">Digital Onboarding Bekliyor</h3>
              <p className="mb-3 text-sm text-yellow-300/80">
                Banka güvence başvurunuz onaylandı. Limit: <strong>{Number(pendingOnboarding.approvedLimit).toLocaleString('tr-TR')} TL</strong>.
                Hesabınızı aktif hale getirmek için digital onboarding işleminizi tamamlayın.
              </p>
              <p className="mb-4 text-xs text-yellow-400/60">Referans: {pendingOnboarding.bankReferenceNo}</p>
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                <div className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-blue-300">Mobil Uygulama Gerekli</p>
                    <p className="mt-1 text-sm text-blue-300/80">
                      Digital onboarding işlemi (kimlik doğrulama, selfie, video doğrulama) yalnızca mobil uygulama üzerinden tamamlanabilir.
                      Lütfen Kira Güvence mobil uygulamasını indirip onboarding işleminizi oradan tamamlayın.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {canApply && !showForm && (
            <div className="flex justify-end">
              <button onClick={() => setShowForm(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                Yeni Güvence Başvurusu
              </button>
            </div>
          )}

          {showForm && (
            <form onSubmit={handleApplyKmh} className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Banka Güvence Hesabı Başvurusu</h3>
              <p className="text-sm text-slate-400">
                Banka Güvence Hesabı (KMH) başvurusu için aşağıdaki bilgileri doldurun.
              </p>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
                <strong className="text-amber-200">KVKK Bilgilendirmesi:</strong> Kayıt sırasında
                verdiğiniz açık rıza kapsamında; gelir belgesi, istihdam bilgisi ve kredi geçmişi
                bu başvuru için işlenecek ve anlaşmalı bankalar ile KKB ile paylaşılacaktır.{' '}
                <Link href="/acik-riza" target="_blank" className="underline text-amber-200 hover:text-amber-100">
                  Açık Rıza Formu
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Çalışma Durumu *</label>
                  <select value={formEmployment} onChange={(e) => setFormEmployment(e.target.value)} className={inputCls} required>
                    <option value="">Seçin...</option>
                    <option value="EMPLOYED">Ücretli Çalışan</option>
                    <option value="SELF_EMPLOYED">Serbest Meslek</option>
                    <option value="RETIRED">Emekli</option>
                    <option value="STUDENT">Öğrenci</option>
                    <option value="UNEMPLOYED">Çalışmayan</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Aylık Gelir (TL) *</label>
                  <input type="number" value={formIncome} onChange={(e) => setFormIncome(e.target.value)} placeholder="ornegin: 30000" className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>İşveren Adı</label>
                  <input type="text" value={formEmployer} onChange={(e) => setFormEmployer(e.target.value)} placeholder="Opsiyonel" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Tahmini Kira Bedeli (TL) *</label>
                  <input type="number" value={formRent} onChange={(e) => setFormRent(e.target.value)} placeholder="ornegin: 15000" className={inputCls} required />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>İkamet Adresi *</label>
                  <input type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Tam adresinizi girin" className={inputCls} required />
                </div>
              </div>

              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-300">
                <div className="mb-1 font-medium text-blue-400">Onay Kriterleri</div>
                <ul className="list-inside list-disc space-y-0.5 text-xs text-blue-300/80">
                  <li>Aylık geliriniz tahmini kira bedelinin en az 2 katı olmalıdır</li>
                  <li>Onaylanırsa limit: gelirinizin 3 katı (max 500.000 TL)</li>
                  <li>Onay sonrası digital onboarding ile hesabınız açılır</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                  {submitting ? 'Başvuru yapılıyor...' : 'Başvur'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-600 px-6 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700/50">
                  İptal
                </button>
              </div>
            </form>
          )}

          {/* Application History */}
          {applications.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-white">Başvuru Geçmişi</h3>
              {applications.map((app) => (
                <div key={app.id} className={`rounded-xl border-2 p-5 ${
                  app.status === 'APPROVED' && app.onboardingCompleted ? 'border-emerald-500/30 bg-[#0d1b2a]' :
                  app.status === 'APPROVED' ? 'border-yellow-500/30 bg-[#0d1b2a]' :
                  app.status === 'REJECTED' ? 'border-red-500/30 bg-[#0d1b2a]' : 'border-slate-700/50 bg-[#0d1b2a]'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          app.status === 'APPROVED' && app.onboardingCompleted ? 'bg-emerald-500/20 text-emerald-400' :
                          app.status === 'APPROVED' ? 'bg-yellow-500/20 text-yellow-400' :
                          app.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {app.status === 'APPROVED' && app.onboardingCompleted ? 'AKTIF' :
                           app.status === 'APPROVED' ? 'ONAY - Onboarding Bekliyor' :
                           app.status === 'REJECTED' ? 'REDDEDILDI' : 'BEKLEMEDE'}
                        </span>
                        {app.bankReferenceNo && (
                          <span className="text-xs text-slate-500">Ref: {app.bankReferenceNo}</span>
                        )}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-400">
                        <div><span className="text-slate-500">Çalışma:</span> {employmentLabels[app.employmentStatus] || app.employmentStatus}</div>
                        <div><span className="text-slate-500">Gelir:</span> {app.monthlyIncome.toLocaleString('tr-TR')} TL</div>
                        <div><span className="text-slate-500">Tahmini Kira:</span> {app.estimatedRent.toLocaleString('tr-TR')} TL</div>
                        {app.employerName && <div><span className="text-slate-500">İşveren:</span> {app.employerName}</div>}
                      </div>
                      {app.rejectionReason && (
                        <div className="mt-1 text-sm text-red-400">Sebep: {app.rejectionReason}</div>
                      )}
                    </div>
                    <div className="text-right">
                      {app.approvedLimit != null && (
                        <div>
                          <div className="text-xs text-slate-500">Onaylanan Limit</div>
                          <div className="text-xl font-bold text-emerald-400">{app.approvedLimit.toLocaleString('tr-TR')} TL</div>
                        </div>
                      )}
                      {app.bankAccount && (
                        <div className="mt-2">
                          <div className="text-xs text-slate-500">Güvence Hesabı</div>
                          <div className="font-mono text-xs text-blue-400">{app.bankAccount.accountNumber}</div>
                        </div>
                      )}
                      <div className="mt-2 text-xs text-slate-600">{new Date(app.createdAt).toLocaleDateString('tr-TR')}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {applications.length === 0 && !showForm && (
            <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-700/50">
                <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="text-lg font-medium text-slate-300">Henüz banka güvence başvurunuz yok</div>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Banka güvencesi ile kira ödemeleriniz garanti altında. Kefil gerekmiyor, banka sizin yerinize güvence veriyor.
              </p>
            </div>
          )}
        </>
      )}

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <>
          {accounts.length === 0 ? (
            <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-700/50">
                <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="text-lg font-medium text-slate-300">Henüz banka hesabınız yok</div>
              <p className="mt-2 text-sm text-slate-500">
                Güvence başvurunuz onaylanıp dijital onboarding tamamlandığında hesabınız burada aktif olacak. Tüm kira işlemleriniz tek ekranda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((acc) => (
                <div
                  key={acc.accountId}
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${
                    selectedAccount === acc.accountId
                      ? 'border-blue-500/50 bg-[#112240]'
                      : 'border-slate-700/50 bg-[#0d1b2a] hover:border-blue-500/30'
                  }`}
                  onClick={() => loadTransactions(acc.accountId)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      {acc.propertyTitle && <div className="mb-1 text-xs font-medium text-blue-400">{acc.propertyTitle}</div>}
                      <div className="font-mono text-sm text-slate-400">{acc.accountNumber}</div>
                      <div className="mt-2 text-2xl font-bold text-white">
                        {acc.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {acc.currency}
                      </div>
                    </div>
                    <div className="text-right">
                      {acc.creditLimit != null && (
                        <>
                          <div className="text-xs text-slate-500">Güvence Limiti</div>
                          <div className="font-semibold text-blue-400">{acc.creditLimit.toLocaleString('tr-TR')} {acc.currency}</div>
                          <div className="mt-1 text-xs text-slate-500">Kullanilabilir: {acc.availableBalance.toLocaleString('tr-TR')} {acc.currency}</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedAccount && transactions.length > 0 && (
            <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Hesap Hareketleri</h2>
              <div className="divide-y divide-slate-700/50">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium text-white">{t.description || 'Transfer'}</div>
                      <div className="text-xs text-slate-500">
                        Ref: {t.referenceNo.slice(0, 8)}... | {new Date(t.createdAt).toLocaleString('tr-TR')}
                      </div>
                    </div>
                    <div className={`font-semibold ${t.direction === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.direction === 'IN' ? '+' : '-'}{t.amount.toLocaleString('tr-TR')} TL
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedAccount && transactions.length === 0 && (
            <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] py-8 text-center">
              <div className="text-slate-500">Bu hesapta henüz işlem yok</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

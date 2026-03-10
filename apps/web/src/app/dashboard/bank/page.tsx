'use client';

import { useEffect, useState } from 'react';
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
  EMPLOYED: 'Ucretli Calisan',
  SELF_EMPLOYED: 'Serbest Meslek',
  RETIRED: 'Emekli',
  STUDENT: 'Ogrenci',
  UNEMPLOYED: 'Calismayan',
};

export default function BankPage() {
  const { tokens } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('kmh');
  const [loading, setLoading] = useState(true);

  // KMH state
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

  // Accounts state
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadApplications = async () => {
    if (!tokens?.accessToken) return;
    try {
      const res = await api<KmhApplication[]>('/api/v1/bank/kmh/my-applications', { token: tokens.accessToken });
      if (res.status === 'success' && res.data) setApplications(res.data);
    } catch {}
  };

  const loadAccounts = async () => {
    if (!tokens?.accessToken) return;
    try {
      const res = await api<BankAccount[]>('/api/v1/bank/accounts', { token: tokens.accessToken });
      if (res.status === 'success' && res.data) setAccounts(res.data);
    } catch {}
  };

  const loadTransactions = async (accountId: string) => {
    if (!tokens?.accessToken) return;
    setSelectedAccount(accountId);
    try {
      const res = await api<Transaction[]>(`/api/v1/bank/accounts/${accountId}/transactions`, { token: tokens.accessToken });
      if (res.status === 'success' && res.data) setTransactions(res.data);
    } catch {}
  };

  useEffect(() => {
    Promise.all([loadApplications(), loadAccounts()]).finally(() => setLoading(false));
  }, [tokens?.accessToken]);

  // KMH Basvurusu
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
          setFormSuccess(`KMH basvurunuz ONAYLANDI! Limit: ${Number(res.data.approvedLimit).toLocaleString('tr-TR')} TL. Digital onboarding isleminizi tamamlayin.`);
        } else {
          setFormError(`Basvurunuz reddedildi: ${res.data.rejectionReason}`);
        }
        setShowForm(false);
        setFormEmployment(''); setFormIncome(''); setFormEmployer(''); setFormAddress(''); setFormRent('');
        await loadApplications();
      } else {
        setFormError((res as any).data?.validation?.[0] || (res as any).data?.message || res.message || 'Hata olustu');
      }
    } catch (err: any) { setFormError(err.message); }
    finally { setSubmitting(false); }
  };

  // Digital Onboarding Tamamla
  const handleOnboarding = async (applicationId: string) => {
    setFormError(''); setFormSuccess('');
    try {
      const res = await api<any>(`/api/v1/bank/kmh/${applicationId}/complete-onboarding`, {
        method: 'POST',
        token: tokens!.accessToken,
      });
      if (res.status === 'success' && res.data) {
        setFormSuccess(`KMH hesabiniz acildi! IBAN: ${res.data.accountNumber}, Limit: ${Number(res.data.creditLimit).toLocaleString('tr-TR')} TL`);
        await Promise.all([loadApplications(), loadAccounts()]);
      } else {
        setFormError((res as any).data?.message || 'Onboarding hatasi');
      }
    } catch (err: any) { setFormError(err.message); }
  };

  // Active approved application (not yet onboarded)
  const pendingOnboarding = applications.find(
    (a) => a.status === 'APPROVED' && !a.onboardingCompleted,
  );

  // Check if user can apply (no pending/approved-not-onboarded applications)
  const canApply = !applications.some(
    (a) => (a.status === 'PENDING') || (a.status === 'APPROVED' && !a.onboardingCompleted),
  );

  if (loading) return <div className="text-center py-12 text-gray-500">Yukleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Banka</h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'kmh' as ActiveTab, label: 'KMH Basvurusu' },
          { key: 'accounts' as ActiveTab, label: 'Hesaplar & Islemler' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {formError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex justify-between items-center">
          <span>{formError}</span>
          <button onClick={() => setFormError('')} className="text-red-500 hover:text-red-700 ml-2">✕</button>
        </div>
      )}
      {formSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm flex justify-between items-center">
          <span>{formSuccess}</span>
          <button onClick={() => setFormSuccess('')} className="text-green-500 hover:text-green-700 ml-2">✕</button>
        </div>
      )}

      {/* ═══ KMH BASVURUSU TAB ═══ */}
      {activeTab === 'kmh' && (
        <>
          {/* Onboarding bekleyen basvuru */}
          {pendingOnboarding && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
              <h3 className="font-bold text-yellow-800 text-lg mb-2">Digital Onboarding Bekliyor</h3>
              <p className="text-yellow-700 text-sm mb-3">
                KMH basvurunuz onaylandi. Limit: <strong>{Number(pendingOnboarding.approvedLimit).toLocaleString('tr-TR')} TL</strong>.
                Hesabinizi aktif hale getirmek icin digital onboarding isleminizi tamamlayin.
              </p>
              <p className="text-xs text-yellow-600 mb-4">Referans: {pendingOnboarding.bankReferenceNo}</p>
              <button
                onClick={() => handleOnboarding(pendingOnboarding.id)}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
              >
                Digital Onboarding Tamamla
              </button>
            </div>
          )}

          {/* Basvuru Formu */}
          {canApply && !showForm && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Yeni KMH Basvurusu
              </button>
            </div>
          )}

          {showForm && (
            <form onSubmit={handleApplyKmh} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 text-lg">KMH Basvurusu</h3>
              <p className="text-sm text-gray-500">
                Kira Mevduat Hesabi (KMH) basvurusu icin asagidaki bilgileri doldurun.
                Banka, kredi degerlendirmesi yaparak size bir limit belirleyecektir.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calisma Durumu *</label>
                  <select value={formEmployment} onChange={(e) => setFormEmployment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required>
                    <option value="">Secin...</option>
                    <option value="EMPLOYED">Ucretli Calisan</option>
                    <option value="SELF_EMPLOYED">Serbest Meslek</option>
                    <option value="RETIRED">Emekli</option>
                    <option value="STUDENT">Ogrenci</option>
                    <option value="UNEMPLOYED">Calismayan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aylik Gelir (TL) *</label>
                  <input type="number" value={formIncome} onChange={(e) => setFormIncome(e.target.value)}
                    placeholder="ornegin: 30000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Isveren Adi</label>
                  <input type="text" value={formEmployer} onChange={(e) => setFormEmployer(e.target.value)}
                    placeholder="Opsiyonel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tahmini Kira Bedeli (TL) *</label>
                  <input type="number" value={formRent} onChange={(e) => setFormRent(e.target.value)}
                    placeholder="ornegin: 15000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ikamet Adresi *</label>
                  <input type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Tam adresinizi girin"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <div className="font-medium mb-1">Onay Kriterleri</div>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>Aylik geliriniz tahmini kira bedelinin en az 2 kati olmalidir</li>
                  <li>Onaylanirsa limit: gelirinizin 3 kati (max 500.000 TL)</li>
                  <li>Onay sonrasi digital onboarding ile hesabiniz acilir</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={submitting}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                  {submitting ? 'Basvuru yapiliyor...' : 'Basvur'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200">
                  Iptal
                </button>
              </div>
            </form>
          )}

          {/* Basvuru Gecmisi */}
          {applications.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Basvuru Gecmisi</h3>
              {applications.map((app) => (
                <div key={app.id} className={`bg-white rounded-xl border-2 p-5 ${
                  app.status === 'APPROVED' && app.onboardingCompleted ? 'border-green-300' :
                  app.status === 'APPROVED' ? 'border-yellow-300' :
                  app.status === 'REJECTED' ? 'border-red-200' : 'border-gray-200'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          app.status === 'APPROVED' && app.onboardingCompleted ? 'bg-green-100 text-green-700' :
                          app.status === 'APPROVED' ? 'bg-yellow-100 text-yellow-700' :
                          app.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {app.status === 'APPROVED' && app.onboardingCompleted ? 'AKTIF' :
                           app.status === 'APPROVED' ? 'ONAY - Onboarding Bekliyor' :
                           app.status === 'REJECTED' ? 'REDDEDILDI' : 'BEKLEMEDE'}
                        </span>
                        {app.bankReferenceNo && (
                          <span className="text-xs text-gray-400">Ref: {app.bankReferenceNo}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 grid grid-cols-2 gap-x-6 gap-y-1 mt-2">
                        <div><span className="text-gray-400">Calisma:</span> {employmentLabels[app.employmentStatus] || app.employmentStatus}</div>
                        <div><span className="text-gray-400">Gelir:</span> {app.monthlyIncome.toLocaleString('tr-TR')} TL</div>
                        <div><span className="text-gray-400">Tahmini Kira:</span> {app.estimatedRent.toLocaleString('tr-TR')} TL</div>
                        {app.employerName && <div><span className="text-gray-400">Isveren:</span> {app.employerName}</div>}
                      </div>
                      {app.rejectionReason && (
                        <div className="text-sm text-red-600 mt-1">Sebep: {app.rejectionReason}</div>
                      )}
                    </div>
                    <div className="text-right">
                      {app.approvedLimit != null && (
                        <div>
                          <div className="text-xs text-gray-500">Onaylanan Limit</div>
                          <div className="text-xl font-bold text-green-600">{app.approvedLimit.toLocaleString('tr-TR')} TL</div>
                        </div>
                      )}
                      {app.bankAccount && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-500">KMH Hesap</div>
                          <div className="text-xs font-mono text-blue-600">{app.bankAccount.accountNumber}</div>
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-2">{new Date(app.createdAt).toLocaleDateString('tr-TR')}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {applications.length === 0 && !showForm && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div className="text-4xl mb-3">🏦</div>
              <div className="text-gray-600 text-lg font-medium">Henuz KMH basvurunuz yok</div>
              <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
                Kira Mevduat Hesabi (KMH) ile sozlesme imzalayabilir ve kira odemelerinizi guvence altina alabilirsiniz.
              </p>
            </div>
          )}
        </>
      )}

      {/* ═══ HESAPLAR & ISLEMLER TAB ═══ */}
      {activeTab === 'accounts' && (
        <>
          {accounts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div className="text-4xl mb-3">💳</div>
              <div className="text-gray-600 text-lg font-medium">Henuz banka hesabiniz yok</div>
              <p className="text-gray-400 text-sm mt-2">
                KMH basvurusu yapip onboarding tamamladiktan sonra hesabiniz burada gorunecektir.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((acc) => (
                <div key={acc.accountId}
                  className={`bg-white rounded-xl border-2 p-5 cursor-pointer transition-all ${
                    selectedAccount === acc.accountId ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => loadTransactions(acc.accountId)}>
                  <div className="flex justify-between items-start">
                    <div>
                      {acc.propertyTitle && <div className="text-xs text-blue-600 font-medium mb-1">{acc.propertyTitle}</div>}
                      <div className="text-sm text-gray-500 font-mono">{acc.accountNumber}</div>
                      <div className="mt-2 text-2xl font-bold text-gray-900">
                        {acc.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {acc.currency}
                      </div>
                    </div>
                    <div className="text-right">
                      {acc.creditLimit != null && (
                        <>
                          <div className="text-xs text-gray-500">KMH Limiti</div>
                          <div className="font-semibold text-blue-600">{acc.creditLimit.toLocaleString('tr-TR')} {acc.currency}</div>
                          <div className="text-xs text-gray-400 mt-1">Kullanilabilir: {acc.availableBalance.toLocaleString('tr-TR')} {acc.currency}</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedAccount && transactions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Hesap Hareketleri</h2>
              <div className="divide-y">
                {transactions.map((t) => (
                  <div key={t.id} className="py-3 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">{t.description || 'Transfer'}</div>
                      <div className="text-xs text-gray-500">
                        Ref: {t.referenceNo.slice(0, 8)}... | {new Date(t.createdAt).toLocaleString('tr-TR')}
                      </div>
                    </div>
                    <div className={`font-semibold ${t.direction === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.direction === 'IN' ? '+' : '-'}{t.amount.toLocaleString('tr-TR')} TL
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedAccount && transactions.length === 0 && (
            <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
              <div className="text-gray-400">Bu hesapta henuz islem yok</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

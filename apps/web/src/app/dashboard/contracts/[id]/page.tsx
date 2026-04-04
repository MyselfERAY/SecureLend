'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';

interface KmhAccountOption {
  accountId: string;
  accountNumber: string;
  creditLimit: number;
  status: string;
  contractId?: string | null;
}

interface ContractDetail {
  id: string;
  status: string;
  monthlyRent: number;
  depositAmount?: number;
  startDate: string;
  endDate: string;
  paymentDayOfMonth: number;
  terms: string | null;
  landlordIban?: string;
  property: { id: string; title: string; city: string; district: string; addressLine1: string };
  tenant: { id: string; fullName: string; tcknMasked: string };
  landlord: { id: string; fullName: string; tcknMasked: string };
  signatures: { role: string; signedAt: string; signedByName: string }[];
  tenantKmhInfo?: {
    accountId: string;
    accountNumber: string;
    creditLimit: number;
    status: string;
  } | null;
  tenantKmhAccounts?: KmhAccountOption[];
}

interface PaymentItem {
  id: string;
  dueDate: string;
  amount: number;
  periodLabel: string;
  status: string;
  paidAt?: string;
}

const statusColors: Record<string, string> = {
  PENDING_SIGNATURES: 'bg-yellow-500/20 text-yellow-400',
  ACTIVE: 'bg-emerald-500/20 text-emerald-400',
  TERMINATED: 'bg-red-500/20 text-red-400',
  EXPIRED: 'bg-slate-500/20 text-slate-400',
};

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { tokens, user } = useAuth();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [terminating, setTerminating] = useState(false);
  const [showTerminate, setShowTerminate] = useState(false);
  const [terminateReason, setTerminateReason] = useState('');
  const [error, setError] = useState('');
  const [selectedKmhAccountId, setSelectedKmhAccountId] = useState<string>('');

  const contractId = params.id as string;

  useEffect(() => {
    if (!tokens?.accessToken || !contractId) return;

    Promise.all([
      api<ContractDetail>(`/api/v1/contracts/${contractId}`, { token: tokens.accessToken }),
      api<PaymentItem[]>(`/api/v1/contracts/${contractId}/payments`, { token: tokens.accessToken }),
    ]).then(([cRes, pRes]) => {
      if (cRes.status === 'success' && cRes.data) {
        setContract(cRes.data);
        const eligible = (cRes.data.tenantKmhAccounts ?? []).filter(
          (a: KmhAccountOption) => a.creditLimit >= cRes.data!.monthlyRent
        );
        if (eligible.length > 0 && !selectedKmhAccountId) {
          setSelectedKmhAccountId(eligible[0].accountId);
        }
      }
      if (pRes.status === 'success' && pRes.data) setPayments(pRes.data);
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.accessToken, contractId]);

  const handleSign = async () => {
    const amTenant = contract?.tenant.id === user?.id;
    if (amTenant && !selectedKmhAccountId) {
      setError('Lutfen sozlesme icin kullanilacak KMH hesabini secin');
      return;
    }
    setSigning(true);
    setError('');
    try {
      const body: Record<string, unknown> = {};
      if (amTenant && selectedKmhAccountId) {
        body.kmhAccountId = selectedKmhAccountId;
      }
      const res = await api<ContractDetail>(`/api/v1/contracts/${contractId}/sign`, {
        method: 'POST', body, token: tokens!.accessToken,
      });
      if (res.status === 'success' && res.data) {
        setContract(res.data);
        if (res.data.status === 'ACTIVE') {
          const pRes = await api<PaymentItem[]>(`/api/v1/contracts/${contractId}/payments`, {
            token: tokens!.accessToken,
          });
          if (pRes.status === 'success' && pRes.data) setPayments(pRes.data);
        }
      } else {
        setError((res as any).data?.message || res.message || 'Imzalama hatasi');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSigning(false);
    }
  };

  const handleTerminate = async () => {
    if (!terminateReason.trim()) { setError('Fesih sebebi giriniz'); return; }
    setTerminating(true);
    setError('');
    try {
      const res = await api<ContractDetail>(`/api/v1/contracts/${contractId}/terminate`, {
        method: 'POST', body: { reason: terminateReason }, token: tokens!.accessToken,
      });
      if (res.status === 'success' && res.data) {
        setContract(res.data);
        setShowTerminate(false);
        setTerminateReason('');
      } else {
        setError((res as any).data?.message || res.message || 'Fesih hatasi');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTerminating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          <span className="text-sm text-slate-400">Yukleniyor...</span>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="py-20 text-center">
        <div className="text-lg font-medium text-slate-300">Sozlesme bulunamadi</div>
        <button onClick={() => router.back()} className="mt-4 text-sm text-blue-400 hover:text-blue-300">&larr; Geri Don</button>
      </div>
    );
  }

  const isTenant = contract.tenant.id === user?.id;
  const mySignature = contract.signatures.find(
    (s) => (s.role === 'TENANT' && contract.tenant.id === user?.id) ||
           (s.role === 'LANDLORD' && contract.landlord.id === user?.id),
  );

  const kmhAccounts = contract.tenantKmhAccounts ?? [];
  const eligibleKmhAccounts = kmhAccounts.filter((a) => a.creditLimit >= contract.monthlyRent);
  const selectedKmh = kmhAccounts.find((a) => a.accountId === selectedKmhAccountId);
  const kmhOk = !isTenant || (selectedKmh != null && selectedKmh.creditLimit >= contract.monthlyRent);
  const canSign = contract.status === 'PENDING_SIGNATURES' && !mySignature && kmhOk;
  const canTerminate = contract.status === 'ACTIVE';

  const statusLabel: Record<string, string> = {
    PENDING_SIGNATURES: 'Imza Bekliyor',
    ACTIVE: 'Aktif',
    TERMINATED: 'Feshedildi',
    EXPIRED: 'Suresi Doldu',
    DRAFT: 'Taslak',
  };

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="text-sm text-blue-400 hover:text-blue-300">
        &larr; Geri
      </button>

      {/* Header */}
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-white">{contract.property.title}</h1>
            <p className="mt-1 text-sm text-slate-400">{contract.property.addressLine1}, {contract.property.district}, {contract.property.city}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusColors[contract.status] || 'bg-slate-500/20 text-slate-400'}`}>
            {statusLabel[contract.status] || contract.status}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <InfoField label="Aylik Kira" value={`${contract.monthlyRent.toLocaleString('tr-TR')} TL`} />
          {contract.depositAmount && <InfoField label="Depozito" value={`${contract.depositAmount.toLocaleString('tr-TR')} TL`} />}
          <InfoField label="Baslangic" value={contract.startDate} />
          <InfoField label="Bitis" value={contract.endDate} />
          <InfoField label="Odeme Gunu" value={`Her ayin ${contract.paymentDayOfMonth}. gunu`} />
          {contract.landlordIban && <InfoField label="Ev Sahibi IBAN" value={contract.landlordIban} />}
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Ev Sahibi</h3>
          <div className="font-semibold text-white">{contract.landlord.fullName}</div>
          <div className="text-sm text-slate-500">{contract.landlord.tcknMasked}</div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Kiraci</h3>
          <div className="font-semibold text-white">{contract.tenant.fullName}</div>
          <div className="text-sm text-slate-500">{contract.tenant.tcknMasked}</div>
        </div>
      </div>

      {/* KMH Account Selection */}
      {isTenant && contract.status === 'PENDING_SIGNATURES' && (
        <div className={`rounded-xl border p-5 ${
          kmhAccounts.length === 0
            ? 'border-red-500/30 bg-red-500/10'
            : eligibleKmhAccounts.length === 0
              ? 'border-yellow-500/30 bg-yellow-500/10'
              : 'border-slate-700/50 bg-[#0d1b2a]'
        }`}>
          <h3 className="text-sm font-semibold text-white mb-3">KMH Hesabi Secimi</h3>

          {kmhAccounts.length === 0 ? (
            <p className="text-sm text-red-400">
              Aktif KMH hesabiniz bulunamadi. Sozlesmeyi imzalayabilmek icin once Banka sayfasindan KMH basvurusu yapmaniz ve onay almaniz gerekiyor.
            </p>
          ) : (
            <div className="space-y-2">
              {kmhAccounts.map((acc) => {
                const isEligible = acc.creditLimit >= contract.monthlyRent;
                const isSelected = selectedKmhAccountId === acc.accountId;
                const isBound = acc.contractId && acc.contractId !== contract.id;
                return (
                  <label
                    key={acc.accountId}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : isEligible && !isBound
                          ? 'border-slate-700/50 hover:border-blue-500/30 hover:bg-blue-500/5'
                          : 'border-slate-700/50 bg-slate-800/30 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <input
                      type="radio"
                      name="kmhAccount"
                      value={acc.accountId}
                      checked={isSelected}
                      disabled={!isEligible || !!isBound}
                      onChange={() => setSelectedKmhAccountId(acc.accountId)}
                      className="accent-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium font-mono text-white">{acc.accountNumber}</div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        Limit: {acc.creditLimit.toLocaleString('tr-TR')} TL
                        {isBound && <span className="ml-2 text-yellow-400">(Baska sozlesmeye bagli)</span>}
                        {!isEligible && !isBound && (
                          <span className="ml-2 text-red-400">
                            (Yetersiz — Gereken: {contract.monthlyRent.toLocaleString('tr-TR')} TL)
                          </span>
                        )}
                      </div>
                    </div>
                    {isEligible && !isBound && (
                      <span className="text-sm text-emerald-400">&#10003;</span>
                    )}
                  </label>
                );
              })}
              {eligibleKmhAccounts.length === 0 && (
                <p className="mt-2 text-sm text-yellow-400">
                  Hicbir KMH hesabinizin limiti kira bedelini ({contract.monthlyRent.toLocaleString('tr-TR')} TL) karsilamiyor.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Signatures */}
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Imzalar</h2>
        <div className="space-y-3">
          {contract.signatures.length === 0 && (
            <p className="text-sm text-slate-500">Henuz imza yok</p>
          )}
          {contract.signatures.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
                &#10003;
              </div>
              <div>
                <div className="font-medium text-white">{s.signedByName} ({s.role === 'LANDLORD' ? 'Ev Sahibi' : 'Kiraci'})</div>
                <div className="text-xs text-slate-500">{new Date(s.signedAt).toLocaleString('tr-TR')}</div>
              </div>
            </div>
          ))}
        </div>

        {error && <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}

        {contract.status === 'PENDING_SIGNATURES' && !mySignature && (
          canSign ? (
            <button
              onClick={handleSign}
              disabled={signing}
              className="mt-4 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {signing ? 'Imzalaniyor...' : 'Sozlesmeyi Imzala'}
            </button>
          ) : isTenant && !kmhOk ? (
            <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
              <p className="text-sm font-medium text-yellow-400">
                {kmhAccounts.length === 0
                  ? 'Sozlesmeyi imzalayabilmek icin aktif bir KMH hesabiniz olmalidir.'
                  : eligibleKmhAccounts.length === 0
                    ? 'Mevcut KMH hesaplarinizin limiti kira bedelini karsilamiyor.'
                    : 'Lutfen yukaridaki listeden bir KMH hesabi secin.'}
              </p>
              {kmhAccounts.length === 0 && (
                <p className="mt-1 text-xs text-yellow-500/70">
                  Banka sayfasindan KMH basvurusu yapin ve dijital onboarding&apos;i tamamlayin.
                </p>
              )}
            </div>
          ) : null
        )}

        {canTerminate && !showTerminate && (
          <button
            onClick={() => setShowTerminate(true)}
            className="mt-4 ml-3 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            Sozlesmeyi Feshet
          </button>
        )}

        {showTerminate && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 space-y-3">
            <div className="font-medium text-red-400">Sozlesme Fesih</div>
            <p className="text-sm text-red-400/80">Bu islem geri alinamaz. Sozlesme feshedilecektir.</p>
            <textarea
              value={terminateReason}
              onChange={(e) => setTerminateReason(e.target.value)}
              placeholder="Fesih sebebi..."
              rows={2}
              className="w-full rounded-lg border border-red-500/30 bg-[#0a1628] px-3 py-2 text-sm text-white outline-none resize-none placeholder:text-slate-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleTerminate}
                disabled={terminating}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {terminating ? 'Feshediliyor...' : 'Feshet'}
              </button>
              <button
                onClick={() => { setShowTerminate(false); setTerminateReason(''); }}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700/50"
              >
                Iptal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Schedule */}
      {payments.length > 0 && (
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Odeme Takvimi</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 text-left text-slate-400">
                  <th className="pb-3 font-medium">Donem</th>
                  <th className="pb-3 font-medium">Vade</th>
                  <th className="pb-3 font-medium text-right">Tutar</th>
                  <th className="pb-3 font-medium text-right">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 font-medium text-white">{p.periodLabel}</td>
                    <td className="py-3 text-slate-400">{p.dueDate}</td>
                    <td className="py-3 text-right font-semibold text-white">{p.amount.toLocaleString('tr-TR')} TL</td>
                    <td className="py-3 text-right">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        p.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                        p.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {p.status === 'COMPLETED' ? 'Odendi' :
                         p.status === 'OVERDUE' ? 'Gecikti' : 'Bekliyor'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-0.5 font-semibold text-white">{value}</div>
    </div>
  );
}

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
        // Auto-select first eligible KMH account
        const eligible = (cRes.data.tenantKmhAccounts ?? []).filter(
          (a: KmhAccountOption) => a.creditLimit >= cRes.data!.monthlyRent
        );
        if (eligible.length > 0 && !selectedKmhAccountId) {
          setSelectedKmhAccountId(eligible[0].accountId);
        }
      }
      if (pRes.status === 'success' && pRes.data) setPayments(pRes.data);
    }).finally(() => setLoading(false));
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
        // Reload payments if contract just became active
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

  if (loading) return <div className="text-center py-12 text-gray-500">Yukleniyor...</div>;
  if (!contract) return <div className="text-center py-12 text-gray-500">Sozlesme bulunamadi</div>;

  const isTenant = contract.tenant.id === user?.id;
  const mySignature = contract.signatures.find(
    (s) => (s.role === 'TENANT' && contract.tenant.id === user?.id) ||
           (s.role === 'LANDLORD' && contract.landlord.id === user?.id),
  );

  // KMH hesapları (limit yeterli olanlar)
  const kmhAccounts = contract.tenantKmhAccounts ?? [];
  const eligibleKmhAccounts = kmhAccounts.filter((a) => a.creditLimit >= contract.monthlyRent);

  // Kiracı için KMH kontrolü: seçilen hesap uygun olmalı
  const selectedKmh = kmhAccounts.find((a) => a.accountId === selectedKmhAccountId);
  const kmhOk = !isTenant || (
    selectedKmh != null && selectedKmh.creditLimit >= contract.monthlyRent
  );
  const canSign = contract.status === 'PENDING_SIGNATURES' && !mySignature && kmhOk;
  const canTerminate = contract.status === 'ACTIVE';

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

  const statusColors: Record<string, string> = {
    PENDING_SIGNATURES: 'bg-yellow-100 text-yellow-800',
    ACTIVE: 'bg-green-100 text-green-800',
    TERMINATED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="text-sm text-blue-600 hover:text-blue-800">
        &larr; Geri
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{contract.property.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{contract.property.addressLine1}, {contract.property.district}, {contract.property.city}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[contract.status] || 'bg-gray-100 text-gray-700'}`}>
            {contract.status === 'PENDING_SIGNATURES' ? 'Imza Bekliyor' :
             contract.status === 'ACTIVE' ? 'Aktif' :
             contract.status === 'TERMINATED' ? 'Feshedildi' : contract.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <InfoField label="Aylik Kira" value={`${contract.monthlyRent.toLocaleString('tr-TR')} TL`} />
          {contract.depositAmount && <InfoField label="Depozito" value={`${contract.depositAmount.toLocaleString('tr-TR')} TL`} />}
          <InfoField label="Baslangic" value={contract.startDate} />
          <InfoField label="Bitis" value={contract.endDate} />
          <InfoField label="Odeme Gunu" value={`Her ayin ${contract.paymentDayOfMonth}. gunu`} />
          {contract.landlordIban && <InfoField label="Ev Sahibi IBAN" value={contract.landlordIban} />}
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Ev Sahibi</h3>
          <div className="font-semibold text-gray-900">{contract.landlord.fullName}</div>
          <div className="text-sm text-gray-500">{contract.landlord.tcknMasked}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Kiraci</h3>
          <div className="font-semibold text-gray-900">{contract.tenant.fullName}</div>
          <div className="text-sm text-gray-500">{contract.tenant.tcknMasked}</div>
        </div>
      </div>

      {/* KMH Hesap Secimi - Kiracı için */}
      {isTenant && contract.status === 'PENDING_SIGNATURES' && (
        <div className={`rounded-xl border p-5 ${
          kmhAccounts.length === 0
            ? 'bg-red-50 border-red-200'
            : eligibleKmhAccounts.length === 0
              ? 'bg-orange-50 border-orange-200'
              : 'bg-white border-gray-200'
        }`}>
          <h3 className="text-sm font-semibold mb-3 text-gray-900">
            KMH Hesabi Secimi
          </h3>

          {kmhAccounts.length === 0 ? (
            <p className="text-sm text-red-600">
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
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : isEligible && !isBound
                          ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                          : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <input
                      type="radio"
                      name="kmhAccount"
                      value={acc.accountId}
                      checked={isSelected}
                      disabled={!isEligible || !!isBound}
                      onChange={() => setSelectedKmhAccountId(acc.accountId)}
                      className="text-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 font-mono">
                        {acc.accountNumber}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Limit: {acc.creditLimit.toLocaleString('tr-TR')} TL
                        {isBound && <span className="ml-2 text-orange-600">(Baska sozlesmeye bagli)</span>}
                        {!isEligible && !isBound && (
                          <span className="ml-2 text-red-500">
                            (Yetersiz — Gereken: {contract.monthlyRent.toLocaleString('tr-TR')} TL)
                          </span>
                        )}
                      </div>
                    </div>
                    {isEligible && !isBound && (
                      <span className="text-green-500 text-sm">&#10003;</span>
                    )}
                  </label>
                );
              })}
              {eligibleKmhAccounts.length === 0 && (
                <p className="text-sm text-orange-600 mt-2">
                  Hicbir KMH hesabinizin limiti kira bedelini ({contract.monthlyRent.toLocaleString('tr-TR')} TL) karsilamiyor.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Signatures */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Imzalar</h2>
        <div className="space-y-3">
          {contract.signatures.length === 0 && (
            <p className="text-gray-500 text-sm">Henuz imza yok</p>
          )}
          {contract.signatures.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                &#10003;
              </div>
              <div>
                <div className="font-medium text-gray-900">{s.signedByName} ({s.role === 'LANDLORD' ? 'Ev Sahibi' : 'Kiraci'})</div>
                <div className="text-xs text-gray-500">{new Date(s.signedAt).toLocaleString('tr-TR')}</div>
              </div>
            </div>
          ))}
        </div>

        {error && <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>}

        {contract.status === 'PENDING_SIGNATURES' && !mySignature && (
          canSign ? (
            <button
              onClick={handleSign}
              disabled={signing}
              className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {signing ? 'Imzalaniyor...' : 'Sozlesmeyi Imzala'}
            </button>
          ) : isTenant && !kmhOk ? (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-700 font-medium">
                {kmhAccounts.length === 0
                  ? 'Sozlesmeyi imzalayabilmek icin aktif bir KMH hesabiniz olmalidir.'
                  : eligibleKmhAccounts.length === 0
                    ? 'Mevcut KMH hesaplarinizin limiti kira bedelini karsilamiyor.'
                    : 'Lutfen yukaridaki listeden bir KMH hesabi secin.'}
              </p>
              {kmhAccounts.length === 0 && (
                <p className="text-xs text-orange-500 mt-1">
                  Banka sayfasindan KMH basvurusu yapin ve dijital onboarding&apos;i tamamlayin.
                </p>
              )}
            </div>
          ) : null
        )}

        {canTerminate && !showTerminate && (
          <button
            onClick={() => setShowTerminate(true)}
            className="mt-4 ml-3 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
          >
            Sozlesmeyi Feshet
          </button>
        )}

        {showTerminate && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
            <div className="font-medium text-red-900">Sozlesme Fesih</div>
            <p className="text-sm text-red-700">Bu islem geri alinamaz. Sozlesme feshedilecektir.</p>
            <textarea
              value={terminateReason}
              onChange={(e) => setTerminateReason(e.target.value)}
              placeholder="Fesih sebebi..."
              rows={2}
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleTerminate}
                disabled={terminating}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {terminating ? 'Feshediliyor...' : 'Feshet'}
              </button>
              <button
                onClick={() => { setShowTerminate(false); setTerminateReason(''); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
              >
                Iptal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Schedule */}
      {payments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Odeme Takvimi</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Donem</th>
                  <th className="pb-2 font-medium">Vade</th>
                  <th className="pb-2 font-medium text-right">Tutar</th>
                  <th className="pb-2 font-medium text-right">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 font-medium text-gray-900">{p.periodLabel}</td>
                    <td className="py-2 text-gray-600">{p.dueDate}</td>
                    <td className="py-2 text-right font-semibold">{p.amount.toLocaleString('tr-TR')} TL</td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        p.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
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
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-semibold text-gray-900 mt-0.5">{value}</div>
    </div>
  );
}

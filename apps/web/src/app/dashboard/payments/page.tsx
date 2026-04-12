'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';

interface PaymentItem {
  id: string;
  contractId: string;
  propertyTitle: string;
  dueDate: string;
  amount: number;
  periodLabel: string;
  status: string;
  paidAt?: string;
}

const statusConfig: Record<string, { text: string; cls: string }> = {
  PENDING: { text: 'Bekliyor', cls: 'bg-yellow-500/20 text-yellow-400' },
  OVERDUE: { text: 'Gecikti', cls: 'bg-red-500/20 text-red-400' },
  COMPLETED: { text: 'Ödendi', cls: 'bg-emerald-500/20 text-emerald-400' },
};

export default function PaymentsPage() {
  const { tokens, user } = useAuth();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [confirmPayment, setConfirmPayment] = useState<PaymentItem | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadPayments = async () => {
    if (!tokens?.accessToken) return;
    try {
      const res = await api<PaymentItem[]>('/api/v1/payments/my', { token: tokens.accessToken });
      if (res.status === 'success' && res.data) {
        setPayments(res.data);
      } else {
        setError((res as any).data?.message || res.message || 'Ödemeler yüklenemedi');
      }
    } catch (err: any) {
      setError(err.message || 'Bağlantı hatası');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.accessToken]);

  const handleProcess = async (paymentId: string) => {
    setProcessing(paymentId);
    setConfirmPayment(null);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api(`/api/v1/payments/${paymentId}/process`, {
        method: 'POST', token: tokens!.accessToken,
      });
      if (res.status === 'success') {
        setSuccessMsg('Ödeme başarıyla gerçekleştirildi!');
        await loadPayments();
      } else {
        setError((res as any).data?.message || res.message || 'Ödeme işlemi başarısız');
      }
    } catch (err: any) {
      setError(err.message || 'Ödeme sırasında hata oluştu');
    }
    setProcessing(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          <span className="text-sm text-slate-400">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  const pending = payments.filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE');
  const completed = payments.filter((p) => p.status === 'COMPLETED');
  const isTenant = user?.roles.includes('TENANT');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Ödemelerim</h1>

      {/* Messages */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-2 font-bold text-red-400/60 hover:text-red-400">X</button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="ml-2 font-bold text-emerald-400/60 hover:text-emerald-400">X</button>
        </div>
      )}

      {/* Confirm modal */}
      {confirmPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Ödeme Onayı</h3>
            <div className="rounded-lg border border-slate-700/50 bg-[#0a1628] p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Mülk:</span>
                <span className="font-medium text-white">{confirmPayment.propertyTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dönem:</span>
                <span className="font-medium text-white">{confirmPayment.periodLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vade:</span>
                <span className="font-medium text-white">{confirmPayment.dueDate}</span>
              </div>
              <div className="flex justify-between border-t border-slate-700/50 pt-2 mt-2">
                <span className="font-medium text-slate-300">Tutar:</span>
                <span className="text-lg font-bold text-emerald-400">{confirmPayment.amount.toLocaleString('tr-TR')} TL</span>
              </div>
            </div>
            <p className="text-sm text-slate-400">Bu ödemeyi onaylıyor musunuz? İşlem banka güvence hesabınızdan gerçekleştirilecektir.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleProcess(confirmPayment.id)}
                disabled={processing === confirmPayment.id}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {processing === confirmPayment.id ? 'İşleniyor...' : 'Ödemeyi Onayla'}
              </button>
              <button
                onClick={() => setConfirmPayment(null)}
                className="rounded-lg border border-slate-600 px-4 py-2.5 font-medium text-slate-300 transition hover:bg-slate-700/50"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending payments */}
      {pending.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-white">Bekleyen Ödemeler</h2>
          <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] divide-y divide-slate-700/50">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium text-white">{p.propertyTitle}</div>
                  <div className="mt-0.5 text-sm text-slate-400">{p.periodLabel} &middot; Vade: {p.dueDate}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig[p.status]?.cls || ''}`}>
                    {statusConfig[p.status]?.text || p.status}
                  </span>
                  <span className="w-24 text-right font-semibold text-white">
                    {p.amount.toLocaleString('tr-TR')} TL
                  </span>
                  {isTenant && (
                    <button
                      onClick={() => setConfirmPayment(p)}
                      disabled={processing === p.id}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {processing === p.id ? '...' : 'Ode'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed payments */}
      {completed.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-white">Tamamlanan Ödemeler</h2>
          <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] divide-y divide-slate-700/50">
            {completed.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium text-white">{p.propertyTitle}</div>
                  <div className="mt-0.5 text-sm text-slate-400">{p.periodLabel}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                    Ödendi
                  </span>
                  <span className="font-semibold text-white">
                    {p.amount.toLocaleString('tr-TR')} TL
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {payments.length === 0 && (
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-700/50">
            <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-lg font-medium text-slate-300">Henüz ödemeniz yok</div>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Aktif sözleşmeniz olduğunda tüm kira ödemeleriniz burada otomatik takip edilir. Gecikme yok, unutma yok.</p>
        </div>
      )}
    </div>
  );
}

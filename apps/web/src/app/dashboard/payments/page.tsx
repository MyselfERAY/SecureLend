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
        setError((res as any).data?.message || res.message || 'Odemeler yuklenemedi');
      }
    } catch (err: any) {
      setError(err.message || 'Baglanti hatasi');
    }
    setLoading(false);
  };

  useEffect(() => { loadPayments(); }, [tokens?.accessToken]);

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
        setSuccessMsg('Odeme basariyla gerceklestirildi!');
        await loadPayments();
      } else {
        setError((res as any).data?.message || res.message || 'Odeme islemi basarisiz');
      }
    } catch (err: any) {
      setError(err.message || 'Odeme sirasinda hata olustu');
    }
    setProcessing(null);
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Yukleniyor...</div>;

  const pending = payments.filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE');
  const completed = payments.filter((p) => p.status === 'COMPLETED');

  const isTenant = user?.roles.includes('TENANT');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Odemelerim</h1>

      {/* Hata / Basari Mesajlari */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-2 font-bold">X</button>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-green-400 hover:text-green-600 ml-2 font-bold">X</button>
        </div>
      )}

      {/* Onay Dialogu */}
      {confirmPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg">Odeme Onayi</h3>
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Mulk:</span>
                <span className="font-medium text-gray-900">{confirmPayment.propertyTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Donem:</span>
                <span className="font-medium text-gray-900">{confirmPayment.periodLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vade:</span>
                <span className="font-medium text-gray-900">{confirmPayment.dueDate}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-gray-700 font-medium">Tutar:</span>
                <span className="font-bold text-lg text-green-700">{confirmPayment.amount.toLocaleString('tr-TR')} TL</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">Bu odemeyi onayliyor musunuz? Islem KMH hesabinizdan gerceklestirilecektir.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleProcess(confirmPayment.id)}
                disabled={processing === confirmPayment.id}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {processing === confirmPayment.id ? 'Isleniyor...' : 'Odemeyi Onayla'}
              </button>
              <button
                onClick={() => setConfirmPayment(null)}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
              >
                Iptal
              </button>
            </div>
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Bekleyen Odemeler</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y">
            {pending.map((p) => (
              <div key={p.id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900">{p.propertyTitle}</div>
                  <div className="text-sm text-gray-500">{p.periodLabel} — Vade: {p.dueDate}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    p.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {p.status === 'OVERDUE' ? 'Gecikti' : 'Bekliyor'}
                  </span>
                  <span className="font-semibold text-gray-900 w-24 text-right">
                    {p.amount.toLocaleString('tr-TR')} TL
                  </span>
                  {isTenant && (
                    <button
                      onClick={() => setConfirmPayment(p)}
                      disabled={processing === p.id}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
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

      {completed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Tamamlanan Odemeler</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y">
            {completed.map((p) => (
              <div key={p.id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900">{p.propertyTitle}</div>
                  <div className="text-sm text-gray-500">{p.periodLabel}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                    Odendi
                  </span>
                  <span className="font-semibold text-gray-900">
                    {p.amount.toLocaleString('tr-TR')} TL
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {payments.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-gray-400 text-lg">Henuz odemeniz yok</div>
          <p className="text-gray-500 text-sm mt-2">Aktif sozlesmeniz oldugunda odemeler burada gorunecektir.</p>
        </div>
      )}
    </div>
  );
}

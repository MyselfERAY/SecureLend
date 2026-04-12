'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';

interface TenantScoreData {
  userId: string;
  overallScore: number;
  timelinessScore: number;
  regularityScore: number;
  amountAccuracyScore: number;
  totalEligiblePayments: number;
  completedPayments: number;
  onTimePayments: number;
  latePayments: number;
  partialPayments: number;
  overduePayments: number;
  isReliableTenant: boolean;
  depositDiscountPercent: number;
  hasEnoughData: boolean;
  lastCalculatedAt: string;
}

function ScoreGauge({ score, max, label, color }: { score: number; max: number; label: string; color: string }) {
  const pct = Math.round((score / max) * 100);
  const colorMap: Record<string, { bar: string; text: string }> = {
    blue: { bar: 'bg-blue-500', text: 'text-blue-400' },
    emerald: { bar: 'bg-emerald-500', text: 'text-emerald-400' },
    violet: { bar: 'bg-violet-500', text: 'text-violet-400' },
    amber: { bar: 'bg-amber-500', text: 'text-amber-400' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className={`font-semibold ${c.text}`}>{score.toFixed(1)} / {max}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-700/60">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${c.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 90) return (
    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-400">
      Mükemmel
    </span>
  );
  if (score >= 80) return (
    <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-400">
      Çok İyi
    </span>
  );
  if (score >= 70) return (
    <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-violet-400">
      İyi
    </span>
  );
  if (score >= 50) return (
    <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-400">
      Orta
    </span>
  );
  return (
    <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-400">
      Geliştirilmeli
    </span>
  );
}

export default function TenantScorePage() {
  const { tokens, user } = useAuth();
  const [score, setScore] = useState<TenantScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tokens?.accessToken) return;
    api<TenantScoreData>('/api/v1/tenant-score/me', { token: tokens.accessToken })
      .then((res) => {
        if (res.status === 'success' && res.data) {
          setScore(res.data);
        } else {
          setError((res as any).data?.message || res.message || 'Skor yuklenemedi');
        }
      })
      .catch((err: any) => setError(err.message || 'Bağlantı hatası'))
      .finally(() => setLoading(false));
  }, [tokens?.accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          <span className="text-sm text-slate-400">Skor hesaplaniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (!score) return null;

  const scoreColor =
    score.overallScore >= 90 ? 'text-emerald-400' :
    score.overallScore >= 80 ? 'text-blue-400' :
    score.overallScore >= 70 ? 'text-violet-400' :
    score.overallScore >= 50 ? 'text-yellow-400' :
    'text-red-400';

  const ringColor =
    score.overallScore >= 90 ? 'border-emerald-500/60' :
    score.overallScore >= 80 ? 'border-blue-500/60' :
    score.overallScore >= 70 ? 'border-violet-500/60' :
    score.overallScore >= 50 ? 'border-yellow-500/60' :
    'border-red-500/60';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Ödeme Güvenilirlik Skorum</h1>

      {/* Ana Skor Kartı */}
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-8">

          {/* Dairesel skor göstergesi */}
          <div className={`flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-full border-4 ${ringColor} bg-[#0a1628]`}>
            <span className={`text-4xl font-extrabold leading-none ${scoreColor}`}>
              {score.hasEnoughData ? score.overallScore.toFixed(0) : '—'}
            </span>
            <span className="mt-1 text-xs text-slate-500">/ 100</span>
          </div>

          {/* Sağ: etiketler ve açıklama */}
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {score.hasEnoughData && <ScoreBadge score={score.overallScore} />}
              {score.isReliableTenant && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Güvenilir Kiracı
                </span>
              )}
            </div>

            {score.hasEnoughData ? (
              <>
                <p className="text-sm text-slate-400">
                  {score.completedPayments} tamamlanan ödemeden elde edilen skor.
                  Son güncelleme: {new Date(score.lastCalculatedAt).toLocaleDateString('tr-TR')}.
                </p>
                {score.depositDiscountPercent > 0 && (
                  <div className="inline-flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-300">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>
                      Güçlü ödeme geçmişiniz sayesinde yeni sözleşmelerde
                      {' '}<strong>%{score.depositDiscountPercent} depozito indirimi</strong> talep edebilirsiniz.
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-400">
                Skor hesaplanabilmesi için en az bir tamamlanan ödeme gerekmektedir.
                İlk kiranızı ödedikten sonra güvenilirlik skorunuz burada görünecektir.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Alt Skor Kırılımı */}
      {score.hasEnoughData && (
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 space-y-5">
          <h2 className="text-base font-semibold text-white">Skor Kırılımı</h2>
          <ScoreGauge
            score={score.timelinessScore}
            max={40}
            label="Zamanindelik — Vade tarihinde ödeme oranı"
            color="emerald"
          />
          <ScoreGauge
            score={score.regularityScore}
            max={40}
            label="Düzenlilik — Gecikme ve başarısız ödeme oranı"
            color="blue"
          />
          <ScoreGauge
            score={score.amountAccuracyScore}
            max={20}
            label="Tutar Doğruluğu — Tam tutar ödeme oranı"
            color="violet"
          />
        </div>
      )}

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatMini label="Toplam" value={score.totalEligiblePayments} color="slate" />
        <StatMini label="Tamamlanan" value={score.completedPayments} color="emerald" />
        <StatMini label="Zamanında" value={score.onTimePayments} color="blue" />
        <StatMini label="Gecikmeli" value={score.latePayments} color="yellow" />
        <StatMini label="Kısmi" value={score.partialPayments} color="amber" />
        <StatMini label="Vadesi Geçmiş" value={score.overduePayments} color="red" />
      </div>

      {/* Ev Sahibi Bilgi Kutusu */}
      {user?.roles.includes('LANDLORD') && (
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 space-y-2">
          <h2 className="text-sm font-semibold text-slate-300">Ev Sahipleri İçin</h2>
          <p className="text-sm text-slate-400">
            Kiracılarınızın ödeme güvenilirlik skorunu görüntülemek için
            sözleşme detay sayfasını kullanabilirsiniz. Skor ≥ 80 olan kiracılar
            <strong className="text-white"> Güvenilir Kiracı</strong> etiketiyle gösterilir.
          </p>
        </div>
      )}

      {/* Açıklama: Skor Nasıl Hesaplanır? */}
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">Skor Nasıl Hesaplanır?</h2>
        <div className="space-y-2 text-sm text-slate-400">
          <div className="flex justify-between">
            <span>Zamanindelik (vade tarihine uyum)</span>
            <span className="font-medium text-slate-300">40 puan</span>
          </div>
          <div className="flex justify-between">
            <span>Düzenlilik (gecikme / başarısız ödeme yok)</span>
            <span className="font-medium text-slate-300">40 puan</span>
          </div>
          <div className="flex justify-between">
            <span>Tutar doğruluğu (tam tutar ödeme)</span>
            <span className="font-medium text-slate-300">20 puan</span>
          </div>
          <div className="mt-3 rounded-lg bg-slate-800/60 p-3 text-xs text-slate-500">
            Skor ≥ 80: Güvenilir Kiracı etiketi &amp; depozito indirimi hakkı.
            Skor ≥ 90: %30 &bull; ≥ 80: %20 &bull; ≥ 70: %10 depozito indirimi.
          </div>
        </div>
      </div>
    </div>
  );
}

function StatMini({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    slate:   { bg: 'bg-slate-500/10',   text: 'text-slate-300' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-400' },
    yellow:  { bg: 'bg-yellow-500/10',  text: 'text-yellow-400' },
    amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400' },
    red:     { bg: 'bg-red-500/10',     text: 'text-red-400' },
  };
  const c = colorMap[color] || colorMap.slate;

  return (
    <div className={`rounded-xl border border-slate-700/50 ${c.bg} p-4 text-center`}>
      <div className={`text-2xl font-bold ${c.text}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

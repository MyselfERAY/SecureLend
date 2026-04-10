'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';

interface ReferralInfo {
  referralCode: string | null;
  referralLink: string | null;
  totalReferrals: number;
  referrals: {
    userName: string;
    joinedAt: string;
    promoName: string;
    discountPercent: number;
    durationMonths: number;
  }[];
}

export default function ReferralPage() {
  const { tokens } = useAuth();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  useEffect(() => {
    if (!tokens?.accessToken) return;
    (async () => {
      try {
        const res = await api<ReferralInfo>('/api/v1/promos/referral', {
          token: tokens.accessToken,
        });
        if (res.status === 'success' && res.data) setInfo(res.data);
      } catch {
        // ignore
      }
      setLoading(false);
    })();
  }, [tokens?.accessToken]);

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback
    }
  };

  const shareWhatsApp = () => {
    if (!info?.referralLink) return;
    const text = `KiraGuvence ile kira odemelerini guvence altina al! Davet linkimle kayit ol, ikimiz de 1 ay komisyonsuz kullanalim: ${info.referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareSMS = () => {
    if (!info?.referralLink) return;
    const text = `KiraGuvence'ye katil! Davet kodum: ${info.referralCode}. Kayit ol: ${info.referralLink}`;
    window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Arkadasini Getir</h1>
      <p className="text-sm text-slate-400">
        Davet kodunuzu paylasarak arkadaslarinizi KiraGuvence&apos;ye davet edin.
        Hem siz hem arkadasiniz 1 ay komisyonsuz kullanim kazanin!
      </p>

      {/* Referral Code & Link */}
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 space-y-5">
        <h2 className="text-lg font-semibold text-white">Davet Kodunuz</h2>

        {info?.referralCode ? (
          <>
            {/* Code */}
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-lg border border-slate-600 bg-[#0a1628] px-4 py-3">
                <span className="font-mono text-xl font-bold tracking-widest text-blue-400">
                  {info.referralCode}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(info.referralCode!, 'code')}
                className="shrink-0 rounded-lg border border-slate-600 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-700/50"
              >
                {copied === 'code' ? 'Kopyalandi!' : 'Kopyala'}
              </button>
            </div>

            {/* Link */}
            {info.referralLink && (
              <div className="flex items-center gap-3">
                <div className="flex-1 truncate rounded-lg border border-slate-600 bg-[#0a1628] px-4 py-3 text-sm text-slate-400">
                  {info.referralLink}
                </div>
                <button
                  onClick={() => copyToClipboard(info.referralLink!, 'link')}
                  className="shrink-0 rounded-lg border border-slate-600 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-700/50"
                >
                  {copied === 'link' ? 'Kopyalandi!' : 'Linki Kopyala'}
                </button>
              </div>
            )}

            {/* Share buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={shareWhatsApp}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp ile Paylas
              </button>
              <button
                onClick={shareSMS}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                SMS ile Paylas
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-400">
            Davet kodunuz henuz olusturulmamis. Lutfen destek ile iletisime gecin.
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Nasil Calisir?</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { step: '1', title: 'Kodunuzu Paylasin', desc: 'Davet kodunuzu veya linkinizi arkadaslarinizla paylasin.' },
            { step: '2', title: 'Arkadasiniz Kayit Olsun', desc: 'Arkadasiniz kayit sirasinda davet kodunuzu girsin.' },
            { step: '3', title: 'Birlikte Kazanin', desc: 'Hem siz hem arkadasiniz 1 ay komisyonsuz kullanim kazanin!' },
          ].map((item) => (
            <div key={item.step} className="rounded-lg border border-slate-700/30 bg-[#0a1628]/50 p-4 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/20 text-lg font-bold text-blue-400">
                {item.step}
              </div>
              <div className="mb-1 text-sm font-semibold text-white">{item.title}</div>
              <div className="text-xs text-slate-400">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 text-center">
          <div className="text-3xl font-bold text-blue-400">{info?.totalReferrals || 0}</div>
          <div className="mt-1 text-sm text-slate-400">Toplam Davet</div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 text-center">
          <div className="text-3xl font-bold text-emerald-400">{info?.totalReferrals || 0}</div>
          <div className="mt-1 text-sm text-slate-400">Kazanilan Ay</div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 text-center">
          <div className="text-3xl font-bold text-amber-400">%100</div>
          <div className="mt-1 text-sm text-slate-400">Komisyon Indirimi</div>
        </div>
      </div>

      {/* Referral history */}
      {info && info.referrals.length > 0 && (
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Davet Gecmisi</h2>
          <div className="space-y-3">
            {info.referrals.map((r, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-700/30 bg-[#0a1628]/50 p-4">
                <div>
                  <div className="text-sm font-medium text-white">{r.userName}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(r.joinedAt).toLocaleDateString('tr-TR')}
                  </div>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                    {r.durationMonths} ay %{r.discountPercent} indirim
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

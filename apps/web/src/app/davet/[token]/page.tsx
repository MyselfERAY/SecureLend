'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import Logo from '../../../components/logo';
import { api } from '../../../lib/api';

interface InviteData {
  fullName: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  expiresAt: string;
}

type PageState = 'loading' | 'valid' | 'invalid' | 'used' | 'expired';

export default function DavetPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [state, setState] = useState<PageState>('loading');
  const [invite, setInvite] = useState<InviteData | null>(null);

  useEffect(() => {
    if (!token) return;
    api<InviteData>(`/api/v1/auth/invite/${token}`)
      .then((res) => {
        if (res.status === 'success' && res.data) {
          setInvite(res.data);
          setState('valid');
        } else {
          const msg = res.message || '';
          if (msg.includes('kullanıldı')) setState('used');
          else if (msg.includes('süresi doldu')) setState('expired');
          else setState('invalid');
        }
      })
      .catch(() => setState('invalid'));
  }, [token]);

  const handleStart = () => {
    if (!invite) return;
    const qs = new URLSearchParams();
    if (invite.fullName) qs.set('fullName', invite.fullName);
    if (invite.phone) qs.set('phone', invite.phone);
    router.push(`/auth/register?${qs.toString()}`);
  };

  const firstName = invite?.fullName.split(' ')[0] ?? '';

  if (state === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </main>
    );
  }

  if (state !== 'valid' || !invite) {
    const isExpired = state === 'expired';
    const isUsed = state === 'used';
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="text-center max-w-sm">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-400" />
          <h1 className="text-xl font-bold text-white mb-2">
            {isUsed ? 'Bu link zaten kullanıldı' : isExpired ? 'Linkin süresi doldu' : 'Link bulunamadı'}
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            {isUsed
              ? 'Bu davet linki daha önce kullanılmış. Yeni link için platform ekibiyle iletişime geçin.'
              : isExpired
              ? 'Bu davet linkinin geçerlilik süresi sona erdi. Lütfen yeni bir link isteyin.'
              : 'Bu davet linki geçerli değil veya mevcut değil.'}
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition"
          >
            Kayıt Ol
          </Link>
        </div>
      </main>
    );
  }

  const expiryDate = new Date(invite.expiresAt).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <main className="min-h-screen px-4 py-10 bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="mx-auto max-w-lg">
        <Logo className="mb-8" />

        <div className="rounded-3xl border border-slate-700/50 bg-slate-900/80 p-8 sm:p-10 shadow-2xl">
          {/* Greeting */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400 mb-4">
              <CheckCircle className="h-3.5 w-3.5" />
              Kişisel Davetiyeniz
            </div>
            <h1 className="text-2xl font-extrabold text-white leading-snug">
              Sayın {firstName},
            </h1>
            <p className="mt-2 text-base text-slate-300 leading-relaxed">
              Kiranızı güvence altına almak için hazırlanan platform sizi bekliyor — tek tıkla başlayın.
            </p>
          </div>

          {/* Custom note */}
          {invite.note && (
            <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
              <p className="text-sm text-slate-300 leading-relaxed">{invite.note}</p>
            </div>
          )}

          {/* Benefits */}
          <div className="mb-8 space-y-2">
            {[
              'Hızlı kimlik doğrulaması ile güvenli kayıt',
              'Sözleşmeniz hazır — imzalamak için birkaç adım',
              'Kira ödemeleriniz güvence altında',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-slate-400">
                <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                {item}
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleStart}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-4 text-base font-semibold text-white hover:bg-blue-800 transition shadow-lg"
          >
            Hemen Başla
            <ArrowRight className="h-4 w-4" />
          </button>

          {/* Expiry notice */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            Bu davet {expiryDate} tarihine kadar geçerlidir.
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Zaten hesabınız var mı?{' '}
          <Link href="/auth/login" className="text-blue-500 hover:text-blue-400">Giriş Yap</Link>
        </p>
      </div>
    </main>
  );
}

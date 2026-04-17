'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';

interface ReminderPrefs {
  enabled: boolean;
  channelSms: boolean;
  channelEmail: boolean;
  remind7Days: boolean;
  remind3Days: boolean;
  remind1Day: boolean;
  overdueReminder: boolean;
}

const defaultPrefs: ReminderPrefs = {
  enabled: true,
  channelSms: false,
  channelEmail: true,
  remind7Days: true,
  remind3Days: true,
  remind1Day: true,
  overdueReminder: true,
};

export default function ProfilePage() {
  const { tokens, user, refreshUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [addingRole, setAddingRole] = useState(false);
  const [roleMsg, setRoleMsg] = useState('');

  const [kycLoading, setKycLoading] = useState(false);
  const [kycMsg, setKycMsg] = useState('');

  const [prefs, setPrefs] = useState<ReminderPrefs>(defaultPrefs);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (!tokens) return;
    api('/api/v1/users/reminder-preferences', { token: tokens.accessToken })
      .then((res) => {
        if (res.status === 'success') setPrefs(res.data as ReminderPrefs);
      })
      .catch(() => {});
  }, [tokens]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const body: Record<string, string> = {};
      if (fullName !== user?.fullName) body.fullName = fullName;
      if (email !== (user?.email || '')) body.email = email;

      if (Object.keys(body).length === 0) {
        setSaveMsg('Değişiklik yok.');
        setSaving(false);
        return;
      }

      const res = await api('/api/v1/users/me', {
        method: 'PATCH', body, token: tokens!.accessToken,
      });

      if (res.status === 'success') {
        setSaveMsg('Profil güncellendi.');
        setEditing(false);
        await refreshUser();
      } else {
        setSaveMsg((res as any).data?.message || 'Hata oluştu');
      }
    } catch (err: any) {
      setSaveMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = async (role: string) => {
    setAddingRole(true);
    setRoleMsg('');
    try {
      const res = await api('/api/v1/users/me/roles', {
        method: 'POST',
        body: { role },
        token: tokens!.accessToken,
      });

      if (res.status === 'success') {
        setRoleMsg(`${role === 'TENANT' ? 'Kiracı' : 'Ev Sahibi'} rolü eklendi.`);
        await refreshUser();
      } else {
        setRoleMsg((res as any).data?.message || 'Hata oluştu');
      }
    } catch (err: any) {
      setRoleMsg(err.message);
    } finally {
      setAddingRole(false);
    }
  };

  const handleSavePrefs = async () => {
    setPrefsSaving(true);
    setPrefsMsg('');
    try {
      const res = await api('/api/v1/users/reminder-preferences', {
        method: 'PUT',
        body: prefs as unknown as Record<string, unknown>,
        token: tokens!.accessToken,
      });
      if (res.status === 'success') {
        setPrefs(res.data as ReminderPrefs);
        setPrefsMsg('Tercihler kaydedildi.');
      } else {
        setPrefsMsg('Hata oluştu.');
      }
    } catch {
      setPrefsMsg('Hata oluştu.');
    } finally {
      setPrefsSaving(false);
    }
  };

  const handleKyc = async () => {
    setKycLoading(true);
    setKycMsg('');
    try {
      const res = await api('/api/v1/users/me/kyc', {
        method: 'POST',
        token: tokens!.accessToken,
      });

      if (res.status === 'success') {
        setKycMsg('KYC doğrulaması tamamlandı.');
        await refreshUser();
      } else {
        setKycMsg((res as any).data?.message || 'Hata oluştu');
      }
    } catch (err: any) {
      setKycMsg(err.message);
    } finally {
      setKycLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
      </div>
    );
  }

  const kycStatusLabel: Record<string, { text: string; cls: string }> = {
    PENDING: { text: 'Bekliyor', cls: 'bg-yellow-500/20 text-yellow-400' },
    VERIFIED: { text: 'Doğrulandı', cls: 'bg-emerald-500/20 text-emerald-400' },
    REJECTED: { text: 'Reddedildi', cls: 'bg-red-500/20 text-red-400' },
  };

  const roleLabel: Record<string, string> = {
    TENANT: 'Kiracı',
    LANDLORD: 'Ev Sahibi',
    ADMIN: 'Yönetici',
  };

  const inputCls = 'w-full rounded-lg border border-slate-600 bg-[#0a1628] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Profilim</h1>

      {/* Profile Info */}
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6">
        <div className="mb-6 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-white">Kişisel Bilgiler</h2>
          {!editing && (
            <button
              onClick={() => { setEditing(true); setSaveMsg(''); }}
              className="rounded-lg bg-blue-600/20 px-3 py-1.5 text-xs font-medium text-blue-400 transition hover:bg-blue-600/30"
            >
              Düzenle
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Ad Soyad</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">E-posta</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@email.com" className={inputCls} />
            </div>
            {saveMsg && (
              <div className={`rounded-lg p-2 text-sm ${saveMsg.includes('güncellendi') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {saveMsg}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleSaveProfile} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button onClick={() => { setEditing(false); setFullName(user.fullName); setEmail(user.email || ''); }} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700/50">
                İptal
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <InfoRow label="Ad Soyad" value={user.fullName} />
            <InfoRow label="Telefon" value={user.phone} />
            <InfoRow label="TCKN" value={user.maskedTckn} />
            <InfoRow label="E-posta" value={user.email || '-'} />
            {saveMsg && (
              <div className="rounded-lg bg-emerald-500/10 p-2 text-sm text-emerald-400">{saveMsg}</div>
            )}
          </div>
        )}
      </div>

      {/* Roles */}
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Roller</h2>

        {user.roles.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <span key={role} className="rounded-full bg-blue-500/20 px-3 py-1.5 text-sm font-medium text-blue-400">
                {roleLabel[role] || role}
              </span>
            ))}
          </div>
        ) : (
          <p className="mb-4 text-sm text-slate-400">Henüz bir rolünüz yok. Aşağıdan rol ekleyebilirsiniz.</p>
        )}

        <div className="flex gap-3">
          {!user.roles.includes('TENANT') && (
            <button onClick={() => handleAddRole('TENANT')} disabled={addingRole} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50">
              {addingRole ? 'Ekleniyor...' : 'Kiracı Rolü Ekle'}
            </button>
          )}
          {!user.roles.includes('LANDLORD') && (
            <button onClick={() => handleAddRole('LANDLORD')} disabled={addingRole} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-50">
              {addingRole ? 'Ekleniyor...' : 'Ev Sahibi Rolu Ekle'}
            </button>
          )}
          {user.roles.includes('TENANT') && user.roles.includes('LANDLORD') && (
            <span className="text-sm text-slate-500">Tüm roller mevcut.</span>
          )}
        </div>

        {roleMsg && (
          <div className={`mt-3 rounded-lg p-2 text-sm ${roleMsg.includes('eklendi') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {roleMsg}
          </div>
        )}
      </div>

      {/* KYC */}
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Kimlik Doğrulama (KYC)</h2>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${kycStatusLabel[user.kycStatus]?.cls || 'bg-slate-500/20 text-slate-400'}`}>
            {kycStatusLabel[user.kycStatus]?.text || user.kycStatus}
          </span>
        </div>

        {user.kycStatus === 'PENDING' ? (
          <div>
            <p className="mb-3 text-sm text-slate-400">
              KYC doğrulamasını tamamlayarak tüm özelliklere erişim sağlayabilirsiniz.
            </p>
            <button onClick={handleKyc} disabled={kycLoading} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700 disabled:opacity-50">
              {kycLoading ? 'Doğrulanıyor...' : 'KYC Doğrulamasını Başlat'}
            </button>
          </div>
        ) : user.kycStatus === 'VERIFIED' ? (
          <p className="text-sm text-emerald-400">Kimlik doğrulamanız tamamlanmıştır.</p>
        ) : (
          <p className="text-sm text-red-400">Kimlik doğrulamanız reddedilmiştir. Destek ile iletişime geçin.</p>
        )}

        {kycMsg && (
          <div className={`mt-3 rounded-lg p-2 text-sm ${kycMsg.includes('tamamlandı') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {kycMsg}
          </div>
        )}
      </div>

      {/* Payment Reminder Preferences */}
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Ödeme Hatırlatmaları</h2>
          <button
            onClick={() => setPrefs((p) => ({ ...p, enabled: !p.enabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${prefs.enabled ? 'bg-blue-600' : 'bg-slate-600'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${prefs.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className={`space-y-5 ${!prefs.enabled ? 'pointer-events-none opacity-40' : ''}`}>
          {/* Channel */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Bildirim Kanalı</p>
            <div className="flex flex-wrap gap-3">
              <CheckOption
                label="E-posta"
                checked={prefs.channelEmail}
                onChange={(v) => setPrefs((p) => ({ ...p, channelEmail: v }))}
              />
              <CheckOption
                label="SMS"
                checked={prefs.channelSms}
                onChange={(v) => setPrefs((p) => ({ ...p, channelSms: v }))}
              />
            </div>
          </div>

          {/* Timing */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Hatırlatma Zamanlaması</p>
            <div className="flex flex-wrap gap-3">
              <CheckOption
                label="7 gün önce"
                checked={prefs.remind7Days}
                onChange={(v) => setPrefs((p) => ({ ...p, remind7Days: v }))}
              />
              <CheckOption
                label="3 gün önce"
                checked={prefs.remind3Days}
                onChange={(v) => setPrefs((p) => ({ ...p, remind3Days: v }))}
              />
              <CheckOption
                label="1 gün önce"
                checked={prefs.remind1Day}
                onChange={(v) => setPrefs((p) => ({ ...p, remind1Day: v }))}
              />
            </div>
          </div>

          {/* Overdue */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Ek Uyarı</p>
            <CheckOption
              label="Geciken ödeme için +1 gün tekrar hatırlat"
              checked={prefs.overdueReminder}
              onChange={(v) => setPrefs((p) => ({ ...p, overdueReminder: v }))}
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleSavePrefs}
            disabled={prefsSaving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {prefsSaving ? 'Kaydediliyor...' : 'Tercihleri Kaydet'}
          </button>
          {prefsMsg && (
            <span className={`text-sm ${prefsMsg.includes('kaydedildi') ? 'text-emerald-400' : 'text-red-400'}`}>
              {prefsMsg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-700/30 py-2 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

function CheckOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-600 bg-[#0a1628] accent-blue-500"
      />
      <span className="text-sm text-slate-300">{label}</span>
    </label>
  );
}

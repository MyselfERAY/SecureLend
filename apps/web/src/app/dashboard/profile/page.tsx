'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';

export default function ProfilePage() {
  const { tokens, user, refreshUser } = useAuth();

  // Edit profile
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Add role
  const [addingRole, setAddingRole] = useState(false);
  const [roleMsg, setRoleMsg] = useState('');

  // KYC
  const [kycLoading, setKycLoading] = useState(false);
  const [kycMsg, setKycMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const body: Record<string, string> = {};
      if (fullName !== user?.fullName) body.fullName = fullName;
      if (email !== (user?.email || '')) body.email = email;

      if (Object.keys(body).length === 0) {
        setSaveMsg('Degisiklik yok.');
        setSaving(false);
        return;
      }

      const res = await api('/api/v1/users/me', {
        method: 'PATCH', body, token: tokens!.accessToken,
      });

      if (res.status === 'success') {
        setSaveMsg('Profil guncellendi.');
        setEditing(false);
        await refreshUser();
      } else {
        setSaveMsg((res as any).data?.message || 'Hata olustu');
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
        setRoleMsg(`${role === 'TENANT' ? 'Kiraci' : 'Ev Sahibi'} rolu eklendi.`);
        await refreshUser();
      } else {
        setRoleMsg((res as any).data?.message || 'Hata olustu');
      }
    } catch (err: any) {
      setRoleMsg(err.message);
    } finally {
      setAddingRole(false);
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
        setKycMsg('KYC dogrulamasi tamamlandi.');
        await refreshUser();
      } else {
        setKycMsg((res as any).data?.message || 'Hata olustu');
      }
    } catch (err: any) {
      setKycMsg(err.message);
    } finally {
      setKycLoading(false);
    }
  };

  if (!user) {
    return <div className="text-center py-12 text-gray-500">Yukleniyor...</div>;
  }

  const kycStatusLabel: Record<string, { text: string; cls: string }> = {
    PENDING: { text: 'Bekliyor', cls: 'bg-yellow-100 text-yellow-700' },
    VERIFIED: { text: 'Dogrulandi', cls: 'bg-green-100 text-green-700' },
    REJECTED: { text: 'Reddedildi', cls: 'bg-red-100 text-red-700' },
  };

  const roleLabel: Record<string, string> = {
    TENANT: 'Kiraci',
    LANDLORD: 'Ev Sahibi',
    ADMIN: 'Yonetici',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Profilim</h1>

      {/* Profile Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Kisisel Bilgiler</h2>
          {!editing && (
            <button
              onClick={() => { setEditing(true); setSaveMsg(''); }}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              Duzenle
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            {saveMsg && (
              <div className={`text-sm p-2 rounded ${saveMsg.includes('guncellendi') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {saveMsg}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button
                onClick={() => { setEditing(false); setFullName(user.fullName); setEmail(user.email || ''); }}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Iptal
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
              <div className="text-sm p-2 rounded bg-green-50 text-green-700">{saveMsg}</div>
            )}
          </div>
        )}
      </div>

      {/* Roles Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Roller</h2>

        {user.roles.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {user.roles.map((role) => (
              <span
                key={role}
                className="px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-700 rounded-full"
              >
                {roleLabel[role] || role}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">Henuz bir rolunuz yok. Asagidan rol ekleyebilirsiniz.</p>
        )}

        {/* Add role buttons */}
        <div className="flex gap-3">
          {!user.roles.includes('TENANT') && (
            <button
              onClick={() => handleAddRole('TENANT')}
              disabled={addingRole}
              className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {addingRole ? 'Ekleniyor...' : 'Kiraci Rolu Ekle'}
            </button>
          )}
          {!user.roles.includes('LANDLORD') && (
            <button
              onClick={() => handleAddRole('LANDLORD')}
              disabled={addingRole}
              className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {addingRole ? 'Ekleniyor...' : 'Ev Sahibi Rolu Ekle'}
            </button>
          )}
          {user.roles.includes('TENANT') && user.roles.includes('LANDLORD') && (
            <span className="text-sm text-gray-500">Tum roller mevcut.</span>
          )}
        </div>

        {roleMsg && (
          <div className={`mt-3 text-sm p-2 rounded ${roleMsg.includes('eklendi') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {roleMsg}
          </div>
        )}
      </div>

      {/* KYC Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Kimlik Dogrulama (KYC)</h2>
          <span className={`px-2 py-1 rounded text-xs font-medium ${kycStatusLabel[user.kycStatus]?.cls || 'bg-gray-100 text-gray-600'}`}>
            {kycStatusLabel[user.kycStatus]?.text || user.kycStatus}
          </span>
        </div>

        {user.kycStatus === 'PENDING' ? (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              KYC dogrulamasini tamamlayarak tum ozelliklere erisim saglayabilirsiniz.
            </p>
            <button
              onClick={handleKyc}
              disabled={kycLoading}
              className="px-4 py-2 text-sm font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {kycLoading ? 'Dogrulaniyor...' : 'KYC Dogrulamasini Baslat'}
            </button>
          </div>
        ) : user.kycStatus === 'VERIFIED' ? (
          <p className="text-sm text-green-600">Kimlik dogrulamaniz tamamlanmistir.</p>
        ) : (
          <p className="text-sm text-red-600">Kimlik dogrulamaniz reddedilmistir. Destek ile iletisime gecin.</p>
        )}

        {kycMsg && (
          <div className={`mt-3 text-sm p-2 rounded ${kycMsg.includes('tamamlandi') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {kycMsg}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

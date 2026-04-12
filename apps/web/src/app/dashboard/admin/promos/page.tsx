'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';

interface PromoTemplate {
  id: string;
  name: string;
  type: string;
  description: string | null;
  discountPercent: number;
  durationMonths: number;
  isActive: boolean;
  isAutoApply: boolean;
  maxUsageCount: number | null;
  currentUsage: number;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
  _count: { userPromos: number };
}

interface PromoStats {
  templates: number;
  totalActive: number;
  totalUsed: number;
}

const PROMO_TYPES = [
  { value: 'FIRST_MONTHS_FREE', label: 'İlk Aylar Ücretsiz' },
  { value: 'RENEWAL_DISCOUNT', label: 'Yenileme İndirimi' },
  { value: 'REFERRAL_BONUS', label: 'Referans Bonusu' },
  { value: 'LOYALTY_REWARD', label: 'Sadakat Ödülü' },
  { value: 'CUSTOM', label: 'Özel' },
];

const typeLabel: Record<string, string> = {
  FIRST_MONTHS_FREE: 'İlk Aylar Ücretsiz',
  RENEWAL_DISCOUNT: 'Yenileme İndirimi',
  REFERRAL_BONUS: 'Referans Bonusu',
  LOYALTY_REWARD: 'Sadakat Ödülü',
  CUSTOM: 'Özel',
};

const typeColor: Record<string, string> = {
  FIRST_MONTHS_FREE: 'bg-emerald-100 text-emerald-700',
  RENEWAL_DISCOUNT: 'bg-blue-100 text-blue-700',
  REFERRAL_BONUS: 'bg-purple-100 text-purple-700',
  LOYALTY_REWARD: 'bg-yellow-100 text-yellow-700',
  CUSTOM: 'bg-gray-100 text-gray-700',
};

export default function AdminPromosPage() {
  const { tokens } = useAuth();
  const [templates, setTemplates] = useState<PromoTemplate[]>([]);
  const [stats, setStats] = useState<PromoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    name: '',
    type: 'CUSTOM',
    description: '',
    discountPercent: 100,
    durationMonths: 1,
    isAutoApply: false,
    maxUsageCount: '',
    validFrom: '',
    validUntil: '',
  });

  const load = async () => {
    if (!tokens?.accessToken) return;
    setLoading(true);
    const [tRes, sRes] = await Promise.all([
      api<PromoTemplate[]>('/api/v1/promos/templates', { token: tokens.accessToken }),
      api<PromoStats>('/api/v1/promos/stats', { token: tokens.accessToken }),
    ]);
    if (tRes.status === 'success' && tRes.data) setTemplates(tRes.data);
    if (sRes.status === 'success' && sRes.data) setStats(sRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [tokens?.accessToken]);

  const handleCreate = async () => {
    if (!tokens?.accessToken || !form.name.trim()) return;
    setSaving(true);
    const body: Record<string, unknown> = {
      name: form.name.trim(),
      type: form.type,
      discountPercent: Number(form.discountPercent),
      durationMonths: Number(form.durationMonths),
      isAutoApply: form.isAutoApply,
    };
    if (form.description.trim()) body.description = form.description.trim();
    if (form.maxUsageCount) body.maxUsageCount = Number(form.maxUsageCount);
    if (form.validFrom) body.validFrom = form.validFrom;
    if (form.validUntil) body.validUntil = form.validUntil;

    const res = await api('/api/v1/promos/templates', {
      method: 'POST',
      body,
      token: tokens.accessToken,
    });
    if (res.status === 'success') {
      setShowCreate(false);
      setForm({ name: '', type: 'CUSTOM', description: '', discountPercent: 100, durationMonths: 1, isAutoApply: false, maxUsageCount: '', validFrom: '', validUntil: '' });
      await load();
    }
    setSaving(false);
  };

  const handleToggle = async (id: string) => {
    if (!tokens?.accessToken) return;
    await api(`/api/v1/promos/templates/${id}/toggle`, {
      method: 'POST',
      token: tokens.accessToken,
    });
    await load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promosyon Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-1">Şablon oluştur, kullanıcılara ata, istatistikleri takip et</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          {showCreate ? 'İptal' : '+ Yeni Şablon'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 font-medium">Toplam Şablon</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.templates}</div>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
            <div className="text-xs text-emerald-600 font-medium">Aktif Promosyon</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.totalActive}</div>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <div className="text-xs text-blue-600 font-medium">Kullanılmış</div>
            <div className="text-2xl font-bold text-blue-700 mt-1">{stats.totalUsed}</div>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Yeni Promosyon Şablonu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şablon Adı *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="orn. Ilk 3 Ay Garanti Ücretsiz"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              >
                {PROMO_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Promosyon açıklaması"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İndirim Oranı (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Süre (Ay)</label>
              <input
                type="number"
                min="1"
                max="36"
                value={form.durationMonths}
                onChange={(e) => setForm({ ...form, durationMonths: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maks Kullanım (boş = sınırsız</label>
              <input
                type="number"
                min="0"
                value={form.maxUsageCount}
                onChange={(e) => setForm({ ...form, maxUsageCount: e.target.value })}
                placeholder="Sınırsız"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="autoApply"
                type="checkbox"
                checked={form.isAutoApply}
                onChange={(e) => setForm({ ...form, isAutoApply: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="autoApply" className="text-sm text-gray-700">Kayıt sırasında otomatik uygula</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Geçerlilik Başlangıcı</label>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Geçerlilik Bitişi</label>
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleCreate}
              disabled={saving || !form.name.trim()}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? 'Oluşturuluyor...' : 'Şablon Oluştur'}
            </button>
          </div>
        </div>
      )}

      {/* Templates Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">Henüz promosyon şablonu oluşturulmamış.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            İlk şablonu oluştur
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Şablon</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tür</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">İndirim</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Süre</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Kullanım</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Durum</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {templates.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{t.name}</div>
                      {t.description && (
                        <div className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{t.description}</div>
                      )}
                      {t.isAutoApply && (
                        <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                          Otomatik
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColor[t.type] || 'bg-gray-100 text-gray-700'}`}>
                        {typeLabel[t.type] || t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-gray-900">%{t.discountPercent}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {t.durationMonths} ay
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-900 font-medium">{t.currentUsage}</span>
                      {t.maxUsageCount && (
                        <span className="text-gray-400">/{t.maxUsageCount}</span>
                      )}
                      <div className="text-xs text-gray-400">{t._count.userPromos} atanmis</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        t.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {t.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggle(t.id)}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                          t.isActive
                            ? 'border border-red-300 text-red-600 hover:bg-red-50'
                            : 'border border-green-300 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {t.isActive ? 'Deaktif Et' : 'Aktif Et'}
                      </button>
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

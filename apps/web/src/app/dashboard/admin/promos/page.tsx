'use client';

import { useEffect, useState } from 'react';
import { Gift, Plus, Power } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import {
  PageHeader, Card, Badge, DataTable, EmptyState, LoadingSkeleton, StatCard, Button,
  type Column, type BadgeTone,
} from '../_components/admin-ui';

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

const TYPE_META: Record<string, { label: string; tone: BadgeTone }> = {
  FIRST_MONTHS_FREE: { label: 'İlk Aylar', tone: 'success' },
  RENEWAL_DISCOUNT: { label: 'Yenileme', tone: 'info' },
  REFERRAL_BONUS: { label: 'Referans', tone: 'info' },
  LOYALTY_REWARD: { label: 'Sadakat', tone: 'warning' },
  CUSTOM: { label: 'Özel', tone: 'neutral' },
};

const fieldCls = 'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500';
const labelCls = 'block text-xs font-medium text-slate-400 mb-1';

export default function AdminPromosPage() {
  const { tokens } = useAuth();
  const [templates, setTemplates] = useState<PromoTemplate[]>([]);
  const [stats, setStats] = useState<PromoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'CUSTOM', description: '',
    discountPercent: 100, durationMonths: 1,
    isAutoApply: false, maxUsageCount: '',
    validFrom: '', validUntil: '',
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

    const res = await api('/api/v1/promos/templates', { method: 'POST', body, token: tokens.accessToken });
    if (res.status === 'success') {
      setShowCreate(false);
      setForm({ name: '', type: 'CUSTOM', description: '', discountPercent: 100, durationMonths: 1, isAutoApply: false, maxUsageCount: '', validFrom: '', validUntil: '' });
      await load();
    }
    setSaving(false);
  };

  const handleToggle = async (id: string) => {
    if (!tokens?.accessToken) return;
    await api(`/api/v1/promos/templates/${id}/toggle`, { method: 'POST', token: tokens.accessToken });
    await load();
  };

  const columns: Column<PromoTemplate>[] = [
    {
      key: 'template',
      label: 'Şablon',
      render: (t) => (
        <div>
          <div className="font-medium text-white text-sm">{t.name}</div>
          {t.description && <div className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">{t.description}</div>}
          {t.isAutoApply && <div className="mt-1"><Badge tone="info">Otomatik</Badge></div>}
        </div>
      ),
    },
    {
      key: 'type', label: 'Tür',
      render: (t) => {
        const m = TYPE_META[t.type] || { label: t.type, tone: 'neutral' as BadgeTone };
        return <Badge tone={m.tone}>{m.label}</Badge>;
      },
    },
    {
      key: 'discount', label: 'İndirim', align: 'center',
      render: (t) => <span className="font-mono font-semibold text-white">%{t.discountPercent}</span>,
    },
    {
      key: 'duration', label: 'Süre', align: 'center',
      render: (t) => <span className="text-slate-300 text-sm">{t.durationMonths} ay</span>,
    },
    {
      key: 'usage', label: 'Kullanım', align: 'center',
      render: (t) => (
        <div>
          <span className="font-mono text-white text-sm">{t.currentUsage}</span>
          {t.maxUsageCount && <span className="text-slate-500 text-sm">/{t.maxUsageCount}</span>}
          <div className="text-xs text-slate-500 mt-0.5">{t._count.userPromos} atanmış</div>
        </div>
      ),
    },
    {
      key: 'status', label: 'Durum', align: 'center',
      render: (t) => <Badge tone={t.isActive ? 'success' : 'neutral'}>{t.isActive ? 'Aktif' : 'Pasif'}</Badge>,
    },
    {
      key: 'action', label: '', align: 'center',
      render: (t) => (
        <Button
          variant={t.isActive ? 'ghost' : 'primary'}
          size="sm"
          icon={Power}
          onClick={() => handleToggle(t.id)}
          className={t.isActive ? 'text-rose-400 hover:text-rose-300' : ''}
        >
          {t.isActive ? 'Deaktif' : 'Aktif'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promosyon Yönetimi"
        desc="Şablon oluştur, kullanıcılara ata, istatistikleri takip et"
        icon={Gift}
        back={{ href: '/dashboard/admin', label: 'Yönetim Paneli' }}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? 'İptal' : 'Yeni Şablon'}
          </Button>
        }
      />

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Toplam Şablon" value={stats.templates} accent="slate" />
          <StatCard label="Aktif Promosyon" value={stats.totalActive} accent="emerald" />
          <StatCard label="Kullanılmış" value={stats.totalUsed} accent="blue" />
        </div>
      )}

      {showCreate && (
        <Card className="border-blue-500/30">
          <h3 className="text-sm font-semibold text-white mb-4">Yeni Promosyon Şablonu</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Şablon Adı *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="örn. İlk 3 Ay Ücretsiz" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Tür</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={fieldCls}>
                {PROMO_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Açıklama</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Promosyon açıklaması" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>İndirim Oranı (%)</label>
              <input type="number" min="1" max="100" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })} className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Süre (Ay)</label>
              <input type="number" min="1" max="36" value={form.durationMonths} onChange={(e) => setForm({ ...form, durationMonths: Number(e.target.value) })} className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Maks Kullanım (boş = sınırsız)</label>
              <input type="number" min="0" value={form.maxUsageCount} onChange={(e) => setForm({ ...form, maxUsageCount: e.target.value })} placeholder="Sınırsız" className={fieldCls} />
            </div>
            <div className="flex items-end gap-2">
              <label className="inline-flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.isAutoApply} onChange={(e) => setForm({ ...form, isAutoApply: e.target.checked })} className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600" />
                Kayıt sırasında otomatik uygula
              </label>
            </div>
            <div>
              <label className={labelCls}>Geçerlilik Başlangıcı</label>
              <input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Geçerlilik Bitişi</label>
              <input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} className={fieldCls} />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="primary" onClick={handleCreate} disabled={saving || !form.name.trim()}>
              {saving ? 'Oluşturuluyor...' : 'Şablon Oluştur'}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <LoadingSkeleton rows={3} />
      ) : templates.length === 0 ? (
        <EmptyState icon={Gift} title="Henüz promosyon şablonu yok" desc="Yukarıdaki 'Yeni Şablon' butonuyla oluşturun." />
      ) : (
        <DataTable columns={columns} data={templates} />
      )}
    </div>
  );
}

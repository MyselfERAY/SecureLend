'use client';

import { useEffect, useState } from 'react';
import { Link2, Copy, Check, Plus, X } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import {
  PageHeader, Card, Badge, DataTable, EmptyState, LoadingSkeleton, Button,
  type Column, type BadgeTone,
} from '../_components/admin-ui';

interface Invite {
  id: string;
  token: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  used: boolean;
  usedAt: string | null;
  expired: boolean;
  expiresAt: string;
  createdAt: string;
  inviteUrl: string;
}

function statusBadge(inv: Invite): { label: string; tone: BadgeTone } {
  if (inv.used) return { label: 'Kullanıldı', tone: 'success' };
  if (inv.expired) return { label: 'Süresi Doldu', tone: 'danger' };
  return { label: 'Aktif', tone: 'info' };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Kopyalandı' : 'Kopyala'}
    </button>
  );
}

export default function AdminInvitesPage() {
  const { tokens } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newInvite, setNewInvite] = useState<Invite | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', note: '', expiresInDays: 7 });
  const [formError, setFormError] = useState('');

  const load = async () => {
    if (!tokens?.accessToken) return;
    setLoading(true);
    const res = await api<{ invites: Invite[]; total: number }>(
      '/api/v1/admin/invites',
      { token: tokens.accessToken },
    );
    if (res.status === 'success' && res.data) {
      setInvites(res.data.invites);
      setTotal(res.data.total);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [tokens?.accessToken]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokens?.accessToken) return;
    setCreating(true);
    setFormError('');
    const res = await api<Invite>('/api/v1/admin/invites', {
      method: 'POST',
      token: tokens.accessToken,
      body: {
        fullName: form.fullName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        note: form.note || undefined,
        expiresInDays: form.expiresInDays,
      },
    });
    setCreating(false);
    if (res.status === 'success' && res.data) {
      setNewInvite(res.data);
      setForm({ fullName: '', email: '', phone: '', note: '', expiresInDays: 7 });
      setShowForm(false);
      load();
    } else {
      setFormError(res.message || 'Davet oluşturulamadı');
    }
  };

  const columns: Column<Invite>[] = [
    {
      key: 'recipient',
      label: 'Alıcı',
      render: (inv) => (
        <div>
          <div className="font-medium text-white">{inv.fullName}</div>
          {inv.email && <div className="text-xs text-slate-500">{inv.email}</div>}
          {inv.phone && <div className="text-xs text-slate-500 font-mono">+90 {inv.phone}</div>}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Durum',
      render: (inv) => {
        const s = statusBadge(inv);
        return <Badge tone={s.tone}>{s.label}</Badge>;
      },
    },
    {
      key: 'note',
      label: 'Not',
      render: (inv) => (
        <span className="text-xs text-slate-400 max-w-[200px] truncate block">
          {inv.note || '—'}
        </span>
      ),
    },
    {
      key: 'expires',
      label: 'Son Geçerlilik',
      render: (inv) => (
        <span className="text-xs text-slate-400">
          {new Date(inv.expiresAt).toLocaleDateString('tr-TR')}
        </span>
      ),
    },
    {
      key: 'link',
      label: 'Link',
      render: (inv) => (
        inv.used || inv.expired ? (
          <span className="text-xs text-slate-600">—</span>
        ) : (
          <CopyButton text={inv.inviteUrl} />
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Davet Linkleri"
        desc={`${total} davet oluşturuldu`}
        icon={Link2}
        back={{ href: '/dashboard/admin', label: 'Yönetim Paneli' }}
        actions={
          <Button icon={Plus} onClick={() => { setShowForm(!showForm); setNewInvite(null); }}>
            Yeni Davet
          </Button>
        }
      />

      {newInvite && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-400">Davet linki oluşturuldu!</p>
              <p className="mt-1 text-xs text-slate-400 break-all font-mono">{newInvite.inviteUrl}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <CopyButton text={newInvite.inviteUrl} />
              <button onClick={() => setNewInvite(null)}>
                <X className="h-4 w-4 text-slate-500 hover:text-white" />
              </button>
            </div>
          </div>
        </Card>
      )}

      {showForm && (
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4">Yeni Kişiselleştirilmiş Davet</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {formError}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Ad Soyad *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Ahmet Yılmaz"
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">E-posta</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ahmet@example.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Telefon</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="5551234567"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Geçerlilik (gün)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={form.expiresInDays}
                  onChange={(e) => setForm({ ...form, expiresInDays: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Özel Mesaj (opsiyonel)</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Merhaba, kiranızı güvence altına almak için hazırladığımız platforma davet ediyoruz..."
                rows={2}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={creating || !form.fullName.trim()}>
                {creating ? 'Oluşturuluyor...' : 'Davet Oluştur'}
              </Button>
              <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>İptal</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : invites.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="Henüz davet linki oluşturulmadı"
          desc="Yeni Davet butonuna tıklayarak kişiselleştirilmiş link oluşturun."
        />
      ) : (
        <DataTable columns={columns} data={invites} />
      )}
    </div>
  );
}

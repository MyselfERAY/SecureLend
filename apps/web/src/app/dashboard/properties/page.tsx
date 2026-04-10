'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';
import { PROVINCES, DISTRICTS } from '../../../lib/turkey-locations';

interface Property {
  id: string;
  title: string;
  addressLine1: string;
  city: string;
  district: string;
  propertyType: string;
  roomCount: string | null;
  areaM2: number | null;
  floor: number | null;
  totalFloors: number | null;
  monthlyRent: number;
  depositAmount: number | null;
  status: string;
}

export default function PropertiesPage() {
  const { tokens, user, refreshUser } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '', addressLine1: '', city: '', district: '',
    propertyType: 'APARTMENT', roomCount: '', areaM2: '',
    floor: '', totalFloors: '', monthlyRent: '', depositAmount: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState(false);

  const emptyForm = {
    title: '', addressLine1: '', city: '', district: '',
    propertyType: 'APARTMENT', roomCount: '', areaM2: '',
    floor: '', totalFloors: '', monthlyRent: '', depositAmount: '',
  };

  const loadProperties = async () => {
    if (!tokens?.accessToken) return;
    try {
      const res = await api<Property[]>('/api/v1/properties/my', { token: tokens.accessToken });
      if (res.status === 'success' && res.data) setProperties(res.data);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.accessToken]);

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (p: Property) => {
    setEditingId(p.id);
    setFormData({
      title: p.title,
      addressLine1: p.addressLine1,
      city: p.city,
      district: p.district,
      propertyType: p.propertyType,
      roomCount: p.roomCount || '',
      areaM2: p.areaM2 ? String(p.areaM2) : '',
      floor: p.floor ? String(p.floor) : '',
      totalFloors: p.totalFloors ? String(p.totalFloors) : '',
      monthlyRent: String(p.monthlyRent),
      depositAmount: p.depositAmount ? String(p.depositAmount) : '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        title: formData.title,
        addressLine1: formData.addressLine1,
        city: formData.city,
        district: formData.district,
        propertyType: formData.propertyType,
        monthlyRent: Number(formData.monthlyRent),
      };
      if (formData.roomCount) body.roomCount = formData.roomCount;
      if (formData.areaM2) body.areaM2 = Number(formData.areaM2);
      if (formData.floor) body.floor = Number(formData.floor);
      if (formData.totalFloors) body.totalFloors = Number(formData.totalFloors);
      if (formData.depositAmount) body.depositAmount = Number(formData.depositAmount);

      let res;
      if (editingId) {
        res = await api(`/api/v1/properties/${editingId}`, {
          method: 'PATCH', body, token: tokens!.accessToken,
        });
      } else {
        res = await api('/api/v1/properties', {
          method: 'POST', body, token: tokens!.accessToken,
        });
      }

      if (res.status === 'success') {
        setShowForm(false);
        setEditingId(null);
        setFormData(emptyForm);
        await loadProperties();
        if (!editingId) await refreshUser();
      } else {
        setFormError((res as any).data?.validation?.[0] || (res as any).data?.message || 'Hata olustu');
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/v1/properties/${deleteTarget.id}`, {
        method: 'DELETE', token: tokens!.accessToken,
      });
      setDeleteTarget(null);
      await loadProperties();
    } catch (err: any) {
      alert('Silme hatasi: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const statusLabel: Record<string, { text: string; cls: string }> = {
    ACTIVE: { text: 'Aktif', cls: 'bg-emerald-500/20 text-emerald-400' },
    RENTED: { text: 'Kirada', cls: 'bg-blue-500/20 text-blue-400' },
    INACTIVE: { text: 'Pasif', cls: 'bg-slate-500/20 text-slate-400' },
  };

  const propertyTypeLabel: Record<string, string> = {
    APARTMENT: 'Daire', HOUSE: 'Mustakil Ev', OFFICE: 'Ofis', SHOP: 'Dukkan',
  };

  const inputCls = 'w-full rounded-lg border border-slate-600 bg-[#0a1628] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
  const labelCls = 'mb-1.5 block text-sm font-medium text-slate-300';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Mulklerim</h1>
        <button
          onClick={() => showForm ? (setShowForm(false), setEditingId(null)) : openCreateForm()}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            showForm
              ? 'border border-slate-600 text-slate-300 hover:bg-slate-700/50'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {showForm ? 'Iptal' : 'Mulk Ekle'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">
            {editingId ? 'Mulku Duzenle' : 'Yeni Mulk Ekle'}
          </h2>
          {formError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{formError}</div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Baslik *</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Adres *</label>
              <input type="text" value={formData.addressLine1} onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Sehir *</label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value, district: '' })}
                className={inputCls}
                required
              >
                <option value="">Secin</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Ilce *</label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className={inputCls}
                required
                disabled={!formData.city}
              >
                <option value="">Secin</option>
                {(DISTRICTS[formData.city] || []).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Tur</label>
              <select value={formData.propertyType} onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })} className={inputCls}>
                <option value="APARTMENT">Daire</option>
                <option value="HOUSE">Mustakil Ev</option>
                <option value="OFFICE">Ofis</option>
                <option value="SHOP">Dukkan</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Oda Sayisi</label>
              <input type="text" value={formData.roomCount} onChange={(e) => setFormData({ ...formData, roomCount: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Alan (m2)</label>
              <input type="number" value={formData.areaM2} onChange={(e) => setFormData({ ...formData, areaM2: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Kat</label>
              <input type="number" value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Toplam Kat</label>
              <input type="number" value={formData.totalFloors} onChange={(e) => setFormData({ ...formData, totalFloors: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Aylik Kira (TL) *</label>
              <input type="number" value={formData.monthlyRent} onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Depozito (TL)</label>
              <input type="number" value={formData.depositAmount} onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Kaydediliyor...' : editingId ? 'Guncelle' : 'Kaydet'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-lg border border-slate-600 px-6 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700/50">
              Vazgec
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-700/50">
            <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="text-lg font-medium text-slate-300">Henuz mulkunuz yok</div>
          <p className="mt-2 text-sm text-slate-500">Mulk ekleyerek baslayabilirsiniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {properties.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{p.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{p.addressLine1}</p>
                  <p className="text-sm text-slate-500">{p.district}, {p.city}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusLabel[p.status]?.cls || 'bg-slate-500/20 text-slate-400'}`}>
                  {statusLabel[p.status]?.text || p.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="rounded bg-slate-700/50 px-2 py-0.5 text-xs text-slate-300">
                  {propertyTypeLabel[p.propertyType] || p.propertyType}
                </span>
                {p.roomCount && <span className="text-slate-400">{p.roomCount}</span>}
                {p.areaM2 && <span className="text-slate-400">{p.areaM2} m2</span>}
                <span className="ml-auto font-semibold text-blue-400">
                  {p.monthlyRent.toLocaleString('tr-TR')} TL/ay
                </span>
              </div>

              {p.status !== 'RENTED' && (
                <div className="mt-4 flex gap-2 border-t border-slate-700/30 pt-3">
                  <button onClick={() => openEditForm(p)} className="rounded-lg bg-blue-600/20 px-3 py-1.5 text-xs font-medium text-blue-400 transition hover:bg-blue-600/30">
                    Duzenle
                  </button>
                  {p.status === 'ACTIVE' && (
                    <button onClick={() => setDeleteTarget(p)} className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/30">
                      Sil
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6">
            <h3 className="mb-2 text-lg font-semibold text-white">Mulku Sil</h3>
            <p className="mb-1 text-sm text-slate-300">
              <strong>{deleteTarget.title}</strong> mulkunu silmek istediginize emin misiniz?
            </p>
            <p className="mb-4 text-xs text-red-400">
              Bu islem mulku pasif yapacaktir. Aktif sozlesmesi olan mulkler silinemez.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-700/50">
                Vazgec
              </button>
              <button onClick={handleDelete} disabled={deleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

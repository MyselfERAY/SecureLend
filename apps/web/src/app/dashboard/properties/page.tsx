'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';

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

  // Delete confirmation
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
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadProperties(); }, [tokens?.accessToken]);

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
        // Update existing property
        res = await api(`/api/v1/properties/${editingId}`, {
          method: 'PATCH', body, token: tokens!.accessToken,
        });
      } else {
        // Create new property
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
    ACTIVE: { text: 'Aktif', cls: 'bg-green-100 text-green-700' },
    RENTED: { text: 'Kirada', cls: 'bg-blue-100 text-blue-700' },
    INACTIVE: { text: 'Pasif', cls: 'bg-gray-100 text-gray-700' },
  };

  const propertyTypeLabel: Record<string, string> = {
    APARTMENT: 'Daire', HOUSE: 'Mustakil Ev', OFFICE: 'Ofis', SHOP: 'Dukkan',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Mulklerim</h1>
        <button
          onClick={() => showForm ? (setShowForm(false), setEditingId(null)) : openCreateForm()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          {showForm ? 'Iptal' : 'Mulk Ekle'}
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {editingId ? 'Mulku Duzenle' : 'Yeni Mulk Ekle'}
          </h2>
          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{formError}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Baslik" value={formData.title} onChange={(v) => setFormData({ ...formData, title: v })} required />
            <Input label="Adres" value={formData.addressLine1} onChange={(v) => setFormData({ ...formData, addressLine1: v })} required />
            <Input label="Sehir" value={formData.city} onChange={(v) => setFormData({ ...formData, city: v })} required />
            <Input label="Ilce" value={formData.district} onChange={(v) => setFormData({ ...formData, district: v })} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tur</label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="APARTMENT">Daire</option>
                <option value="HOUSE">Mustakil Ev</option>
                <option value="OFFICE">Ofis</option>
                <option value="SHOP">Dukkan</option>
              </select>
            </div>
            <Input label="Oda Sayisi" value={formData.roomCount} onChange={(v) => setFormData({ ...formData, roomCount: v })} />
            <Input label="Alan (m2)" value={formData.areaM2} onChange={(v) => setFormData({ ...formData, areaM2: v })} type="number" />
            <Input label="Kat" value={formData.floor} onChange={(v) => setFormData({ ...formData, floor: v })} type="number" />
            <Input label="Toplam Kat" value={formData.totalFloors} onChange={(v) => setFormData({ ...formData, totalFloors: v })} type="number" />
            <Input label="Aylik Kira (TL)" value={formData.monthlyRent} onChange={(v) => setFormData({ ...formData, monthlyRent: v })} type="number" required />
            <Input label="Depozito (TL)" value={formData.depositAmount} onChange={(v) => setFormData({ ...formData, depositAmount: v })} type="number" />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Kaydediliyor...' : editingId ? 'Guncelle' : 'Kaydet'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Vazgec
            </button>
          </div>
        </form>
      )}

      {/* Properties List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Yukleniyor...</div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-gray-400 text-lg">Henuz mulkunuz yok</div>
          <p className="text-gray-500 text-sm mt-2">Mulk ekleyerek baslayabilirsiniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{p.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{p.addressLine1}</p>
                  <p className="text-sm text-gray-500">{p.district}, {p.city}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusLabel[p.status]?.cls || ''}`}>
                  {statusLabel[p.status]?.text || p.status}
                </span>
              </div>
              <div className="mt-3 flex gap-4 text-sm text-gray-600">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {propertyTypeLabel[p.propertyType] || p.propertyType}
                </span>
                {p.roomCount && <span>{p.roomCount}</span>}
                {p.areaM2 && <span>{p.areaM2} m2</span>}
                <span className="font-semibold text-blue-600">
                  {p.monthlyRent.toLocaleString('tr-TR')} TL/ay
                </span>
              </div>

              {/* Action Buttons */}
              {p.status !== 'RENTED' && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={() => openEditForm(p)}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                  >
                    Duzenle
                  </button>
                  {p.status === 'ACTIVE' && (
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                    >
                      Sil
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mulku Sil</h3>
            <p className="text-sm text-gray-600 mb-1">
              <strong>{deleteTarget.title}</strong> mulkunu silmek istediginize emin misiniz?
            </p>
            <p className="text-xs text-red-500 mb-4">
              Bu islem mulku pasif yapacaktir. Aktif sozlesmesi olan mulkler silinemez.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Vazgec
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, required, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        required={required}
      />
    </div>
  );
}

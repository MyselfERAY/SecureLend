'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';

interface ContractSummary {
  id: string;
  status: string;
  monthlyRent: number;
  startDate: string;
  endDate: string;
  propertyTitle: string;
  tenantName: string;
  landlordName: string;
  isSigned: boolean;
  signatureCount: number;
}

interface PropertyOption {
  id: string;
  title: string;
  monthlyRent: number;
  depositAmount: number | null;
  status: string;
}

interface TenantResult {
  id: string;
  fullName: string;
  maskedTckn: string;
  phone: string;
  roles: string[];
}

const statusMap: Record<string, { text: string; cls: string }> = {
  DRAFT: { text: 'Taslak', cls: 'bg-gray-100 text-gray-700' },
  PENDING_SIGNATURES: { text: 'Imza Bekliyor', cls: 'bg-yellow-100 text-yellow-700' },
  ACTIVE: { text: 'Aktif', cls: 'bg-green-100 text-green-700' },
  TERMINATED: { text: 'Feshedildi', cls: 'bg-red-100 text-red-700' },
  EXPIRED: { text: 'Suresi Doldu', cls: 'bg-gray-100 text-gray-500' },
};

export default function ContractsPage() {
  const { tokens, user } = useAuth();
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantResult, setTenantResult] = useState<TenantResult | null>(null);
  const [tenantSearching, setTenantSearching] = useState(false);
  const [tenantError, setTenantError] = useState('');
  const [formData, setFormData] = useState({
    propertyId: '',
    monthlyRent: '',
    depositAmount: '',
    startDate: '',
    endDate: '',
    paymentDayOfMonth: '1',
    landlordIban: '',
    terms: '',
    specialClauses: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isLandlord = user?.roles.includes('LANDLORD');

  const loadContracts = async () => {
    if (!tokens?.accessToken) return;
    try {
      const res = await api<ContractSummary[]>('/api/v1/contracts', { token: tokens.accessToken });
      if (res.status === 'success' && res.data) setContracts(res.data);
    } catch {}
    setLoading(false);
  };

  const loadProperties = async () => {
    if (!tokens?.accessToken) return;
    try {
      const res = await api<PropertyOption[]>('/api/v1/properties/my', { token: tokens.accessToken });
      if (res.status === 'success' && res.data) {
        setProperties(res.data.filter((p: PropertyOption) => p.status === 'ACTIVE'));
      }
    } catch {}
  };

  useEffect(() => {
    loadContracts();
    if (isLandlord) loadProperties();
  }, [tokens?.accessToken]);

  const handlePropertySelect = (propertyId: string) => {
    const prop = properties.find((p) => p.id === propertyId);
    setFormData((prev) => ({
      ...prev,
      propertyId,
      monthlyRent: prop ? String(prop.monthlyRent) : prev.monthlyRent,
      depositAmount: prop?.depositAmount ? String(prop.depositAmount) : prev.depositAmount,
    }));
  };

  const searchTenant = async () => {
    if (!tenantSearch || !/^5\d{9}$/.test(tenantSearch)) {
      setTenantError('Gecerli telefon numarasi girin (5XXXXXXXXX)');
      return;
    }
    setTenantSearching(true);
    setTenantError('');
    setTenantResult(null);
    try {
      const res = await api<TenantResult>(`/api/v1/users/search?phone=${tenantSearch}`, {
        token: tokens!.accessToken,
      });
      if (res.status === 'success' && res.data) {
        setTenantResult(res.data);
      } else {
        setTenantError('Kullanici bulunamadi');
      }
    } catch {
      setTenantError('Arama hatasi');
    } finally {
      setTenantSearching(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantResult) { setFormError('Kiraci secmeniz gerekiyor'); return; }
    if (!formData.propertyId) { setFormError('Mulk secmeniz gerekiyor'); return; }
    if (!/^TR\d{24}$/.test(formData.landlordIban)) { setFormError('Gecerli bir IBAN giriniz (TR + 24 rakam)'); return; }
    setFormError('');
    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        propertyId: formData.propertyId,
        tenantId: tenantResult.id,
        monthlyRent: Number(formData.monthlyRent),
        startDate: formData.startDate,
        endDate: formData.endDate,
        paymentDayOfMonth: Number(formData.paymentDayOfMonth),
        landlordIban: formData.landlordIban,
      };
      if (formData.depositAmount) body.depositAmount = Number(formData.depositAmount);
      if (formData.terms) body.terms = formData.terms;
      if (formData.specialClauses) body.specialClauses = formData.specialClauses;

      const res = await api('/api/v1/contracts', {
        method: 'POST', body, token: tokens!.accessToken,
      });

      if (res.status === 'success') {
        setShowForm(false);
        resetForm();
        await loadContracts();
      } else {
        setFormError((res as any).data?.validation?.[0] || (res as any).data?.message || res.message || 'Hata olustu');
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      propertyId: '', monthlyRent: '', depositAmount: '',
      startDate: '', endDate: '', paymentDayOfMonth: '1',
      landlordIban: '', terms: '', specialClauses: '',
    });
    setTenantResult(null);
    setTenantSearch('');
    setTenantError('');
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Yukleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sozlesmelerim</h1>
        {isLandlord && (
          <button
            onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            {showForm ? 'Iptal' : 'Yeni Sozlesme'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h3 className="font-semibold text-gray-900 text-lg">Yeni Kira Sozlesmesi</h3>

          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{formError}</div>
          )}

          {/* Kiracı Arama */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">Kiraci Ara (Telefon Numarasi)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tenantSearch}
                onChange={(e) => setTenantSearch(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="5XXXXXXXXX"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={searchTenant}
                disabled={tenantSearching}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {tenantSearching ? 'Araniyor...' : 'Ara'}
              </button>
            </div>
            {tenantError && <p className="text-red-600 text-sm">{tenantError}</p>}
            {tenantResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm font-medium text-green-900">Kiraci Bulundu</div>
                <div className="text-sm text-green-700 mt-1">
                  <span className="font-medium">{tenantResult.fullName}</span>
                  <span className="text-green-600 ml-2">({tenantResult.maskedTckn})</span>
                  <span className="text-green-500 ml-2">Tel: {tenantResult.phone}</span>
                </div>
              </div>
            )}
          </div>

          {/* Mülk Seçimi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mulk *</label>
            <select
              value={formData.propertyId}
              onChange={(e) => handlePropertySelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">Mulk secin...</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} — {p.monthlyRent.toLocaleString('tr-TR')} TL/ay
                </option>
              ))}
            </select>
            {properties.length === 0 && (
              <p className="text-xs text-orange-500 mt-1">
                Henuz aktif mulkunuz yok. Once Mulkler sayfasindan mulk ekleyin.
              </p>
            )}
          </div>

          {/* Tarih ve Kira */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Baslangic Tarihi *</label>
              <input
                type="date" value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bitis Tarihi *</label>
              <input
                type="date" value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aylik Kira (TL) *</label>
              <input
                type="number" value={formData.monthlyRent}
                onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Depozito (TL)</label>
              <input
                type="number" value={formData.depositAmount}
                onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Odeme Gunu (1-28) *</label>
              <input
                type="number" min="1" max="28" value={formData.paymentDayOfMonth}
                onChange={(e) => setFormData({ ...formData, paymentDayOfMonth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Ev Sahibi IBAN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ev Sahibi IBAN *</label>
            <input
              type="text"
              value={formData.landlordIban}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 26);
                setFormData({ ...formData, landlordIban: val });
              }}
              placeholder="TR000000000000000000000000"
              maxLength={26}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Kira odemelerinin yapilacagi IBAN (TR ile baslamali, 26 karakter)
            </p>
            {formData.landlordIban && !/^TR\d{24}$/.test(formData.landlordIban) && (
              <p className="text-xs text-red-500 mt-1">IBAN TR ile baslamali ve toplam 26 karakter olmalidir</p>
            )}
          </div>

          {/* Ek Şartlar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sozlesme Sartlari</label>
            <textarea
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              rows={3} placeholder="Genel sozlesme sartlari..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ozel Maddeler</label>
            <textarea
              value={formData.specialClauses}
              onChange={(e) => setFormData({ ...formData, specialClauses: e.target.value })}
              rows={2} placeholder="Ozel maddeler..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Özet */}
          {formData.propertyId && tenantResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <div className="font-medium text-blue-900 mb-2">Sozlesme Ozeti</div>
              <div className="text-blue-700 space-y-1">
                <div>Mulk: {properties.find((p) => p.id === formData.propertyId)?.title}</div>
                <div>Kiraci: {tenantResult.fullName}</div>
                <div>Kira: {Number(formData.monthlyRent || 0).toLocaleString('tr-TR')} TL/ay</div>
                {formData.depositAmount && <div>Depozito: {Number(formData.depositAmount).toLocaleString('tr-TR')} TL</div>}
                <div>Sure: {formData.startDate} — {formData.endDate}</div>
                <div>Odeme Gunu: Her ayin {formData.paymentDayOfMonth}. gunu</div>
                {formData.landlordIban && <div>IBAN: {formData.landlordIban}</div>}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !tenantResult || !formData.propertyId}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Olusturuluyor...' : 'Sozlesme Olustur'}
          </button>
        </form>
      )}

      {contracts.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-gray-400 text-lg">Henuz sozlesmeniz yok</div>
          {isLandlord && (
            <p className="text-gray-500 text-sm mt-2">
              Yeni Sozlesme butonuna tiklayarak kira sozlesmesi olusturabilirsiniz.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/contracts/${c.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{c.propertyTitle}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusMap[c.status]?.cls || ''}`}>
                      {statusMap[c.status]?.text || c.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Kiraci: {c.tenantName} | Ev Sahibi: {c.landlordName}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {c.startDate} — {c.endDate}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">
                    {c.monthlyRent.toLocaleString('tr-TR')} TL
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Imza: {c.signatureCount}/2 {c.isSigned ? '(Imzaladim)' : ''}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

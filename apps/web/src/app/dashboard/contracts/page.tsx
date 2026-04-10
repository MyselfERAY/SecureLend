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
  DRAFT: { text: 'Taslak', cls: 'bg-slate-500/20 text-slate-400' },
  PENDING_SIGNATURES: { text: 'Imza Bekliyor', cls: 'bg-yellow-500/20 text-yellow-400' },
  ACTIVE: { text: 'Aktif', cls: 'bg-emerald-500/20 text-emerald-400' },
  TERMINATED: { text: 'Feshedildi', cls: 'bg-red-500/20 text-red-400' },
  EXPIRED: { text: 'Suresi Doldu', cls: 'bg-slate-500/20 text-slate-500' },
};

type TabKey = 'active' | 'archive';

const ACTIVE_STATUSES = ['DRAFT', 'PENDING_SIGNATURES', 'ACTIVE'];
const ARCHIVE_STATUSES = ['TERMINATED', 'EXPIRED'];

export default function ContractsPage() {
  const { tokens, user } = useAuth();
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('active');

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
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const loadProperties = async () => {
    if (!tokens?.accessToken) return;
    try {
      const res = await api<PropertyOption[]>('/api/v1/properties/my', { token: tokens.accessToken });
      if (res.status === 'success' && res.data) {
        setProperties(res.data.filter((p: PropertyOption) => p.status === 'ACTIVE'));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadContracts();
    if (isLandlord) loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const activeContracts = contracts.filter((c) => ACTIVE_STATUSES.includes(c.status));
  const archiveContracts = contracts.filter((c) => ARCHIVE_STATUSES.includes(c.status));
  const filteredContracts = activeTab === 'active' ? activeContracts : archiveContracts;

  const inputCls = 'w-full rounded-lg border border-slate-600 bg-[#0a1628] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
  const labelCls = 'mb-1.5 block text-sm font-medium text-slate-300';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Sozlesmelerim</h1>
        {isLandlord && (
          <button
            onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              showForm
                ? 'border border-slate-600 text-slate-300 hover:bg-slate-700/50'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {showForm ? 'Iptal' : 'Yeni Sozlesme'}
          </button>
        )}
      </div>

      {/* Tabs */}
      {contracts.length > 0 && (
        <div className="flex gap-1 rounded-lg border border-slate-700/50 bg-[#0a1628] p-1">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === 'active'
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
            }`}
          >
            Aktif Sozlesmeler
            {activeContracts.length > 0 && (
              <span className="ml-2 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-400">{activeContracts.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === 'archive'
                ? 'bg-slate-600/20 text-slate-300'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
            }`}
          >
            Arsiv
            {archiveContracts.length > 0 && (
              <span className="ml-2 rounded-full bg-slate-500/20 px-2 py-0.5 text-xs font-semibold text-slate-400">{archiveContracts.length}</span>
            )}
          </button>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 space-y-5">
          <h3 className="text-lg font-semibold text-white">Yeni Kira Sozlesmesi</h3>

          {formError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{formError}</div>
          )}

          {/* Tenant search */}
          <div className="rounded-lg border border-slate-700/50 bg-[#0a1628]/50 p-4 space-y-3">
            <label className={labelCls}>Kiraci Ara (Telefon Numarasi)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tenantSearch}
                onChange={(e) => setTenantSearch(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="5XXXXXXXXX"
                className={inputCls}
              />
              <button
                type="button"
                onClick={searchTenant}
                disabled={tenantSearching}
                className="shrink-0 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50"
              >
                {tenantSearching ? 'Araniyor...' : 'Ara'}
              </button>
            </div>
            {tenantError && <p className="text-sm text-red-400">{tenantError}</p>}
            {tenantResult && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                <div className="text-sm font-medium text-emerald-400">Kiraci Bulundu</div>
                <div className="mt-1 text-sm text-emerald-300/80">
                  <span className="font-medium">{tenantResult.fullName}</span>
                  <span className="ml-2 text-emerald-400/60">({tenantResult.maskedTckn})</span>
                  <span className="ml-2 text-emerald-400/60">Tel: {tenantResult.phone}</span>
                </div>
              </div>
            )}
          </div>

          {/* Property select */}
          <div>
            <label className={labelCls}>Mulk *</label>
            <select
              value={formData.propertyId}
              onChange={(e) => handlePropertySelect(e.target.value)}
              className={inputCls}
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
              <p className="mt-1 text-xs text-yellow-400">
                Henuz aktif mulkunuz yok. Once Mulkler sayfasindan mulk ekleyin.
              </p>
            )}
          </div>

          {/* Date and rent fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Baslangic Tarihi *</label>
              <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Bitis Tarihi *</label>
              <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Aylik Kira (TL) *</label>
              <input type="number" value={formData.monthlyRent} onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Depozito (TL)</label>
              <input type="number" value={formData.depositAmount} onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Odeme Gunu (1-28) *</label>
              <input type="number" min="1" max="28" value={formData.paymentDayOfMonth} onChange={(e) => setFormData({ ...formData, paymentDayOfMonth: e.target.value })} className={inputCls} required />
            </div>
          </div>

          {/* IBAN */}
          <div>
            <label className={labelCls}>Ev Sahibi IBAN *</label>
            <input
              type="text"
              value={formData.landlordIban}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 26);
                setFormData({ ...formData, landlordIban: val });
              }}
              placeholder="TR000000000000000000000000"
              maxLength={26}
              className={`${inputCls} font-mono`}
              required
            />
            <p className="mt-1 text-xs text-slate-500">TR ile baslamali, 26 karakter</p>
            {formData.landlordIban && !/^TR\d{24}$/.test(formData.landlordIban) && (
              <p className="mt-1 text-xs text-red-400">IBAN TR ile baslamali ve toplam 26 karakter olmalidir</p>
            )}
          </div>

          {/* Terms */}
          <div>
            <label className={labelCls}>Sozlesme Sartlari</label>
            <textarea value={formData.terms} onChange={(e) => setFormData({ ...formData, terms: e.target.value })} rows={3} placeholder="Genel sozlesme sartlari..." className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Ozel Maddeler</label>
            <textarea value={formData.specialClauses} onChange={(e) => setFormData({ ...formData, specialClauses: e.target.value })} rows={2} placeholder="Ozel maddeler..." className={`${inputCls} resize-none`} />
          </div>

          {/* Summary */}
          {formData.propertyId && tenantResult && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-sm">
              <div className="mb-2 font-medium text-blue-400">Sozlesme Ozeti</div>
              <div className="space-y-1 text-blue-300/80">
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
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Olusturuluyor...' : 'Sozlesme Olustur'}
          </button>
        </form>
      )}

      {/* Contract list */}
      {contracts.length === 0 && !showForm ? (
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-700/50">
            <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-lg font-medium text-slate-300">Henuz sozlesmeniz yok</div>
          {isLandlord && (
            <p className="mt-2 text-sm text-slate-500">
              Yeni Sozlesme butonuna tiklayarak kira sozlesmesi olusturabilirsiniz.
            </p>
          )}
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-700/50">
            {activeTab === 'archive' ? (
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </div>
          <div className="text-base font-medium text-slate-300">
            {activeTab === 'archive' ? 'Arsivde sozlesme yok' : 'Aktif sozlesmeniz yok'}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {activeTab === 'archive'
              ? 'Feshedilen veya suresi dolan sozlesmeler burada gorunecektir.'
              : 'Aktif, taslak veya imza bekleyen sozlesmeleriniz burada gorunecektir.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredContracts.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/contracts/${c.id}`}
              className="block rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 transition hover:border-blue-500/30 hover:bg-[#112240]"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{c.propertyTitle}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusMap[c.status]?.cls || 'bg-slate-500/20 text-slate-400'}`}>
                      {statusMap[c.status]?.text || c.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    Kiraci: {c.tenantName} &middot; Ev Sahibi: {c.landlordName}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {c.startDate} — {c.endDate}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-400">
                    {c.monthlyRent.toLocaleString('tr-TR')} TL
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
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

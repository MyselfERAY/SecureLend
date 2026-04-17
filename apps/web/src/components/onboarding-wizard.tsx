'use client';

import { useState } from 'react';
import { api } from '../lib/api';
import { PROVINCES, DISTRICTS } from '../lib/turkey-locations';
import { PROPERTY_TYPE_OPTIONS, ROOM_COUNT_OPTIONS } from '../lib/property-options';

interface OnboardingWizardProps {
  token: string;
  userName: string;
  onComplete: () => void;
}

type RoleChoice = 'TENANT' | 'LANDLORD' | 'BOTH' | null;

interface PropertyForm {
  title: string;
  addressLine1: string;
  city: string;
  district: string;
  propertyType: string;
  roomCount: string;
  areaM2: string;
  floor: string;
  totalFloors: string;
  monthlyRent: string;
  depositAmount: string;
  uavtCode: string;
}

interface FoundUser {
  id: string;
  fullName: string;
  maskedTckn: string;
  phone: string;
  roles: string[];
}

export default function OnboardingWizard({ token, userName, onComplete }: OnboardingWizardProps) {
  const [introSlide, setIntroSlide] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [role, setRole] = useState<RoleChoice>(null);
  const [propertyAdded, setPropertyAdded] = useState(false);
  const [propertyForm, setPropertyForm] = useState<PropertyForm>({
    title: '',
    addressLine1: '',
    city: '',
    district: '',
    propertyType: 'APARTMENT',
    roomCount: '',
    areaM2: '',
    floor: '',
    totalFloors: '',
    monthlyRent: '',
    depositAmount: '',
    uavtCode: '',
  });
  const [phoneSearch, setPhoneSearch] = useState('');
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [searchDone, setSearchDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<{ role: string; property: string | null; tenant: string | null }>({
    role: '',
    property: null,
    tenant: null,
  });

  const isLandlordFlow = role === 'LANDLORD' || role === 'BOTH';

  const totalSteps = isLandlordFlow ? 4 : 2;
  // Step mapping:
  // TENANT: 1=role, 2=completion
  // LANDLORD/BOTH: 1=role, 2=property, 3=invite tenant, 4=completion

  const getVisualStep = () => {
    if (!isLandlordFlow) {
      return currentStep; // 1 or 2
    }
    return currentStep; // 1, 2, 3, or 4
  };

  const handleRoleSelect = async (selected: RoleChoice) => {
    if (!selected) return;
    setRole(selected);
    setError('');
  };

  const handleRoleContinue = async () => {
    if (!role) return;
    setLoading(true);
    setError('');
    try {
      const rolesToAdd: string[] = [];
      if (role === 'TENANT') rolesToAdd.push('TENANT');
      else if (role === 'LANDLORD') rolesToAdd.push('LANDLORD');
      else if (role === 'BOTH') {
        rolesToAdd.push('TENANT');
        rolesToAdd.push('LANDLORD');
      }

      for (const r of rolesToAdd) {
        await api('/api/v1/users/me/roles', {
          token,
          method: 'POST',
          body: { role: r },
        });
      }

      const roleLabel = role === 'TENANT' ? 'Kiracı' : role === 'LANDLORD' ? 'Ev Sahibi' : 'Kiracı + Ev Sahibi';
      setSummary((prev) => ({ ...prev, role: roleLabel }));

      if (isLandlordFlow) {
        setCurrentStep(2);
      } else {
        // Tenant-only flow, go to completion
        setCurrentStep(2);
      }
    } catch {
      setError('Rol atamasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertySubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        title: propertyForm.title,
        addressLine1: propertyForm.addressLine1,
        city: propertyForm.city,
        district: propertyForm.district,
        propertyType: propertyForm.propertyType,
        monthlyRent: parseFloat(propertyForm.monthlyRent),
      };
      if (propertyForm.roomCount) body.roomCount = propertyForm.roomCount;
      if (propertyForm.areaM2) body.areaM2 = parseFloat(propertyForm.areaM2);
      if (propertyForm.floor) body.floor = parseInt(propertyForm.floor, 10);
      if (propertyForm.totalFloors) body.totalFloors = parseInt(propertyForm.totalFloors, 10);
      if (propertyForm.depositAmount) body.depositAmount = parseFloat(propertyForm.depositAmount);
      if (propertyForm.uavtCode.trim()) body.uavtCode = propertyForm.uavtCode.trim();

      const res = await api('/api/v1/properties', {
        token,
        method: 'POST',
        body,
      });
      if (res.status === 'success') {
        setPropertyAdded(true);
        setSummary((prev) => ({ ...prev, property: propertyForm.title }));
        setCurrentStep(3);
      } else {
        const d = (res as any).data;
        const msg =
          d?.message ||
          (Array.isArray(d?.validation) ? d.validation[0] : null) ||
          (res as any).message ||
          'Mülk eklenirken bir hata oluştu.';
        setError(msg);
      }
    } catch {
      setError('Mülk eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleTenantSearch = async () => {
    if (!phoneSearch || !/^5\d{9}$/.test(phoneSearch)) {
      setError('Geçerli bir telefon numarası girin (5XXXXXXXXX)');
      return;
    }
    setLoading(true);
    setError('');
    setSearchDone(false);
    setFoundUser(null);
    try {
      const res = await api<FoundUser>(`/api/v1/users/search?phone=${phoneSearch}`, {
        token,
      });
      if (res.status === 'success' && res.data) {
        setFoundUser(res.data);
        setSummary((prev) => ({ ...prev, tenant: res.data!.fullName }));
      }
      setSearchDone(true);
    } catch {
      setError('Arama sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await api('/api/v1/users/me/onboarding-complete', {
        token,
        method: 'POST',
        body: {},
      });
      onComplete();
    } catch {
      // Still complete on error - the user should be able to proceed
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  const introSlides = [
    {
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      title: 'Kefil Derdi Bitti',
      description: 'Banka güvencesi kefil yerine geçer. Ev sahibi kirasından emin, kiracı kefilden kurtulur.',
      bullets: ['Kefil arama derdi yok', 'Findeks skoru önemsiz', 'Banka güvencesiyle kiralayın'],
    },
    {
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      title: '5 Dakikada Dijital Sözleşme',
      description: 'TBK uyumlu dijital kira sözleşmesi oluşturun. Noter gereksiz, mahkemede geçerli.',
      bullets: ['Noterci masrafı yok', 'Hukuki olarak geçerli', 'Anlık dijital imza'],
    },
    {
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Otomatik Kira Takibi',
      description: 'Kira ödemeleri otomatik takip edilir. Gecikme bildirimleri, ödeme geçmişi — hepsi tek ekranda.',
      bullets: ['Otomatik ödeme hatırlatma', 'Gecikme takibi', 'Tam ödeme geçmişi'],
    },
  ];

  if (introSlide >= 0) {
    const slide = introSlides[introSlide];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a1628]/95 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-700/50 bg-[#0d1b2a] p-8 text-center">
          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {introSlides.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all ${i === introSlide ? 'w-8 bg-blue-500' : 'w-2 bg-slate-600'}`} />
            ))}
          </div>

          {/* Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600/20">
            <svg className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={slide.icon} />
            </svg>
          </div>

          {/* Content */}
          <h2 className="text-2xl font-bold text-white mb-3">{slide.title}</h2>
          <p className="text-slate-400 mb-6">{slide.description}</p>

          {/* Bullets */}
          <div className="space-y-2 mb-8">
            {slide.bullets.map((b, i) => (
              <div key={i} className="flex items-center justify-center gap-2 text-sm text-slate-300">
                <svg className="h-4 w-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {b}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button onClick={() => setIntroSlide(-1)} className="text-sm text-slate-500 hover:text-slate-300">
              Atla
            </button>
            <button
              onClick={() => introSlide < 2 ? setIntroSlide(introSlide + 1) : setIntroSlide(-1)}
              className="rounded-lg bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {introSlide < 2 ? 'Devam' : 'Başlayalım'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderProgressBar = () => {
    const step = getVisualStep();
    const progress = (step / totalSteps) * 100;
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Adım {step} / {totalSteps}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-700/50">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  const renderRoleSelection = () => (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Hoşgeldiniz, {userName}!</h2>
      <p className="text-slate-400 mb-8">Rolünüzü seçin</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Kiraci */}
        <button
          type="button"
          onClick={() => handleRoleSelect('TENANT')}
          className={`rounded-2xl border p-6 text-left transition-all ${
            role === 'TENANT'
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-700/50 bg-[#0a1628] hover:border-slate-600'
          }`}
        >
          <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
            role === 'TENANT' ? 'bg-blue-500/20' : 'bg-slate-700/50'
          }`}>
            <svg className={`h-6 w-6 ${role === 'TENANT' ? 'text-blue-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div className="font-semibold text-white text-lg mb-1">Kiracıyım</div>
          <p className="text-sm text-slate-400">Kira ödemelerimi yönetmek istiyorum</p>
        </button>

        {/* Ev Sahibi */}
        <button
          type="button"
          onClick={() => handleRoleSelect('LANDLORD')}
          className={`rounded-2xl border p-6 text-left transition-all ${
            role === 'LANDLORD'
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-700/50 bg-[#0a1628] hover:border-slate-600'
          }`}
        >
          <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
            role === 'LANDLORD' ? 'bg-blue-500/20' : 'bg-slate-700/50'
          }`}>
            <svg className={`h-6 w-6 ${role === 'LANDLORD' ? 'text-blue-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div className="font-semibold text-white text-lg mb-1">Ev Sahibiyim</div>
          <p className="text-sm text-slate-400">Mülklerimi ve kiracıları yönetmek istiyorum</p>
        </button>

        {/* Ikisi de */}
        <button
          type="button"
          onClick={() => handleRoleSelect('BOTH')}
          className={`rounded-2xl border p-6 text-left transition-all ${
            role === 'BOTH'
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-700/50 bg-[#0a1628] hover:border-slate-600'
          }`}
        >
          <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
            role === 'BOTH' ? 'bg-blue-500/20' : 'bg-slate-700/50'
          }`}>
            <svg className={`h-6 w-6 ${role === 'BOTH' ? 'text-blue-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div className="font-semibold text-white text-lg mb-1">İkisi de</div>
          <p className="text-sm text-slate-400">Hem kiracı hem ev sahibiyim</p>
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={handleRoleContinue}
          disabled={!role || loading}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Kaydediliyor...' : 'Devam Et'}
        </button>
      </div>
    </div>
  );

  const renderPropertyForm = () => (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">İlk mülkünüzü ekleyin</h2>
      <p className="text-slate-400 mb-8">Mülk bilgilerinizi girin</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Mülk Adı</label>
          <input
            type="text"
            value={propertyForm.title}
            onChange={(e) => setPropertyForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Örn: Kadıköy 2+1 Daire"
            className="w-full rounded-xl border border-slate-700/50 bg-[#0a1628] px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Adres</label>
          <input
            type="text"
            value={propertyForm.addressLine1}
            onChange={(e) => setPropertyForm((prev) => ({ ...prev, addressLine1: e.target.value }))}
            placeholder="Sokak, mahalle, bina no, daire no"
            className="w-full rounded-xl border border-slate-700/50 bg-[#0a1628] px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Şehir</label>
            <select
              value={propertyForm.city}
              onChange={(e) => setPropertyForm((prev) => ({ ...prev, city: e.target.value, district: '' }))}
              className="w-full rounded-xl border border-slate-700/50 bg-[#0a1628] px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Seçin</option>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">İlçe</label>
            <select
              value={propertyForm.district}
              onChange={(e) => setPropertyForm((prev) => ({ ...prev, district: e.target.value }))}
              className="w-full rounded-xl border border-slate-700/50 bg-[#0a1628] px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={!propertyForm.city}
            >
              <option value="">Seçin</option>
              {(DISTRICTS[propertyForm.city] || []).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Mülk Tipi</label>
            <select
              value={propertyForm.propertyType}
              onChange={(e) => setPropertyForm((prev) => ({ ...prev, propertyType: e.target.value }))}
              className="w-full rounded-xl border border-slate-700/50 bg-[#0a1628] px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {PROPERTY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Oda Sayısı</label>
            <select
              value={propertyForm.roomCount}
              onChange={(e) => setPropertyForm((prev) => ({ ...prev, roomCount: e.target.value }))}
              className="w-full rounded-xl border border-slate-700/50 bg-[#0a1628] px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Seçin</option>
              {ROOM_COUNT_OPTIONS.map((rc) => (
                <option key={rc} value={rc}>
                  {rc}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Brüt m2</label>
            <input
              type="number"
              value={propertyForm.areaM2}
              onChange={(e) => setPropertyForm((prev) => ({ ...prev, areaM2: e.target.value }))}
              placeholder="120"
              className="w-full rounded-xl border border-slate-700/50 bg-[#0a1628] px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Bulunduğu Kat</label>
            <input
              type="number"
              value={propertyForm.floor}
              onChange={(e) => setPropertyForm((prev) => ({ ...prev, floor: e.target.value }))}
              placeholder="3"
              className="w-full rounded-xl border border-slate-700/50 bg-[#0a1628] px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Toplam Kat</label>
            <input
              type="number"
              value={propertyForm.totalFloors}
              onChange={(e) => setPropertyForm((prev) => ({ ...prev, totalFloors: e.target.value }))}
              placeholder="7"
              className="w-full rounded-xl border border-slate-700/50 bg-[#0a1628] px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Aylık Kira (TL)</label>
            <input
              type="number"
              value={propertyForm.monthlyRent}
              onChange={(e) => setPropertyForm((prev) => ({ ...prev, monthlyRent: e.target.value }))}
              placeholder="15000"
              className="w-full rounded-xl border border-slate-700/50 bg-[#0a1628] px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Depozito (TL)</label>
            <input
              type="number"
              value={propertyForm.depositAmount}
              onChange={(e) => setPropertyForm((prev) => ({ ...prev, depositAmount: e.target.value }))}
              placeholder="30000"
              className="w-full rounded-xl border border-slate-700/50 bg-[#0a1628] px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            UAVT Kodu <span className="text-slate-500">(opsiyonel — tapu doğrulaması için)</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={propertyForm.uavtCode}
            onChange={(e) => setPropertyForm((prev) => ({ ...prev, uavtCode: e.target.value.replace(/\D/g, '') }))}
            placeholder="12345678"
            maxLength={10}
            className="w-full rounded-xl border border-slate-700/50 bg-[#0a1628] px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-slate-500">8-10 haneli UAVT kodu. Girilirse tapu sahiplik doğrulaması yapılır.</p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => { setError(''); setCurrentStep(1); }}
          className="rounded-xl px-6 py-3 text-sm font-semibold text-slate-400 transition hover:text-white"
        >
          Geri
        </button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => { setCurrentStep(3); }}
            className="text-sm text-slate-500 transition hover:text-slate-300"
          >
            Daha sonra eklerim
          </button>
          <button
            type="button"
            onClick={handlePropertySubmit}
            disabled={loading || !propertyForm.title || !propertyForm.addressLine1 || !propertyForm.city || !propertyForm.district || !propertyForm.monthlyRent}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Ekleniyor...' : 'Mülk Ekle'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderTenantInvite = () => (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Kiracınızı davet edin</h2>
      <p className="text-slate-400 mb-8">Kiracınızın telefon numarasını girerek sisteme davet edin</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Telefon Numarası</label>
          <div className="flex gap-3">
            <div className="flex items-center rounded-xl border border-slate-700/50 bg-[#0a1628] px-4 py-3 text-slate-400">
              +90
            </div>
            <input
              type="text"
              value={phoneSearch}
              onChange={(e) => {
                setPhoneSearch(e.target.value.replace(/\D/g, '').slice(0, 10));
                setSearchDone(false);
                setFoundUser(null);
                setError('');
              }}
              placeholder="5XXXXXXXXX"
              maxLength={10}
              className="flex-1 rounded-xl border border-slate-700/50 bg-[#0a1628] px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleTenantSearch}
              disabled={loading || phoneSearch.length !== 10}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Aranıyor...' : 'Ara'}
            </button>
          </div>
        </div>

        {searchDone && foundUser && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white">{foundUser.fullName}</div>
                <div className="text-sm text-slate-400">
                  TCKN: {foundUser.maskedTckn} &middot; Tel: {foundUser.phone}
                </div>
              </div>
            </div>
          </div>
        )}

        {searchDone && !foundUser && (
          <div className="rounded-2xl border border-slate-700/50 bg-[#0a1628] p-5 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-700/50">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">Kullanıcı bulunamadı. Kiracınız henüz kayıt olmamış olabilir.</p>
          </div>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => { setError(''); setCurrentStep(2); }}
          className="rounded-xl px-6 py-3 text-sm font-semibold text-slate-400 transition hover:text-white"
        >
          Geri
        </button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className="text-sm text-slate-500 transition hover:text-slate-300"
          >
            Daha sonra davet ederim
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Devam Et
          </button>
        </div>
      </div>
    </div>
  );

  const renderCompletion = () => (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
        <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Tebrikler! Hazırsınız</h2>
      <p className="text-slate-400 mb-8">Hesabınız başarıyla ayarlandı</p>

      <div className="mx-auto max-w-md rounded-2xl border border-slate-700/50 bg-[#0a1628] p-6 text-left space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
            <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-white">Rol: <span className="text-blue-400">{summary.role}</span></span>
        </div>

        {summary.property && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-white">Mülk: <span className="text-emerald-400">{summary.property}</span></span>
          </div>
        )}

        {summary.tenant && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-white">Kiracı: <span className="text-emerald-400">{summary.tenant}</span></span>
          </div>
        )}

        {role === 'TENANT' && !summary.property && (
          <p className="text-sm text-slate-400 pt-2">
            Ev sahibiniz sözleşme oluşturduğunda burada görünecek.
          </p>
        )}
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={handleComplete}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Yükleniyor...' : 'Panele Git'}
        </button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    if (!isLandlordFlow) {
      // TENANT flow: step 1 = role, step 2 = completion
      if (currentStep === 1) return renderRoleSelection();
      return renderCompletion();
    }

    // LANDLORD / BOTH flow
    switch (currentStep) {
      case 1: return renderRoleSelection();
      case 2: return renderPropertyForm();
      case 3: return renderTenantInvite();
      case 4: return renderCompletion();
      default: return renderRoleSelection();
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-700/50 bg-[#0d1b2a] p-8 sm:p-10">
        {renderProgressBar()}
        {renderCurrentStep()}
      </div>
    </div>
  );
}

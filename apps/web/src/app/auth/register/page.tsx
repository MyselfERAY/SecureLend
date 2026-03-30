'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    nationalId: '',
    phoneNumber: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Form validasyonu
      if (!formData.fullName.trim()) {
        throw new Error('Ad Soyad alanı gereklidir');
      }
      if (!formData.nationalId.trim()) {
        throw new Error('T.C. Kimlik Numarası gereklidir');
      }
      if (!formData.phoneNumber.trim()) {
        throw new Error('Telefon numarası gereklidir');
      }

      // TCKN formatı kontrolü
      if (formData.nationalId.length !== 11 || !/^\d{11}$/.test(formData.nationalId)) {
        throw new Error('T.C. Kimlik Numarası 11 haneli olmalı ve sadece rakam içermelidir');
      }

      // Telefon numarası formatı kontrolü
      const phoneRegex = /^(\+90|0)?5\d{9}$/;
      if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ''))) {
        throw new Error('Geçerli bir telefon numarası giriniz (örn: +905xxxxxxxxx veya 05xxxxxxxxx)');
      }

      const response = await api.post('/auth/register', formData);
      
      if (response.data && response.data.message) {
        setSuccess(response.data.message);
        // 2 saniye sonra OTP sayfasına yönlendir
        setTimeout(() => {
          router.push(`/auth/verify-otp?phone=${encodeURIComponent(formData.phoneNumber)}`);
        }, 2000);
      } else {
        throw new Error('Kayıt işlemi tamamlandı ancak beklenmeyen bir yanıt alındı');
      }
    } catch (err: any) {
      console.error('Register error:', err);
      
      let errorMessage = 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
      
      if (err.response?.data?.message) {
        // API'den gelen hata mesajı
        errorMessage = err.response.data.message;
      } else if (err.message) {
        // Form validasyon hatası veya diğer hatalar
        errorMessage = err.message;
      } else if (err.response?.status === 409) {
        errorMessage = 'Bu bilgiler ile kayıtlı bir kullanıcı zaten mevcut.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Girdiğiniz bilgileri kontrol ediniz.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // TCKN için sadece rakam girişi
    if (name === 'nationalId') {
      const numericValue = value.replace(/\D/g, '').slice(0, 11);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      return;
    }
    
    // Telefon numarası için formatla
    if (name === 'phoneNumber') {
      let formattedValue = value.replace(/\D/g, '');
      if (formattedValue.startsWith('90')) {
        formattedValue = '+' + formattedValue;
      } else if (formattedValue.startsWith('5') && formattedValue.length <= 10) {
        formattedValue = '+90' + formattedValue;
      } else if (formattedValue.startsWith('0')) {
        formattedValue = '+90' + formattedValue.slice(1);
      }
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Hesap Oluştur
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Kira Güvence sistemine kayıt olun
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Ad Soyad *
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ad Soyad"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700">
                T.C. Kimlik Numarası *
              </label>
              <input
                id="nationalId"
                name="nationalId"
                type="text"
                required
                value={formData.nationalId}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="12345678901"
                maxLength={11}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Telefon Numarası *
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="+905xxxxxxxxx"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Kayıt Olunuyor...
                </div>
              ) : (
                'Kayıt Ol'
              )}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Zaten hesabınız var mı?{' '}
              <button
                type="button"
                onClick={() => router.push('/auth/login')}
                className="font-medium text-blue-600 hover:text-blue-500"
                disabled={isLoading}
              >
                Giriş Yap
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
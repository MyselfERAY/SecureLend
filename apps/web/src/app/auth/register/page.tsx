'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    tckn: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Telefon numarasını formatla
      let formattedPhone = formData.phone;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+90' + formattedPhone.slice(1);
      } else if (!formattedPhone.startsWith('+90')) {
        formattedPhone = '+90' + formattedPhone;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          phone: formattedPhone
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Bir hata oluştu');
      }

      // Başarılı kayıt, OTP sayfasına yönlendir
      router.push(`/auth/verify-otp?userId=${data.userId}&phone=${encodeURIComponent(formattedPhone)}`);
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.message || 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    // Hata mesajını temizle
    if (error) setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Hesap Oluştur
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Kira Güvence sistemi için kaydolun
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
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
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Ad Soyad"
                value={formData.fullName}
                onChange={handleInputChange('fullName')}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="tckn" className="block text-sm font-medium text-gray-700">
                TC Kimlik No *
              </label>
              <input
                id="tckn"
                name="tckn"
                type="text"
                required
                maxLength={11}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="TC Kimlik No (11 haneli)"
                value={formData.tckn}
                onChange={handleInputChange('tckn')}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefon Numarası *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="0532 476 1538"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Kaydediliyor...' : 'Kayıt Ol'}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Zaten hesabınız var mı?{' '}
              <button
                type="button"
                onClick={() => router.push('/auth/login')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Giriş Yapın
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
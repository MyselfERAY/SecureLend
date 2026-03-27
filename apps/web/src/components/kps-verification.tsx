'use client';

import { useState } from 'react';

interface KpsFormData {
  tcNumber: string;
  firstName: string;
  lastName: string;
  birthYear: string;
}

interface VerificationResult {
  isValid: boolean;
  message: string;
}

export default function KpsVerification() {
  const [formData, setFormData] = useState<KpsFormData>({
    tcNumber: '',
    firstName: '',
    lastName: '',
    birthYear: ''
  });
  
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // TC Kimlik No 11 haneli kontrol (mock algoritma)
  const validateTcNumber = (tc: string): boolean => {
    if (tc.length !== 11) return false;
    if (!/^\d{11}$/.test(tc)) return false;
    if (tc[0] === '0') return false;
    
    // Basit checksum kontrolü (gerçek KPS algoritması değil)
    const digits = tc.split('').map(Number);
    const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
    const check1 = ((sum1 * 7) - sum2) % 10;
    const check2 = (digits[0] + digits[1] + digits[2] + digits[3] + digits[4] + digits[5] + digits[6] + digits[7] + digits[8] + digits[9]) % 10;
    
    return check1 === digits[9] && check2 === digits[10];
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setResult(null); // Sonucu temizle
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Form validasyonu
    if (!formData.tcNumber || !formData.firstName || !formData.lastName || !formData.birthYear) {
      setResult({ isValid: false, message: 'Tüm alanlar doldurulmalıdır.' });
      setIsLoading(false);
      return;
    }

    if (!validateTcNumber(formData.tcNumber)) {
      setResult({ isValid: false, message: 'Geçersiz TC Kimlik Numarası.' });
      setIsLoading(false);
      return;
    }

    const currentYear = new Date().getFullYear();
    const birthYear = parseInt(formData.birthYear);
    if (birthYear < 1900 || birthYear > currentYear - 18) {
      setResult({ isValid: false, message: 'Geçersiz doğum yılı.' });
      setIsLoading(false);
      return;
    }

    // Mock KPS kontrolü (2 saniye gecikme)
    setTimeout(() => {
      // Mock başarı/başarısızlık (TC'nin son hanesi çift ise başarılı)
      const lastDigit = parseInt(formData.tcNumber.slice(-1));
      const isValid = lastDigit % 2 === 0;
      
      setResult({
        isValid,
        message: isValid 
          ? 'KPS doğrulaması başarılı!' 
          : 'KPS bilgileri eşleşmiyor.'
      });
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        KPS Kimlik Doğrulama
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="tcNumber" className="block text-sm font-medium text-gray-700 mb-2">
            TC Kimlik Numarası
          </label>
          <input
            type="text"
            id="tcNumber"
            name="tcNumber"
            value={formData.tcNumber}
            onChange={handleInputChange}
            maxLength={11}
            placeholder="11 haneli TC Kimlik No"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
            Ad
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="Adınız"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
            Soyad
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Soyadınız"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="birthYear" className="block text-sm font-medium text-gray-700 mb-2">
            Doğum Yılı
          </label>
          <input
            type="number"
            id="birthYear"
            name="birthYear"
            value={formData.birthYear}
            onChange={handleInputChange}
            min="1900"
            max={new Date().getFullYear() - 18}
            placeholder="YYYY"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Doğrulanıyor...
            </div>
          ) : (
            'Kimlik Doğrula'
          )}
        </button>
      </form>

      {result && (
        <div className="mt-6">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            result.isValid 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              result.isValid ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            {result.message}
          </div>
        </div>
      )}
    </div>
  );
}
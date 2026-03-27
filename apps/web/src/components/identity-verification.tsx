'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface IdentityFormData {
  tcKimlikNo: string;
  ad: string;
  soyad: string;
  dogumYili: string;
}

interface VerificationResult {
  success: boolean;
  valid?: boolean;
  message?: string;
  errors?: any[];
}

export function IdentityVerification() {
  const [formData, setFormData] = useState<IdentityFormData>({
    tcKimlikNo: '',
    ad: '',
    soyad: '',
    dogumYili: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleInputChange = (field: keyof IdentityFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/identity/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          dogumYili: parseInt(formData.dogumYili)
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Ağ hatası oluştu'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.tcKimlikNo.length === 11 && 
                     formData.ad.length >= 2 && 
                     formData.soyad.length >= 2 && 
                     formData.dogumYili.length === 4;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Kimlik Doğrulama</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tcKimlikNo">TC Kimlik No</Label>
            <Input
              id="tcKimlikNo"
              type="text"
              maxLength={11}
              value={formData.tcKimlikNo}
              onChange={(e) => handleInputChange('tcKimlikNo', e.target.value.replace(/\D/g, ''))}
              placeholder="11 haneli TC Kimlik No"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ad">Ad</Label>
            <Input
              id="ad"
              type="text"
              value={formData.ad}
              onChange={(e) => handleInputChange('ad', e.target.value.toUpperCase())}
              placeholder="Adınız"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="soyad">Soyad</Label>
            <Input
              id="soyad"
              type="text"
              value={formData.soyad}
              onChange={(e) => handleInputChange('soyad', e.target.value.toUpperCase())}
              placeholder="Soyadınız"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dogumYili">Doğum Yılı</Label>
            <Input
              id="dogumYili"
              type="text"
              maxLength={4}
              value={formData.dogumYili}
              onChange={(e) => handleInputChange('dogumYili', e.target.value.replace(/\D/g, ''))}
              placeholder="YYYY"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!isFormValid || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Doğrulanıyor...' : 'Kimlik Doğrula'}
          </Button>
        </form>
        
        {result && (
          <div className="mt-4">
            {result.success ? (
              <Alert className={result.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                {result.valid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={result.valid ? 'text-green-700' : 'text-red-700'}>
                  {result.message || (result.valid ? 'Kimlik doğrulama başarılı' : 'Kimlik doğrulama başarısız')}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {result.message || 'Bir hata oluştu'}
                  {result.errors && (
                    <ul className="mt-2 list-disc list-inside">
                      {result.errors.map((error, index) => (
                        <li key={index}>{error.message}</li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
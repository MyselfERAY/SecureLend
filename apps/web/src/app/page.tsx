import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SecureLend - Kira Odeme Platformu',
  description: 'Güvenli kira ödemelerinizi SecureLend ile yapın. KMH entegrasyonu ile hızlı ve kolay fintech çözümleri.',
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            SecureLend - Kira Odeme Platformu
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Türkiye'nin en güvenli kira ödeme platformu. KMH entegrasyonu ile
            hızlı, kolay ve güvenli ödemeler yapın.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Hemen Başla
            </button>
            <button className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold transition-colors">
              Daha Fazla Bilgi
            </button>
          </div>
        </div>
        
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-3">Güvenli Ödemeler</h3>
            <p className="text-gray-600">
              SSL şifrelemesi ve bankacılık standartları ile güvenli ödeme altyapısı.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-3">KMH Entegrasyonu</h3>
            <p className="text-gray-600">
              Merkezi Kayıt Kuruluşu entegrasyonu ile hızlı onay süreçleri.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-3">Kolay Kullanım</h3>
            <p className="text-gray-600">
              Kullanıcı dostu arayüz ile birkaç tıkla kira ödemelerinizi yapın.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
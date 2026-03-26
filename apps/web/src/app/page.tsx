export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            SecureLend - Kira Odeme Platformu
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Turkiye'nin en guvenli kira odeme ve KMH finansman platformu. 
            Kiranizi zamaninda odemek ve KMH kredisi almak artik cok kolay.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
              Hemen Baslayın
            </button>
            <button className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3 px-8 rounded-lg transition-colors">
              Daha Fazla Bilgi
            </button>
          </div>
        </div>
        
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Kira Odeme
            </h3>
            <p className="text-gray-600">
              Kiranizi zamaninda ve guvenli bir sekilde odeyin. Gecikme riski yok.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              KMH Finansman
            </h3>
            <p className="text-gray-600">
              KMH destegiyle uygun faizli kredi imkani. Hizli onay sureci.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Guvenli Platform
            </h3>
            <p className="text-gray-600">
              256-bit SSL sifreleme ile tam guvende. Tum islemler izlenebilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
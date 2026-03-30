import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Header Section */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">SecureLend</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/auth/login" 
              className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Giriş Yap
            </Link>
            <Link 
              href="/auth/register" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Kayıt Ol
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Güvenli ve Hızlı
            <span className="text-blue-600"> Kredi Çözümleri</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            SecureLend ile kredi başvurunuzu kolayca yapın, anında onay alın ve güvenli ödeme planınıza kavuşun.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/auth/register" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors shadow-lg"
            >
              Hemen Başlayın
            </Link>
            <Link 
              href="/credit-check" 
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg text-lg font-medium transition-colors"
            >
              Kredi Durumu Sorgula
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Neden SecureLend?</h3>
            <p className="text-lg text-gray-600">Modern teknoloji ile güvenli ve hızlı kredi deneyimi</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">%100 Güvenli</h4>
              <p className="text-gray-600">Verileriniz son teknoloji şifreleme ile korunur</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Anında Onay</h4>
              <p className="text-gray-600">Yapay zeka destekli hızlı değerlendirme</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Kolay Süreç</h4>
              <p className="text-gray-600">Basit adımlarla kredi başvurunuzu tamamlayın</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Müşteri Yorumları</h3>
            <p className="text-lg text-gray-600">Binlerce memnun müşterimizin deneyimleri</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "SecureLend sayesinde ev kredimi çok hızlı bir şekilde alabildim. Süreç gerçekten çok kolaydı ve güvenilir."
              </p>
              <div className="flex items-center">
                <div className="bg-blue-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  A
                </div>
                <div>
                  <p className="font-semibold">Ahmet Yılmaz</p>
                  <p className="text-sm text-gray-500">İstanbul</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Müşteri hizmetleri çok ilgili, her adımda bize yardımcı oldular. Kesinlikle tavsiye ederim."
              </p>
              <div className="flex items-center">
                <div className="bg-green-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  M
                </div>
                <div>
                  <p className="font-semibold">Merve Kaya</p>
                  <p className="text-sm text-gray-500">Ankara</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Dijital platformu çok kullanışlı. Her şeyi online hallettim, bankaya gitmeme gerek kalmadı."
              </p>
              <div className="flex items-center">
                <div className="bg-purple-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  C
                </div>
                <div>
                  <p className="font-semibold">Can Özkan</p>
                  <p className="text-sm text-gray-500">İzmir</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Hayalinizdeki Krediye Kavuşmaya Hazır Mısınız?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Hemen başvurunuzu yapın ve anında onay alın!
          </p>
          <Link 
            href="/auth/register" 
            className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 rounded-lg text-lg font-medium transition-colors shadow-lg inline-block"
          >
            Şimdi Başvur
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">SecureLend</h4>
              <p className="text-gray-400">
                Güvenli ve hızlı kredi çözümleri ile hayallerinize ulaşın.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Hizmetler</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Kişisel Krediler</li>
                <li>Konut Kredileri</li>
                <li>Araç Kredileri</li>
                <li>İhtiyaç Kredileri</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Destek</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Müşteri Hizmetleri</li>
                <li>SSS</li>
                <li>İletişim</li>
                <li>Yardım Merkezi</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Yasal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Gizlilik Politikası</li>
                <li>Kullanım Koşulları</li>
                <li>KVKK</li>
                <li>Çerez Politikası</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SecureLend. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
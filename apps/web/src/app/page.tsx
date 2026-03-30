export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Mevcut ana sayfa içeriği buraya gelecek */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Kira Güvence</h1>
        <p className="text-lg text-center text-gray-600 mb-8">
          Güvenli kira ödemesi çözümünüz
        </p>
      </div>
      
      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600">
            © 2026 Kira Güvence. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </main>
  );
}
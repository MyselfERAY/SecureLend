export const metadata = {
  title: "Gizlilik Politikası – Kira Güvence",
  description: "KiraGüvence uygulamasının gizlilik politikası ve KVKK kapsamındaki haklarınız.",
};

export default function PrivacyPolicyPage() {
  return (
    <main style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ background: "#0f172a", padding: "24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>
            Kira<span style={{ color: "#3b82f6" }}>Güvence</span>
          </span>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "48px auto", padding: "0 24px 80px" }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 32, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Gizlilik Politikası</h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 40 }}>Son güncelleme: 16 Nisan 2026</p>

          <p style={p}>
            KiraGüvence (&quot;biz&quot;, &quot;uygulama&quot;) olarak kullanıcılarımızın gizliliğine büyük önem veriyoruz.
            Bu politika, <strong>KiraGüvence</strong> mobil uygulaması aracılığıyla topladığımız verileri,
            bu verilerin nasıl kullanıldığını ve korunduğunu açıklamaktadır.
          </p>

          <h2 style={h2}>1. Toplanan Veriler</h2>
          <p style={p}>Uygulamamız aşağıdaki kişisel verileri toplayabilir:</p>
          <ul style={ul}>
            <li style={li}>Ad, soyad ve T.C. kimlik numarası (kimlik doğrulama amacıyla)</li>
            <li style={li}>Telefon numarası ve e-posta adresi</li>
            <li style={li}>IBAN ve ödeme bilgileri (kira ödemeleri için)</li>
            <li style={li}>Mülk ve sözleşme bilgileri</li>
            <li style={li}>Cihaz bilgileri ve uygulama kullanım istatistikleri</li>
          </ul>

          <h2 style={h2}>2. Verilerin Kullanım Amacı</h2>
          <ul style={ul}>
            <li style={li}>Kira ödemelerinin güvenli şekilde gerçekleştirilmesi</li>
            <li style={li}>KMH (Kredili Mevduat Hesabı) başvurularının değerlendirilmesi</li>
            <li style={li}>Kullanıcı hesabının yönetilmesi ve doğrulanması</li>
            <li style={li}>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li style={li}>Müşteri desteği sağlanması</li>
          </ul>

          <h2 style={h2}>3. Verilerin Paylaşımı</h2>
          <p style={p}>Kişisel verileriniz; açık rızanız olmaksızın üçüncü taraflarla paylaşılmaz. İstisnalar:</p>
          <ul style={ul}>
            <li style={li}>Yasal zorunluluk (mahkeme kararı, düzenleyici kurum talebi)</li>
            <li style={li}>Ödeme altyapısı sağlayıcıları (yalnızca işlem için gerekli minimum veri)</li>
            <li style={li}>Anlaşmalı bankacılık ortakları (KMH başvurusu kapsamında)</li>
          </ul>

          <h2 style={h2}>4. Veri Güvenliği</h2>
          <p style={p}>
            Verileriniz endüstri standardı şifreleme (TLS/SSL) ile korunmaktadır.
            TCKN ve hassas kimlik verileri sistemimizde hash&apos;lenerek saklanır; ham hâliyle hiçbir zaman depolanmaz.
          </p>

          <h2 style={h2}>5. Veri Saklama Süresi</h2>
          <p style={p}>
            Kişisel verileriniz, hesabınızın aktif olduğu süre ve yasal saklama yükümlülükleri
            (KVK Kanunu kapsamında en az 5 yıl) boyunca saklanır.
          </p>

          <h2 style={h2}>6. Kullanıcı Hakları (KVKK)</h2>
          <ul style={ul}>
            <li style={li}>Kişisel verilerinize erişim hakkı</li>
            <li style={li}>Yanlış verilerin düzeltilmesini talep etme hakkı</li>
            <li style={li}>Verilerinizin silinmesini talep etme hakkı</li>
            <li style={li}>Veri işlemeye itiraz etme hakkı</li>
          </ul>
          <p style={p}>
            Bu haklarınızı kullanmak için{" "}
            <a href="mailto:info@kiraguvence.com" style={{ color: "#3b82f6" }}>info@kiraguvence.com</a>{" "}
            adresine yazabilirsiniz.
          </p>

          <h2 style={h2}>7. Çerezler ve Analitik</h2>
          <p style={p}>
            Uygulama, performans iyileştirme amacıyla anonim kullanım istatistikleri toplayabilir.
            Bu veriler hiçbir şekilde kişisel tanımlama içermez.
          </p>

          <h2 style={h2}>8. Değişiklikler</h2>
          <p style={p}>
            Bu politika zaman zaman güncellenebilir. Önemli değişikliklerde kullanıcılar
            uygulama içi bildirim ile bilgilendirilir.
          </p>

          <h2 style={h2}>9. İletişim</h2>
          <ul style={ul}>
            <li style={li}>
              E-posta:{" "}
              <a href="mailto:info@kiraguvence.com" style={{ color: "#3b82f6" }}>info@kiraguvence.com</a>
            </li>
            <li style={li}>
              Web:{" "}
              <a href="https://www.kiraguvence.com" style={{ color: "#3b82f6" }}>kiraguvence.com</a>
            </li>
          </ul>
        </div>
      </div>

      <footer style={{ textAlign: "center", fontSize: 13, color: "#9ca3af", padding: "32px 0" }}>
        © 2026 KiraGüvence – Tüm hakları saklıdır.
      </footer>
    </main>
  );
}

// Inline styles
const h2: React.CSSProperties = { fontSize: 18, fontWeight: 600, margin: "32px 0 10px", color: "#0f172a" };
const p: React.CSSProperties = { fontSize: 15, color: "#374151", marginBottom: 10, lineHeight: 1.7 };
const ul: React.CSSProperties = { paddingLeft: 20, marginBottom: 10 };
const li: React.CSSProperties = { fontSize: 15, color: "#374151", marginBottom: 6, lineHeight: 1.7 };

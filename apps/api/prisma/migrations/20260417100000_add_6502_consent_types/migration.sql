-- 6502 Sayili Tuketicinin Korunmasi Hakkinda Kanun ve Mesafeli Sozlesmeler Yonetmeligi uyumu
-- Mesafeli sozlesmelerde zorunlu on bilgilendirme formu ve cayma hakki teyidi icin yeni onay tipleri
ALTER TYPE "consent_type" ADD VALUE IF NOT EXISTS 'ON_BILGILENDIRME_FORMU';
ALTER TYPE "consent_type" ADD VALUE IF NOT EXISTS 'CAYMA_HAKKI_TEYIDI';

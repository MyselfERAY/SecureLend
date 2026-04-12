-- Tenant Reliability Score: Kiracı Ödeme Güvenilirlik Skoru
-- Bu tablo, kiracının ödeme davranışından hesaplanan güvenilirlik skorunu saklar.
-- Mevcut payment_schedules tablosundaki verilerden türetilir.

-- CreateTable
CREATE TABLE "tenant_reliability_score" (
    "id"                      UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id"                 UUID NOT NULL,

    -- Genel skor (0-100)
    "overall_score"           DOUBLE PRECISION NOT NULL DEFAULT 0,

    -- Alt skorlar (toplamları 100 yapar)
    -- Zamanindelik: 40 puan — vade tarihine göre ödeme erkenliği
    "timeliness_score"        DOUBLE PRECISION NOT NULL DEFAULT 0,
    -- Düzenlilik: 40 puan — gecikme/başarısız ödeme oranı
    "regularity_score"        DOUBLE PRECISION NOT NULL DEFAULT 0,
    -- Tutar doğruluğu: 20 puan — tam tutar ödeme oranı
    "amount_accuracy_score"   DOUBLE PRECISION NOT NULL DEFAULT 0,

    -- Ödeme istatistikleri
    "total_payments"          INTEGER NOT NULL DEFAULT 0,
    "completed_payments"      INTEGER NOT NULL DEFAULT 0,
    "on_time_payments"        INTEGER NOT NULL DEFAULT 0,
    "late_payments"           INTEGER NOT NULL DEFAULT 0,
    "partial_payments"        INTEGER NOT NULL DEFAULT 0,
    "overdue_payments"        INTEGER NOT NULL DEFAULT 0,

    -- Ürün katmanı: ev sahibi & kiracı için sonuçlar
    "is_reliable_tenant"      BOOLEAN NOT NULL DEFAULT false,
    "deposit_discount_percent" INTEGER NOT NULL DEFAULT 0,

    "last_calculated_at"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at"              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_reliability_score_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex: kullanıcı başına tek skor kaydı
CREATE UNIQUE INDEX "tenant_reliability_score_user_id_key"
    ON "tenant_reliability_score"("user_id");

-- CreateIndex: skor sıralaması için
CREATE INDEX "idx_tenant_reliability_score"
    ON "tenant_reliability_score"("overall_score" DESC);

-- CreateIndex: güvenilir kiracı filtresi için
CREATE INDEX "idx_tenant_reliable_flag"
    ON "tenant_reliability_score"("is_reliable_tenant")
    WHERE "is_reliable_tenant" = true;

-- AddForeignKey
ALTER TABLE "tenant_reliability_score"
    ADD CONSTRAINT "tenant_reliability_score_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Add TCKN encrypted storage (AES-256-GCM, base64 encoded)
ALTER TABLE "users" ADD COLUMN "tckn_encrypted" VARCHAR(256);

-- Phone ↔ TCKN eşleşmesi (KKB üzerinden doğrulandı mı?)
ALTER TABLE "users" ADD COLUMN "phone_tckn_verified" BOOLEAN NOT NULL DEFAULT FALSE;

-- NVI doğrulaması (TCKN + ad + soyad + doğum yılı eşleşmesi)
ALTER TABLE "users" ADD COLUMN "nvi_verified" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "users" ADD COLUMN "nvi_verified_at" TIMESTAMPTZ;

-- Mevcut kullanıcıları backfill: kps_verified=true olanlar zaten NVI'dan geçmiş sayılsın
UPDATE "users" SET "nvi_verified" = TRUE, "nvi_verified_at" = "created_at"
WHERE "kps_verified" = TRUE;

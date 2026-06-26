-- AddColumn: phone binding + masked phone for anonymous pre-application dedup
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "phone_hash" VARCHAR(128);
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "phone_masked" VARCHAR(20);

-- CreateIndex: support 30-day dedup lookups by phone
CREATE INDEX IF NOT EXISTS "idx_application_phone_hash" ON "applications"("phone_hash");

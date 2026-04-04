-- CreateEnum
CREATE TYPE "consent_type" AS ENUM ('KVKK_AYDINLATMA', 'KVKK_ACIK_RIZA', 'KVKK_ACIK_RIZA_KMH', 'TERMS_OF_SERVICE');

-- CreateTable
CREATE TABLE "consents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "type" "consent_type" NOT NULL,
  "version" VARCHAR(10) NOT NULL,
  "accepted" BOOLEAN NOT NULL DEFAULT true,
  "ip_address" VARCHAR(45),
  "user_agent" VARCHAR(500),
  "accepted_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "consents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX "idx_consent_user_type" ON "consents"("user_id", "type");

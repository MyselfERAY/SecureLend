-- CreateEnum
CREATE TYPE "PromoType" AS ENUM ('FIRST_MONTHS_FREE', 'RENEWAL_DISCOUNT', 'REFERRAL_BONUS', 'LOYALTY_REWARD', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PromoStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "promo_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "type" "PromoType" NOT NULL,
    "description" VARCHAR(500),
    "discount_percent" INTEGER NOT NULL,
    "duration_months" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_auto_apply" BOOLEAN NOT NULL DEFAULT false,
    "max_usage_count" INTEGER,
    "current_usage" INTEGER NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMPTZ,
    "valid_until" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "promo_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_promos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "contract_id" UUID,
    "status" "PromoStatus" NOT NULL DEFAULT 'ACTIVE',
    "remaining_months" INTEGER NOT NULL,
    "activated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,
    "referred_by_user_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_promos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_promo_template_type" ON "promo_templates"("type", "is_active");

-- CreateIndex
CREATE INDEX "idx_user_promo_user_status" ON "user_promos"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_user_promo_template" ON "user_promos"("template_id");

-- AddForeignKey
ALTER TABLE "user_promos" ADD CONSTRAINT "user_promos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_promos" ADD CONSTRAINT "user_promos_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "promo_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_promos" ADD CONSTRAINT "user_promos_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_promos" ADD CONSTRAINT "user_promos_referred_by_user_id_fkey" FOREIGN KEY ("referred_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed: varsayilan promo sablonlari
INSERT INTO "promo_templates" ("id", "name", "type", "description", "discount_percent", "duration_months", "is_active", "is_auto_apply", "updated_at") VALUES
  (gen_random_uuid(), 'Ilk 3 Ay Komisyonsuz', 'FIRST_MONTHS_FREE', 'Yeni kayit olan tum kullanicilar icin ilk 3 ay komisyon alinmaz.', 100, 3, true, true, NOW()),
  (gen_random_uuid(), '12. Ay Komisyonsuz', 'LOYALTY_REWARD', '1 yil boyunca platformu kullanan kullanicilara 12. ay hediye.', 100, 1, true, false, NOW()),
  (gen_random_uuid(), '2. Yil Yenileme Indirimi', 'RENEWAL_DISCOUNT', 'Sozlesmesini yenileyen kullanicilara komisyon oraninda %25 indirim.', 25, 12, true, false, NOW()),
  (gen_random_uuid(), 'Arkadasini Getir', 'REFERRAL_BONUS', 'Davet eden ve davet edilen, her biri 1 ay komisyonsuz.', 100, 1, true, false, NOW());

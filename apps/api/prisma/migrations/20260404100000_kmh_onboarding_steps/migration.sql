-- AlterTable
ALTER TABLE "kmh_applications" ADD COLUMN IF NOT EXISTS "credit_score" INTEGER;
ALTER TABLE "kmh_applications" ADD COLUMN IF NOT EXISTS "debt_to_income_ratio" DECIMAL(5,2);
ALTER TABLE "kmh_applications" ADD COLUMN IF NOT EXISTS "interest_rate" DECIMAL(5,2);
ALTER TABLE "kmh_applications" ADD COLUMN IF NOT EXISTS "monthly_installment" DECIMAL(12,2);
ALTER TABLE "kmh_applications" ADD COLUMN IF NOT EXISTS "offer_accepted" BOOLEAN DEFAULT false;
ALTER TABLE "kmh_applications" ADD COLUMN IF NOT EXISTS "offer_accepted_at" TIMESTAMP(3);
ALTER TABLE "kmh_applications" ADD COLUMN IF NOT EXISTS "kyc_status" VARCHAR(20) DEFAULT 'NOT_STARTED';
ALTER TABLE "kmh_applications" ADD COLUMN IF NOT EXISTS "kyc_id_verified" BOOLEAN DEFAULT false;
ALTER TABLE "kmh_applications" ADD COLUMN IF NOT EXISTS "kyc_selfie_verified" BOOLEAN DEFAULT false;
ALTER TABLE "kmh_applications" ADD COLUMN IF NOT EXISTS "kyc_video_completed" BOOLEAN DEFAULT false;
ALTER TABLE "kmh_applications" ADD COLUMN IF NOT EXISTS "kyc_agreements_signed" BOOLEAN DEFAULT false;
ALTER TABLE "kmh_applications" ADD COLUMN IF NOT EXISTS "existing_customer" BOOLEAN DEFAULT false;
ALTER TABLE "kmh_applications" ADD COLUMN IF NOT EXISTS "evaluation_details" JSONB;

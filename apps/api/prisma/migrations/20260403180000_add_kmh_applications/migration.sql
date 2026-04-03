-- CreateEnum (with IF NOT EXISTS guard for idempotency)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kmh_application_status') THEN
        CREATE TYPE "kmh_application_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employment_status') THEN
        CREATE TYPE "employment_status" AS ENUM ('EMPLOYED', 'SELF_EMPLOYED', 'RETIRED', 'STUDENT', 'UNEMPLOYED');
    END IF;
END $$;

-- CreateTable (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS "kmh_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "employment_status" "employment_status" NOT NULL,
    "monthly_income" DECIMAL(12,2) NOT NULL,
    "employer_name" VARCHAR(200),
    "residential_address" VARCHAR(500) NOT NULL,
    "estimated_rent" DECIMAL(12,2) NOT NULL,
    "status" "kmh_application_status" NOT NULL DEFAULT 'PENDING',
    "approved_limit" DECIMAL(12,2),
    "rejection_reason" VARCHAR(500),
    "bank_reference_no" VARCHAR(50),
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kmh_applications_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "kmh_application_id" UUID;

-- CreateIndex (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "idx_kmh_app_user" ON "kmh_applications"("user_id");

-- CreateIndex (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "idx_kmh_app_status" ON "kmh_applications"("status");

-- CreateIndex (unique constraint on bank_accounts.kmh_application_id)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bank_accounts_kmh_application_id_key') THEN
        CREATE UNIQUE INDEX "bank_accounts_kmh_application_id_key" ON "bank_accounts"("kmh_application_id");
    END IF;
END $$;

-- AddForeignKey (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kmh_applications_user_id_fkey') THEN
        ALTER TABLE "kmh_applications" ADD CONSTRAINT "kmh_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_accounts_kmh_application_id_fkey') THEN
        ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_kmh_application_id_fkey" FOREIGN KEY ("kmh_application_id") REFERENCES "kmh_applications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
END $$;

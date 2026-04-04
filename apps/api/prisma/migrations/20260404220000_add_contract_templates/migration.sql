-- CreateEnum
CREATE TYPE "rent_increase_type" AS ENUM ('TUFE', 'FIXED_RATE', 'NONE');

-- AlterTable: Add contract template fields
ALTER TABLE "contracts" ADD COLUMN "rent_increase_type" "rent_increase_type" NOT NULL DEFAULT 'TUFE';
ALTER TABLE "contracts" ADD COLUMN "rent_increase_rate" DECIMAL(5,2);
ALTER TABLE "contracts" ADD COLUMN "furniture_included" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contracts" ADD COLUMN "pets_allowed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contracts" ADD COLUMN "subletting_allowed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contracts" ADD COLUMN "notice_period_days" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "contracts" ADD COLUMN "document_photo_url" VARCHAR(500);
ALTER TABLE "contracts" ADD COLUMN "document_photo_key" VARCHAR(200);

-- AlterEnum
ALTER TYPE "suggestion_status" ADD VALUE IF NOT EXISTS 'NEW';
ALTER TYPE "suggestion_status" ADD VALUE IF NOT EXISTS 'DEVELOPED';
ALTER TYPE "suggestion_status" ADD VALUE IF NOT EXISTS 'DEPLOYED';

-- Migrate existing DONE rows to DEPLOYED
UPDATE "dev_suggestions" SET "status" = 'DEPLOYED' WHERE "status" = 'DONE';

-- Change default to NEW
ALTER TABLE "dev_suggestions" ALTER COLUMN "status" SET DEFAULT 'NEW'::"suggestion_status";

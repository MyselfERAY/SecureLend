-- Add new values to suggestion_status enum
ALTER TYPE "suggestion_status" ADD VALUE IF NOT EXISTS 'NEW' BEFORE 'PENDING';
ALTER TYPE "suggestion_status" ADD VALUE IF NOT EXISTS 'DEVELOPED' AFTER 'IN_PROGRESS';
ALTER TYPE "suggestion_status" ADD VALUE IF NOT EXISTS 'DEPLOYED' AFTER 'DEVELOPED';

-- Migrate existing DONE rows to DEPLOYED
UPDATE "dev_suggestions" SET "status" = 'DEPLOYED' WHERE "status" = 'DONE';

-- Change default to NEW
ALTER TABLE "dev_suggestions" ALTER COLUMN "status" SET DEFAULT 'NEW';

-- Drop default before changing enum type
ALTER TABLE "dev_suggestions" ALTER COLUMN "status" DROP DEFAULT;

-- Recreate enum with all values (old + new) to avoid ADD VALUE transaction issues
CREATE TYPE "suggestion_status_new" AS ENUM ('NEW', 'PENDING', 'IN_PROGRESS', 'DONE', 'DEVELOPED', 'DEPLOYED', 'REJECTED');

-- Switch column to new enum
ALTER TABLE "dev_suggestions"
  ALTER COLUMN "status" TYPE "suggestion_status_new"
  USING ("status"::text::"suggestion_status_new");

-- Swap types
DROP TYPE "suggestion_status";
ALTER TYPE "suggestion_status_new" RENAME TO "suggestion_status";

-- Migrate data
UPDATE "dev_suggestions" SET "status" = 'DEPLOYED' WHERE "status" = 'DONE';

-- Set new default
ALTER TABLE "dev_suggestions" ALTER COLUMN "status" SET DEFAULT 'NEW';

-- Recreate enum with new values (avoids ALTER TYPE ADD VALUE transaction issues)
ALTER TABLE "dev_suggestions" ALTER COLUMN "status" DROP DEFAULT;

CREATE TYPE "suggestion_status_new" AS ENUM ('NEW', 'PENDING', 'IN_PROGRESS', 'DONE', 'DEVELOPED', 'DEPLOYED', 'REJECTED');

ALTER TABLE "dev_suggestions"
  ALTER COLUMN "status" TYPE "suggestion_status_new"
  USING ("status"::text::"suggestion_status_new");

DROP TYPE "suggestion_status";
ALTER TYPE "suggestion_status_new" RENAME TO "suggestion_status";

-- Migrate existing DONE rows to DEPLOYED
UPDATE "dev_suggestions" SET "status" = 'DEPLOYED' WHERE "status" = 'DONE';

-- Set new default
ALTER TABLE "dev_suggestions" ALTER COLUMN "status" SET DEFAULT 'NEW';

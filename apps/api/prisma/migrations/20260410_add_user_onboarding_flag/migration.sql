ALTER TABLE "users" ADD COLUMN "onboarding_completed" BOOLEAN NOT NULL DEFAULT false;

-- Set onboarding completed for existing users who already have contracts or properties
UPDATE "users" SET "onboarding_completed" = true
WHERE "id" IN (
  SELECT DISTINCT "landlord_id" FROM "contracts"
  UNION
  SELECT DISTINCT "tenant_id" FROM "contracts" WHERE "tenant_id" IS NOT NULL
)
OR "id" IN (
  SELECT DISTINCT "owner_id" FROM "properties"
);

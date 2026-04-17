-- Add dedup_key column (nullable, no unique index yet).
-- Unique index intentionally deferred to a follow-up migration so that
-- column rollout can be verified on production without simultaneously
-- enforcing any constraint.
ALTER TABLE "dev_suggestions"
  ADD COLUMN IF NOT EXISTS "dedup_key" VARCHAR(200);

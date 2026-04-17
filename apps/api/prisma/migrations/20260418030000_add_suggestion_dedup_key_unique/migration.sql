-- Unique index on dedup_key. Postgres allows multiple NULLs under a
-- UNIQUE constraint by default, so existing rows (all NULL) don't
-- conflict; only non-null keys are deduplicated.
-- IF NOT EXISTS makes this idempotent in case onModuleInit raced ahead.
CREATE UNIQUE INDEX IF NOT EXISTS "dev_suggestion_dedup_key_key"
  ON "dev_suggestions" ("dedup_key");

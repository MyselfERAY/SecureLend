-- Safe additive migration: NVI + KKB + UAVT verification fields
-- All new columns are nullable or have safe defaults. No backfill required.
-- IF NOT EXISTS guards make this idempotent (safe re-run).

-- User table: TCKN encrypted, NVI verification, KKB phone-TCKN verification
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tckn_encrypted" VARCHAR(512);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nvi_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nvi_verified_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_tckn_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_tckn_verified_at" TIMESTAMP(3);

-- Property table: UAVT code + verification, ownership verification
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "uavt_code" VARCHAR(20);
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "uavt_verified_at" TIMESTAMP(3);
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "ownership_verified" BOOLEAN NOT NULL DEFAULT false;

-- Add UAVT code and verification timestamp to properties
ALTER TABLE "properties" ADD COLUMN "uavt_code" VARCHAR(10);
ALTER TABLE "properties" ADD COLUMN "uavt_verified_at" TIMESTAMPTZ;

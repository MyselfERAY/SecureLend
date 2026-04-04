-- AlterEnum: add PENDING_ACTIVATION to contract_status
-- (already applied via psql)
-- ALTER TYPE contract_status ADD VALUE IF NOT EXISTS 'PENDING_ACTIVATION' AFTER 'PENDING_SIGNATURES';

-- AlterTable: add uavt_code and bank_activation_ref to contracts
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "uavt_code" VARCHAR(20);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "bank_activation_ref" VARCHAR(100);

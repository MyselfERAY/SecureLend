-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('TENANT', 'LANDLORD');

-- CreateEnum
CREATE TYPE "kyc_status" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "contract_status" AS ENUM ('DRAFT', 'PENDING_SIGNATURES', 'ACTIVE', 'TERMINATED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "payment_order_status" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "bank_account_type" AS ENUM ('KMH', 'STANDARD');

-- CreateEnum
CREATE TYPE "bank_account_status" AS ENUM ('PENDING_OPENING', 'ACTIVE', 'FROZEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "property_status" AS ENUM ('ACTIVE', 'RENTED', 'INACTIVE');

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "user_id" UUID;

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "user_id" UUID;

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tckn_hash" VARCHAR(128) NOT NULL,
    "tckn_masked" VARCHAR(13) NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "email" VARCHAR(255),
    "date_of_birth" DATE,
    "address" VARCHAR(500),
    "roles" "user_role"[] DEFAULT ARRAY[]::"user_role"[],
    "kyc_status" "kyc_status" NOT NULL DEFAULT 'PENDING',
    "kps_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "phone" VARCHAR(20) NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "purpose" VARCHAR(50) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "address_line_1" VARCHAR(300) NOT NULL,
    "address_line_2" VARCHAR(300),
    "city" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "postal_code" VARCHAR(10),
    "property_type" VARCHAR(50) NOT NULL,
    "room_count" VARCHAR(10),
    "area_m2" DECIMAL(8,2),
    "floor" INTEGER,
    "total_floors" INTEGER,
    "monthly_rent" DECIMAL(12,2) NOT NULL,
    "deposit_amount" DECIMAL(12,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TRY',
    "description" TEXT,
    "status" "property_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "landlord_id" UUID NOT NULL,
    "application_id" UUID,
    "status" "contract_status" NOT NULL DEFAULT 'DRAFT',
    "monthly_rent" DECIMAL(12,2) NOT NULL,
    "deposit_amount" DECIMAL(12,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TRY',
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "payment_day_of_month" INTEGER NOT NULL DEFAULT 1,
    "terms" TEXT,
    "special_clauses" TEXT,
    "terminated_at" TIMESTAMP(3),
    "termination_reason" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_signatures" (
    "id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "user_role" NOT NULL,
    "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),

    CONSTRAINT "contract_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_schedules" (
    "id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "due_date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TRY',
    "period_label" VARCHAR(50) NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "paid_amount" DECIMAL(12,2),
    "fail_reason" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "account_number" VARCHAR(26) NOT NULL,
    "account_type" "bank_account_type" NOT NULL,
    "status" "bank_account_status" NOT NULL DEFAULT 'PENDING_OPENING',
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TRY',
    "credit_limit" DECIMAL(12,2),
    "interest_rate" DECIMAL(5,2),
    "opened_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" UUID NOT NULL,
    "from_account_id" UUID,
    "to_account_id" UUID,
    "payment_schedule_id" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TRY',
    "description" VARCHAR(500),
    "reference_no" VARCHAR(36) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_orders" (
    "id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "from_account_id" UUID NOT NULL,
    "to_iban" VARCHAR(26) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TRY',
    "day_of_month" INTEGER NOT NULL,
    "status" "payment_order_status" NOT NULL DEFAULT 'ACTIVE',
    "next_execution_date" DATE NOT NULL,
    "last_executed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_tckn_hash_key" ON "users"("tckn_hash");

-- CreateIndex
CREATE INDEX "idx_user_tckn_hash" ON "users"("tckn_hash");

-- CreateIndex
CREATE INDEX "idx_user_phone" ON "users"("phone");

-- CreateIndex
CREATE INDEX "idx_user_kyc_status" ON "users"("kyc_status");

-- CreateIndex
CREATE INDEX "idx_refresh_token_hash" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "idx_refresh_token_user" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_refresh_token_expires" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "idx_otp_phone_purpose" ON "otp_codes"("phone", "purpose");

-- CreateIndex
CREATE INDEX "idx_otp_expires" ON "otp_codes"("expires_at");

-- CreateIndex
CREATE INDEX "idx_property_owner" ON "properties"("owner_id");

-- CreateIndex
CREATE INDEX "idx_property_location" ON "properties"("city", "district");

-- CreateIndex
CREATE INDEX "idx_property_status" ON "properties"("status");

-- CreateIndex
CREATE INDEX "idx_property_rent" ON "properties"("monthly_rent");

-- CreateIndex
CREATE INDEX "idx_contract_property" ON "contracts"("property_id");

-- CreateIndex
CREATE INDEX "idx_contract_tenant" ON "contracts"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_contract_landlord" ON "contracts"("landlord_id");

-- CreateIndex
CREATE INDEX "idx_contract_status" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "idx_contract_dates" ON "contracts"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "idx_signature_contract" ON "contract_signatures"("contract_id");

-- CreateIndex
CREATE INDEX "idx_signature_user" ON "contract_signatures"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "contract_signatures_contract_id_user_id_key" ON "contract_signatures"("contract_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_payment_schedule_contract" ON "payment_schedules"("contract_id");

-- CreateIndex
CREATE INDEX "idx_payment_schedule_due_date" ON "payment_schedules"("due_date");

-- CreateIndex
CREATE INDEX "idx_payment_schedule_status" ON "payment_schedules"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_account_number_key" ON "bank_accounts"("account_number");

-- CreateIndex
CREATE INDEX "idx_bank_account_user" ON "bank_accounts"("user_id");

-- CreateIndex
CREATE INDEX "idx_bank_account_number" ON "bank_accounts"("account_number");

-- CreateIndex
CREATE INDEX "idx_bank_account_status" ON "bank_accounts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bank_transactions_payment_schedule_id_key" ON "bank_transactions"("payment_schedule_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_transactions_reference_no_key" ON "bank_transactions"("reference_no");

-- CreateIndex
CREATE INDEX "idx_transaction_from" ON "bank_transactions"("from_account_id");

-- CreateIndex
CREATE INDEX "idx_transaction_to" ON "bank_transactions"("to_account_id");

-- CreateIndex
CREATE INDEX "idx_transaction_reference" ON "bank_transactions"("reference_no");

-- CreateIndex
CREATE INDEX "idx_transaction_created" ON "bank_transactions"("created_at");

-- CreateIndex
CREATE INDEX "idx_payment_order_contract" ON "payment_orders"("contract_id");

-- CreateIndex
CREATE INDEX "idx_payment_order_account" ON "payment_orders"("from_account_id");

-- CreateIndex
CREATE INDEX "idx_payment_order_next_exec" ON "payment_orders"("status", "next_execution_date");

-- CreateIndex
CREATE INDEX "idx_application_user" ON "applications"("user_id");

-- CreateIndex
CREATE INDEX "idx_audit_user" ON "audit_logs"("user_id");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_signatures" ADD CONSTRAINT "contract_signatures_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_signatures" ADD CONSTRAINT "contract_signatures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_from_account_id_fkey" FOREIGN KEY ("from_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_to_account_id_fkey" FOREIGN KEY ("to_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_payment_schedule_id_fkey" FOREIGN KEY ("payment_schedule_id") REFERENCES "payment_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_from_account_id_fkey" FOREIGN KEY ("from_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

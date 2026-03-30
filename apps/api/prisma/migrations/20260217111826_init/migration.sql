-- CreateEnum
CREATE TYPE "application_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "tckn_hash" VARCHAR(128) NOT NULL,
    "tckn_masked" VARCHAR(13) NOT NULL,
    "status" "application_status" NOT NULL DEFAULT 'PENDING',
    "credit_limit" DECIMAL(12,2),
    "interest_rate" DECIMAL(5,2),
    "rejection_reason" VARCHAR(500),
    "kkb_score" INTEGER,
    "kps_verified" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID,
    "tckn_masked" VARCHAR(13),
    "metadata" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_application_tckn_hash" ON "applications"("tckn_hash");

-- CreateIndex
CREATE INDEX "idx_application_status" ON "applications"("status");

-- CreateIndex
CREATE INDEX "idx_application_created_at" ON "applications"("created_at");

-- CreateIndex
CREATE INDEX "idx_audit_entity" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_audit_created_at" ON "audit_logs"("created_at");

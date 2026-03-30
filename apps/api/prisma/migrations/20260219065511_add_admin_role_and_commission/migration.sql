-- AlterEnum
ALTER TYPE "user_role" ADD VALUE 'ADMIN';

-- CreateTable
CREATE TABLE "commissions" (
    "id" UUID NOT NULL,
    "payment_schedule_id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "commission_rate" DECIMAL(5,4) NOT NULL,
    "commission_amount" DECIMAL(12,2) NOT NULL,
    "landlord_amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TRY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "commissions_payment_schedule_id_key" ON "commissions"("payment_schedule_id");

-- CreateIndex
CREATE INDEX "idx_commission_contract" ON "commissions"("contract_id");

-- CreateIndex
CREATE INDEX "idx_commission_created" ON "commissions"("created_at");

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_payment_schedule_id_fkey" FOREIGN KEY ("payment_schedule_id") REFERENCES "payment_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

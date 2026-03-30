-- AlterTable
ALTER TABLE "bank_accounts" ADD COLUMN     "contract_id" UUID;

-- CreateIndex
CREATE INDEX "idx_bank_account_contract" ON "bank_accounts"("contract_id");

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

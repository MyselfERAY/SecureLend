-- CreateTable: contract_renewal_reminder_logs
CREATE TABLE IF NOT EXISTS "contract_renewal_reminder_logs" (
  "id"          UUID    NOT NULL DEFAULT gen_random_uuid(),
  "contract_id" UUID    NOT NULL,
  "days_before" INTEGER NOT NULL,
  "sent_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contract_renewal_reminder_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "contract_renewal_reminder_logs_contract_fkey"
    FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_crrl_contract_days"
  ON "contract_renewal_reminder_logs"("contract_id", "days_before");

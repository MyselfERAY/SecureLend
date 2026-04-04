-- CreateEnum
CREATE TYPE "notification_type" AS ENUM (
  'KMH_APPROVED',
  'KMH_REJECTED',
  'KMH_ONBOARDING_COMPLETE',
  'CONTRACT_CREATED',
  'CONTRACT_SIGNED',
  'CONTRACT_ACTIVATED',
  'CONTRACT_TERMINATED',
  'PAYMENT_DUE',
  'PAYMENT_OVERDUE',
  'PAYMENT_COMPLETED',
  'SYSTEM'
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "notification_type" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" VARCHAR(1000) NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "idx_notification_user" ON "notifications"("user_id");
CREATE INDEX "idx_notification_user_read" ON "notifications"("user_id", "is_read");
CREATE INDEX "idx_notification_created" ON "notifications"("created_at");

-- FK
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

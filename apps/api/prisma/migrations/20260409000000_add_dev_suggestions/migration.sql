CREATE TYPE "suggestion_status" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'REJECTED');
CREATE TYPE "suggestion_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE "dev_suggestions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "suggestion_priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "suggestion_status" NOT NULL DEFAULT 'PENDING',
    "agent_notes" TEXT,
    "pr_link" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dev_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_dev_suggestion_status" ON "dev_suggestions"("status");
CREATE INDEX "idx_dev_suggestion_priority" ON "dev_suggestions"("priority");

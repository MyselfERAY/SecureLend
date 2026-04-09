-- CreateEnum: agent_type
CREATE TYPE "agent_type" AS ENUM ('PO', 'MARKETING', 'DEV');

-- CreateEnum: agent_run_status
CREATE TYPE "agent_run_status" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum: po_item_category
CREATE TYPE "po_item_category" AS ENUM ('UX_IMPROVEMENT', 'COMPETITOR_ANALYSIS', 'REGULATION_COMPLIANCE', 'FEATURE_SUGGESTION', 'BUG_REPORT', 'METRIC_SUMMARY');

-- CreateEnum: po_item_status
CREATE TYPE "po_item_status" AS ENUM ('ACTIVE', 'MOVED_TO_DEV', 'DISMISSED');

-- CreateEnum: marketing_report_type
CREATE TYPE "marketing_report_type" AS ENUM ('DAILY_STRATEGY', 'MARKET_ANALYSIS', 'RESEARCH', 'BUSINESS_DEVELOPMENT');

-- CreateEnum: marketing_task_status
CREATE TYPE "marketing_task_status" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum: research_request_status
CREATE TYPE "research_request_status" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable: agent_runs
CREATE TABLE "agent_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agent_type" "agent_type" NOT NULL,
    "status" "agent_run_status" NOT NULL DEFAULT 'RUNNING',
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "token_usage" INTEGER,
    "error_message" TEXT,
    "summary" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_agent_run_type" ON "agent_runs"("agent_type");
CREATE INDEX "idx_agent_run_status" ON "agent_runs"("status");
CREATE INDEX "idx_agent_run_started" ON "agent_runs"("started_at");

-- CreateTable: po_reports
CREATE TABLE "po_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_date" DATE NOT NULL,
    "summary" TEXT NOT NULL,
    "metrics_snapshot" JSONB,
    "agent_run_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "po_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "idx_po_report_date" ON "po_reports"("report_date");
CREATE INDEX "idx_po_report_agent_run" ON "po_reports"("agent_run_id");

-- CreateTable: po_items
CREATE TABLE "po_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "po_report_id" UUID,
    "category" "po_item_category" NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "suggestion_priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "po_item_status" NOT NULL DEFAULT 'ACTIVE',
    "is_dev_task" BOOLEAN NOT NULL DEFAULT false,
    "dev_suggestion_id" UUID,
    "created_by_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "po_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_po_item_report" ON "po_items"("po_report_id");
CREATE INDEX "idx_po_item_category" ON "po_items"("category");
CREATE INDEX "idx_po_item_status" ON "po_items"("status");
CREATE INDEX "idx_po_item_dev_suggestion" ON "po_items"("dev_suggestion_id");

-- CreateTable: marketing_reports
CREATE TABLE "marketing_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "marketing_report_type" NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "content" TEXT NOT NULL,
    "report_date" DATE NOT NULL,
    "agent_run_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_marketing_report_type" ON "marketing_reports"("type");
CREATE INDEX "idx_marketing_report_date" ON "marketing_reports"("report_date");
CREATE INDEX "idx_marketing_report_agent_run" ON "marketing_reports"("agent_run_id");

-- CreateTable: marketing_tasks
CREATE TABLE "marketing_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "marketing_report_id" UUID,
    "source" VARCHAR(50) NOT NULL DEFAULT 'MARKETING',
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT NOT NULL,
    "responsible" VARCHAR(200),
    "target_date" DATE,
    "status" "marketing_task_status" NOT NULL DEFAULT 'TODO',
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_marketing_task_report" ON "marketing_tasks"("marketing_report_id");
CREATE INDEX "idx_marketing_task_status" ON "marketing_tasks"("status");
CREATE INDEX "idx_marketing_task_target_date" ON "marketing_tasks"("target_date");
CREATE INDEX "idx_marketing_task_responsible" ON "marketing_tasks"("responsible");

-- CreateTable: research_requests
CREATE TABLE "research_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "topic" VARCHAR(500) NOT NULL,
    "details" TEXT,
    "status" "research_request_status" NOT NULL DEFAULT 'PENDING',
    "result_report_id" UUID,
    "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "research_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_research_request_status" ON "research_requests"("status");

-- AddForeignKey
ALTER TABLE "po_reports" ADD CONSTRAINT "po_reports_agent_run_id_fkey" FOREIGN KEY ("agent_run_id") REFERENCES "agent_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "po_items" ADD CONSTRAINT "po_items_po_report_id_fkey" FOREIGN KEY ("po_report_id") REFERENCES "po_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "po_items" ADD CONSTRAINT "po_items_dev_suggestion_id_fkey" FOREIGN KEY ("dev_suggestion_id") REFERENCES "dev_suggestions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "marketing_reports" ADD CONSTRAINT "marketing_reports_agent_run_id_fkey" FOREIGN KEY ("agent_run_id") REFERENCES "agent_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "marketing_tasks" ADD CONSTRAINT "marketing_tasks_marketing_report_id_fkey" FOREIGN KEY ("marketing_report_id") REFERENCES "marketing_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "research_requests" ADD CONSTRAINT "research_requests_result_report_id_fkey" FOREIGN KEY ("result_report_id") REFERENCES "marketing_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

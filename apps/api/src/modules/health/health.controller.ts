import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  check() {
    return {
      status: 'success',
      data: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('run-migration')
  @Public()
  async runMigration() {
    const statements = [
      `DO $$ BEGIN CREATE TYPE "agent_type" AS ENUM ('PO', 'MARKETING', 'DEV'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN CREATE TYPE "agent_run_status" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN CREATE TYPE "po_item_category" AS ENUM ('UX_IMPROVEMENT', 'COMPETITOR_ANALYSIS', 'REGULATION_COMPLIANCE', 'FEATURE_SUGGESTION', 'BUG_REPORT', 'METRIC_SUMMARY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN CREATE TYPE "po_item_status" AS ENUM ('ACTIVE', 'MOVED_TO_DEV', 'DISMISSED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN CREATE TYPE "marketing_report_type" AS ENUM ('DAILY_STRATEGY', 'MARKET_ANALYSIS', 'RESEARCH', 'BUSINESS_DEVELOPMENT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN CREATE TYPE "marketing_task_status" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN CREATE TYPE "research_request_status" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    ];

    const tables = [
      `CREATE TABLE IF NOT EXISTS "agent_runs" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "agent_type" "agent_type" NOT NULL, "status" "agent_run_status" NOT NULL DEFAULT 'RUNNING', "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "completed_at" TIMESTAMPTZ, "token_usage" INTEGER, "error_message" TEXT, "summary" TEXT, "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id"))`,
      `CREATE TABLE IF NOT EXISTS "po_reports" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "report_date" DATE NOT NULL, "summary" TEXT NOT NULL, "metrics_snapshot" JSONB, "agent_run_id" UUID, "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "po_reports_pkey" PRIMARY KEY ("id"))`,
      `CREATE TABLE IF NOT EXISTS "po_items" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "po_report_id" UUID, "category" "po_item_category" NOT NULL, "title" VARCHAR(300) NOT NULL, "description" TEXT NOT NULL, "priority" "suggestion_priority" NOT NULL DEFAULT 'MEDIUM', "status" "po_item_status" NOT NULL DEFAULT 'ACTIVE', "is_dev_task" BOOLEAN NOT NULL DEFAULT false, "dev_suggestion_id" UUID, "created_by_admin" BOOLEAN NOT NULL DEFAULT false, "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "po_items_pkey" PRIMARY KEY ("id"))`,
      `CREATE TABLE IF NOT EXISTS "marketing_reports" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "type" "marketing_report_type" NOT NULL, "title" VARCHAR(300) NOT NULL, "content" TEXT NOT NULL, "report_date" DATE NOT NULL, "agent_run_id" UUID, "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "marketing_reports_pkey" PRIMARY KEY ("id"))`,
      `CREATE TABLE IF NOT EXISTS "marketing_tasks" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "marketing_report_id" UUID, "source" VARCHAR(50) NOT NULL DEFAULT 'MARKETING', "title" VARCHAR(300) NOT NULL, "description" TEXT NOT NULL, "responsible" VARCHAR(200), "target_date" DATE, "status" "marketing_task_status" NOT NULL DEFAULT 'TODO', "completed_at" TIMESTAMPTZ, "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "marketing_tasks_pkey" PRIMARY KEY ("id"))`,
      `CREATE TABLE IF NOT EXISTS "research_requests" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "topic" VARCHAR(500) NOT NULL, "details" TEXT, "status" "research_request_status" NOT NULL DEFAULT 'PENDING', "result_report_id" UUID, "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "completed_at" TIMESTAMPTZ, CONSTRAINT "research_requests_pkey" PRIMARY KEY ("id"))`,
    ];

    const indexes = [
      `CREATE INDEX IF NOT EXISTS "idx_agent_run_type" ON "agent_runs"("agent_type")`,
      `CREATE INDEX IF NOT EXISTS "idx_agent_run_status" ON "agent_runs"("status")`,
      `CREATE INDEX IF NOT EXISTS "idx_agent_run_started" ON "agent_runs"("started_at")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_po_report_date" ON "po_reports"("report_date")`,
      `CREATE INDEX IF NOT EXISTS "idx_po_item_report" ON "po_items"("po_report_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_po_item_category" ON "po_items"("category")`,
      `CREATE INDEX IF NOT EXISTS "idx_po_item_status" ON "po_items"("status")`,
      `CREATE INDEX IF NOT EXISTS "idx_marketing_report_type" ON "marketing_reports"("type")`,
      `CREATE INDEX IF NOT EXISTS "idx_marketing_report_date" ON "marketing_reports"("report_date")`,
      `CREATE INDEX IF NOT EXISTS "idx_marketing_task_status" ON "marketing_tasks"("status")`,
      `CREATE INDEX IF NOT EXISTS "idx_marketing_task_target_date" ON "marketing_tasks"("target_date")`,
      `CREATE INDEX IF NOT EXISTS "idx_research_request_status" ON "research_requests"("status")`,
    ];

    const fks = [
      `DO $$ BEGIN ALTER TABLE "po_reports" ADD CONSTRAINT "po_reports_agent_run_id_fkey" FOREIGN KEY ("agent_run_id") REFERENCES "agent_runs"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN ALTER TABLE "po_items" ADD CONSTRAINT "po_items_po_report_id_fkey" FOREIGN KEY ("po_report_id") REFERENCES "po_reports"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN ALTER TABLE "po_items" ADD CONSTRAINT "po_items_dev_suggestion_id_fkey" FOREIGN KEY ("dev_suggestion_id") REFERENCES "dev_suggestions"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN ALTER TABLE "marketing_reports" ADD CONSTRAINT "marketing_reports_agent_run_id_fkey" FOREIGN KEY ("agent_run_id") REFERENCES "agent_runs"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN ALTER TABLE "marketing_tasks" ADD CONSTRAINT "marketing_tasks_marketing_report_id_fkey" FOREIGN KEY ("marketing_report_id") REFERENCES "marketing_reports"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN ALTER TABLE "research_requests" ADD CONSTRAINT "research_requests_result_report_id_fkey" FOREIGN KEY ("result_report_id") REFERENCES "marketing_reports"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    ];

    const results: string[] = [];
    const all = [...statements, ...tables, ...indexes, ...fks];
    for (const sql of all) {
      try {
        await this.prisma.$executeRawUnsafe(sql);
        results.push('OK');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push(`WARN: ${msg.slice(0, 100)}`);
      }
    }

    return { status: 'success', data: { executed: all.length, results } };
  }
}

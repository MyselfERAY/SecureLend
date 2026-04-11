-- AlterEnum: add HEALTH and ARTICLE to agent_type
ALTER TYPE "agent_type" ADD VALUE IF NOT EXISTS 'HEALTH';
ALTER TYPE "agent_type" ADD VALUE IF NOT EXISTS 'ARTICLE';

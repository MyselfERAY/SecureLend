-- Add image_url column for screenshot uploads
ALTER TABLE "dev_suggestions" ADD COLUMN "image_url" TEXT;

-- Add completed_at for tracking completion time
ALTER TABLE "dev_suggestions" ADD COLUMN "completed_at" TIMESTAMPTZ;

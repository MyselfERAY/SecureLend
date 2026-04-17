-- CreateTable: invite_tokens
CREATE TABLE IF NOT EXISTS "invite_tokens" (
  "id"                  UUID NOT NULL DEFAULT gen_random_uuid(),
  "token"               VARCHAR(64) NOT NULL,
  "full_name"           VARCHAR(200) NOT NULL,
  "email"               VARCHAR(255),
  "phone"               VARCHAR(20),
  "note"                TEXT,
  "used"                BOOLEAN NOT NULL DEFAULT false,
  "used_at"             TIMESTAMP(3),
  "used_by_user_id"     UUID,
  "created_by_admin_id" UUID NOT NULL,
  "expires_at"          TIMESTAMP(3) NOT NULL,
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invite_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invite_tokens_token_key" UNIQUE ("token"),
  CONSTRAINT "invite_tokens_used_by_user_id_fkey"
    FOREIGN KEY ("used_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "invite_tokens_created_by_admin_id_fkey"
    FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "invite_tokens_token_idx" ON "invite_tokens"("token");
CREATE INDEX IF NOT EXISTS "invite_tokens_admin_idx" ON "invite_tokens"("created_by_admin_id");

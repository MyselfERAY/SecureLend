CREATE TABLE IF NOT EXISTS payment_reminder_prefs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  channel_sms BOOLEAN NOT NULL DEFAULT FALSE,
  channel_email BOOLEAN NOT NULL DEFAULT TRUE,
  remind_7_days BOOLEAN NOT NULL DEFAULT TRUE,
  remind_3_days BOOLEAN NOT NULL DEFAULT TRUE,
  remind_1_day BOOLEAN NOT NULL DEFAULT TRUE,
  overdue_reminder BOOLEAN NOT NULL DEFAULT TRUE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payment_reminder_prefs_pkey PRIMARY KEY (id),
  CONSTRAINT payment_reminder_prefs_user_id_key UNIQUE (user_id),
  CONSTRAINT payment_reminder_prefs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payment_reminder_prefs_user
  ON payment_reminder_prefs (user_id);

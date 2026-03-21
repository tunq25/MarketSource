-- Email verification + withdrawal idempotency (PostgreSQL)

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMPTZ;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_token" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_expires" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "idx_users_email_verification_token"
  ON "users" ("email_verification_token")
  WHERE "email_verification_token" IS NOT NULL;

-- Existing accounts: coi như đã xác minh (tránh khóa toàn bộ user cũ)
UPDATE "users"
SET "email_verified_at" = COALESCE("email_verified_at", "created_at")
WHERE "email_verified_at" IS NULL;

ALTER TABLE "withdrawals" ADD COLUMN IF NOT EXISTS "idempotency_key" VARCHAR(128);

CREATE UNIQUE INDEX IF NOT EXISTS "withdrawals_user_idempotency_unique"
  ON "withdrawals" ("user_id", "idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;

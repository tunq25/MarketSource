-- ============================================================
-- Migration: add user_profiles table + 2FA columns
-- Run: psql "$DATABASE_URL" -f database/migrations/2025-11-20-add-user-profiles.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(120),
  country VARCHAR(120),
  postal_code VARCHAR(32),
  social_links JSONB,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  two_factor_backup_codes TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

COMMENT ON TABLE user_profiles IS 'Extended profile attributes + 2FA data';


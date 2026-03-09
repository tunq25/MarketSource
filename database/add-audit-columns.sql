-- ============================================================
-- PostgreSQL migration: Đồng bộ cột audit (created_at / updated_at / deleted_at)
-- Chạy: psql $DATABASE_URL -f database/add-audit-columns.sql
-- ============================================================

-- Helper: thêm cột nếu chưa tồn tại
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    -- Thêm deleted_at
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = tbl AND column_name = 'deleted_at'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN deleted_at TIMESTAMP NULL;', tbl);
    END IF;

    -- Thêm updated_at
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = tbl AND column_name = 'updated_at'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;', tbl);
    END IF;
  END LOOP;
END $$;

-- Bảng cụ thể cần đảm bảo created_at có default
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deposits' AND column_name='created_at') THEN
    ALTER TABLE deposits ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='created_at') THEN
    ALTER TABLE transactions ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Trigger function cập nhật updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Áp dụng trigger cho các bảng quan trọng
DO $$
DECLARE
  r RECORD;
  tables TEXT[] := ARRAY[
    'users','products','deposits','withdrawals','transactions',
    'purchases','reviews','chats','wishlists','notifications','admin'
  ];
BEGIN
  FOREACH r IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;', r, r);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
       r, r
    );
  END LOOP;
END $$;

-- Index bổ sung
CREATE INDEX IF NOT EXISTS idx_transactions_status_created ON transactions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_chats_user_created ON chats(user_id, created_at);

SELECT '✅ Audit columns & triggers synced for PostgreSQL' AS status;


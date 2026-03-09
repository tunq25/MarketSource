-- ============================================================
-- MIGRATION SCRIPT: Fix schema inconsistencies
-- Chạy script này để update database hiện có
-- ============================================================

-- 1. Thêm các cột thiếu vào bảng users
DO $$ 
BEGIN
  -- Thêm cột name nếu chưa có
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'name') THEN
    ALTER TABLE users ADD COLUMN name VARCHAR(255);
  END IF;

  -- Thêm cột avatar_url nếu chưa có
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
    ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
  END IF;

  -- Thêm cột ip_address nếu chưa có
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'ip_address') THEN
    ALTER TABLE users ADD COLUMN ip_address VARCHAR(45);
  END IF;

  -- Thêm cột role nếu chưa có
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'role') THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- 2. Fix tên cột trong bảng deposits (camelCase -> snake_case)
DO $$ 
BEGIN
  -- Đổi userEmail -> user_email
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'deposits' AND column_name = 'userEmail') THEN
    ALTER TABLE deposits RENAME COLUMN "userEmail" TO user_email;
  END IF;

  -- Đổi userName -> user_name
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'deposits' AND column_name = 'userName') THEN
    ALTER TABLE deposits RENAME COLUMN "userName" TO user_name;
  END IF;

  -- Đổi transactionId -> transaction_id
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'deposits' AND column_name = 'transactionId') THEN
    ALTER TABLE deposits RENAME COLUMN "transactionId" TO transaction_id;
  END IF;

  -- Đổi approvedTime -> approved_time
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'deposits' AND column_name = 'approvedTime') THEN
    ALTER TABLE deposits RENAME COLUMN "approvedTime" TO approved_time;
  END IF;

  -- Đổi approvedBy -> approved_by
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'deposits' AND column_name = 'approvedBy') THEN
    ALTER TABLE deposits RENAME COLUMN "approvedBy" TO approved_by;
  END IF;
END $$;

-- 3. Fix tên cột trong bảng withdrawals (nếu có camelCase)
DO $$ 
BEGIN
  -- Đổi userEmail -> user_email
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'withdrawals' AND column_name = 'userEmail') THEN
    ALTER TABLE withdrawals RENAME COLUMN "userEmail" TO user_email;
  END IF;

  -- Đổi userName -> user_name
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'withdrawals' AND column_name = 'userName') THEN
    ALTER TABLE withdrawals RENAME COLUMN "userName" TO user_name;
  END IF;
END $$;

-- 4. Tạo bảng reviews nếu chưa có
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE (user_id, product_id)
);

-- Indexes cho reviews
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- 5. Tạo bảng product_ratings nếu chưa có
CREATE TABLE IF NOT EXISTS product_ratings (
  product_id INT PRIMARY KEY,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Indexes cho product_ratings
CREATE INDEX IF NOT EXISTS idx_product_ratings_average_rating ON product_ratings(average_rating);

-- Function để tự động update product_ratings khi có review mới
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO product_ratings (product_id, average_rating, total_ratings, updated_at)
  SELECT 
    product_id,
    ROUND(AVG(rating)::numeric, 2) as average_rating,
    COUNT(*) as total_ratings,
    CURRENT_TIMESTAMP
  FROM reviews
  WHERE product_id = NEW.product_id
  GROUP BY product_id
  ON CONFLICT (product_id) 
  DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_ratings = EXCLUDED.total_ratings,
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger để tự động update product_ratings
DROP TRIGGER IF EXISTS trigger_update_product_rating ON reviews;
CREATE TRIGGER trigger_update_product_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();

-- 6. Update index cho deposits nếu cần
DO $$ 
BEGIN
  -- Xóa index cũ nếu có
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_deposits_transactionId') THEN
    DROP INDEX idx_deposits_transactionId;
  END IF;
  
  -- Tạo index mới
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_deposits_transaction_id') THEN
    CREATE INDEX idx_deposits_transaction_id ON deposits(transaction_id);
  END IF;
END $$;

-- ============================================================
-- HOÀN TẤT MIGRATION
-- ============================================================
-- Kiểm tra kết quả:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'users' ORDER BY ordinal_position;
-- 
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'deposits' ORDER BY ordinal_position;
-- 
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'reviews' ORDER BY ordinal_position;
-- ============================================================


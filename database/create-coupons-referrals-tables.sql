-- Migration: Create coupons and referrals tables for MySQL
-- Date: 2025-01-XX

-- ============================================================
-- 1. COUPONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255),
  title VARCHAR(255),
  description TEXT,
  discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
  discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  min_purchase_amount DECIMAL(15, 2) DEFAULT 0,
  max_discount_amount DECIMAL(15, 2) NULL,
  usage_limit INT NULL COMMENT 'Giới hạn số lần sử dụng, NULL = không giới hạn',
  valid_from DATETIME NULL,
  valid_until DATETIME NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_coupons_code (code),
  INDEX idx_coupons_active (is_active),
  INDEX idx_coupons_valid (valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. USER_COUPONS TABLE (Track which users have used which coupons)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  coupon_id INT NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_coupon (user_id, coupon_id),
  INDEX idx_user_coupons_user (user_id),
  INDEX idx_user_coupons_coupon (coupon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. REFERRALS TABLE (Convert from PostgreSQL to MySQL)
-- ============================================================
CREATE TABLE IF NOT EXISTS referrals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  referrer_id INT NOT NULL COMMENT 'Người giới thiệu',
  referred_id INT NOT NULL COMMENT 'Người được giới thiệu',
  commission_percent DECIMAL(5, 2) DEFAULT 10.00 COMMENT 'Phần trăm hoa hồng',
  total_earnings DECIMAL(15, 2) DEFAULT 0 COMMENT 'Tổng hoa hồng đã kiếm được',
  status VARCHAR(50) DEFAULT 'pending' COMMENT 'pending, approved, paid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_referral (referrer_id, referred_id),
  INDEX idx_referrals_referrer (referrer_id),
  INDEX idx_referrals_referred (referred_id),
  INDEX idx_referrals_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. ADD REFERRAL_CODE COLUMN TO USERS TABLE (if not exists)
-- ============================================================
-- MySQL không hỗ trợ IF NOT EXISTS trong ALTER TABLE, cần check trước
-- Hoặc dùng stored procedure hoặc check trong application code
-- Ở đây dùng cách an toàn: check column tồn tại trước khi add

SET @dbname = DATABASE();
SET @tablename = 'users';
SET @columnname = 'referral_code';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) NULL COMMENT ''Mã giới thiệu của user''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index nếu chưa có
SET @indexname = 'idx_users_referral_code';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  'SELECT 1',
  CONCAT('CREATE INDEX ', @indexname, ' ON ', @tablename, ' (referral_code)')
));
PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

-- ============================================================
-- 5. SAMPLE DATA (Optional - for testing)
-- ============================================================
-- INSERT INTO coupons (code, name, description, discount_type, discount_value, min_purchase_amount, valid_until, is_active)
-- VALUES 
--   ('WELCOME10', 'Chào mừng 10%', 'Giảm 10% cho đơn hàng đầu tiên', 'percentage', 10, 0, DATE_ADD(NOW(), INTERVAL 30 DAY), 1),
--   ('SAVE50K', 'Tiết kiệm 50K', 'Giảm 50,000đ cho đơn hàng từ 500,000đ', 'fixed', 50000, 500000, DATE_ADD(NOW(), INTERVAL 60 DAY), 1);


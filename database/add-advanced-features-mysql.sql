-- ============================================================
-- MySQL Migration: Advanced Features (Analytics, Bundles, Subscriptions, Review Votes)
-- Môi trường: MySQL 8.x, InnoDB, utf8mb4
-- Phụ thuộc: bảng users, products, reviews đã tồn tại (full-mysql-schema-qtusdevmarket.sql)
-- Cách chạy: dùng MySQL Workbench hoặc CLI
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. ANALYTICS EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NULL,
  event_type   VARCHAR(191) NOT NULL,
  event_data   JSON NULL,
  ip_address   VARCHAR(45),
  user_agent   TEXT,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_analytics_events_user
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_analytics_events_user_id (user_id),
  INDEX idx_analytics_events_type (event_type),
  INDEX idx_analytics_events_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. PRODUCT VIEWS
-- ============================================================

CREATE TABLE IF NOT EXISTS product_views (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id    INT NULL,
  ip_address VARCHAR(45),
  viewed_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_views_product
    FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_product_views_user
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_product_views_product_id (product_id),
  INDEX idx_product_views_user_id (user_id),
  INDEX idx_product_views_viewed_at (viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. BUNDLES & BUNDLE_PRODUCTS
-- ============================================================

CREATE TABLE IF NOT EXISTS bundles (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) UNIQUE,
  description TEXT,
  price       DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_bundles_active (is_active),
  INDEX idx_bundles_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bundle_products (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  bundle_id  INT NOT NULL,
  product_id INT NOT NULL,
  CONSTRAINT fk_bundle_products_bundle
    FOREIGN KEY (bundle_id) REFERENCES bundles(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_bundle_products_product
    FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_bundle_product (bundle_id, product_id),
  INDEX idx_bundle_products_bundle_id (bundle_id),
  INDEX idx_bundle_products_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. REVIEW VOTES + helpful_count cho reviews
-- ============================================================

CREATE TABLE IF NOT EXISTS review_votes (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  review_id  INT NOT NULL,
  user_id    INT NOT NULL,
  is_helpful TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_votes_review
    FOREIGN KEY (review_id) REFERENCES reviews(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_review_votes_user
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_review_user (review_id, user_id),
  INDEX idx_review_votes_review_id (review_id),
  INDEX idx_review_votes_user_id (user_id),
  INDEX idx_review_votes_is_helpful (is_helpful)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm cột helpful_count vào reviews nếu chưa có
SET @dbname = DATABASE();
SET @tablename = 'reviews';
SET @columnname = 'helpful_count';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE reviews ADD COLUMN helpful_count INT NOT NULL DEFAULT 0'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================
-- 5. SUBSCRIPTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS subscription_benefits (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  plan             VARCHAR(100) NOT NULL UNIQUE,
  name             VARCHAR(255),
  description      TEXT,
  discount_percent INT NOT NULL DEFAULT 0,
  perks            JSON NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subscription_benefits_plan (plan),
  INDEX idx_subscription_benefits_discount (discount_percent)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscriptions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  plan        VARCHAR(100) NOT NULL,
  status      VARCHAR(50) NOT NULL DEFAULT 'active',
  start_date  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_date    DATETIME NULL,
  meta        JSON NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_subscriptions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_subscriptions_user_id (user_id),
  INDEX idx_subscriptions_plan (plan),
  INDEX idx_subscriptions_status (status),
  INDEX idx_subscriptions_start_date (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

SELECT '✅ MySQL advanced features schema (analytics/bundles/subscriptions/review_votes) ready' AS status;



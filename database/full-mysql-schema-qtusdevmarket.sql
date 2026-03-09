-- ============================================================
-- FULL MySQL schema for QtusDev Market (qtusdevmarket)
-- Dùng cho MySQL 8.x, InnoDB, utf8mb4
-- 
-- Cách dùng trong MySQL Workbench:
-- 1. File > Open SQL Script... chọn file này
-- 2. Bấm nút sét đánh (Execute) để chạy toàn bộ
-- 3. Đảm bảo connection user có quyền CREATE DATABASE / TABLE
-- ============================================================

-- Tạo database nếu chưa có
CREATE DATABASE IF NOT EXISTS qtusdevmarket
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE qtusdevmarket;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  uid             VARCHAR(191) NULL,                 -- nếu sau này sync Firebase UID
  email           VARCHAR(191) NOT NULL UNIQUE,
  username        VARCHAR(191) UNIQUE,
  name            VARCHAR(191),
  password_hash   VARCHAR(255),
  avatar_url      VARCHAR(1000),
  ip_address      VARCHAR(45),
  role            VARCHAR(50) NOT NULL DEFAULT 'user',
  balance         DECIMAL(15,2) NOT NULL DEFAULT 0,
  status          VARCHAR(50) NOT NULL DEFAULT 'active',
  last_activity   TIMESTAMP NULL,
  login_count     INT NOT NULL DEFAULT 0,
  referral_code   VARCHAR(50) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL,
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_username UNIQUE (username),
  INDEX idx_users_email (email),
  INDEX idx_users_username (username),
  INDEX idx_users_role (role),
  INDEX idx_users_status (status),
  INDEX idx_users_referral_code (referral_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  price           DECIMAL(10,2) NOT NULL,
  category        VARCHAR(191),
  demo_url        VARCHAR(1000),
  download_url    VARCHAR(1000),
  file_url        VARCHAR(1000),
  thumbnail       VARCHAR(1000),
  image_url       VARCHAR(1000),
  tags            JSON NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  user_id         INT NULL,                         -- seller / owner
  download_count  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL,
  CONSTRAINT fk_products_user
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_products_category (category),
  INDEX idx_products_is_active (is_active),
  INDEX idx_products_user_id (user_id),
  INDEX idx_products_download_count (download_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DEPOSITS
-- ============================================================

CREATE TABLE IF NOT EXISTS deposits (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  user_email      VARCHAR(191),
  user_name       VARCHAR(191),
  amount          DECIMAL(15,2) NOT NULL,
  method          VARCHAR(191),
  transaction_id  VARCHAR(191),
  status          VARCHAR(50) NOT NULL DEFAULT 'pending',
  timestamp       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL,
  approved_time   TIMESTAMP NULL,
  approved_by     VARCHAR(191),
  CONSTRAINT fk_deposits_user
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_deposits_user_id (user_id),
  INDEX idx_deposits_status (status),
  INDEX idx_deposits_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- WITHDRAWALS
-- ============================================================

CREATE TABLE IF NOT EXISTS withdrawals (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  user_email      VARCHAR(191),
  user_name       VARCHAR(191),
  amount          DECIMAL(15,2) NOT NULL,
  bank_name       VARCHAR(191),
  account_number  VARCHAR(191),
  account_name    VARCHAR(191),
  status          VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL,
  approved_time   TIMESTAMP NULL,
  approved_by     VARCHAR(191),
  CONSTRAINT fk_withdrawals_user
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_withdrawals_user_id (user_id),
  INDEX idx_withdrawals_status (status),
  INDEX idx_withdrawals_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PURCHASES
-- ============================================================

CREATE TABLE IF NOT EXISTS purchases (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  product_id      INT NOT NULL,
  amount          DECIMAL(15,2) NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL,
  CONSTRAINT fk_purchases_user
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_purchases_product
    FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_purchases_user_id (user_id),
  INDEX idx_purchases_product_id (product_id),
  INDEX idx_purchases_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- REVIEWS
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  product_id      INT NOT NULL,
  rating          INT NOT NULL,
  comment         TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL,
  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_product
    FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_reviews_user_product (user_id, product_id),
  INDEX idx_reviews_user_id (user_id),
  INDEX idx_reviews_product_id (product_id),
  INDEX idx_reviews_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CHATS
-- ============================================================

CREATE TABLE IF NOT EXISTS chats (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  admin_id        INT NULL,
  message         TEXT NOT NULL,
  is_admin        TINYINT(1) NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL,
  CONSTRAINT fk_chats_user
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_chats_admin
    FOREIGN KEY (admin_id) REFERENCES users(id)
      ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_chats_user_id (user_id),
  INDEX idx_chats_admin_id (admin_id),
  INDEX idx_chats_is_admin (is_admin),
  INDEX idx_chats_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- WISHLISTS
-- ============================================================

CREATE TABLE IF NOT EXISTS wishlists (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  product_id      INT NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL,
  CONSTRAINT fk_wishlists_user
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_wishlists_product
    FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_wishlists_user_product (user_id, product_id),
  INDEX idx_wishlists_user_id (user_id),
  INDEX idx_wishlists_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  type            VARCHAR(100) NOT NULL,
  title           VARCHAR(255),
  message         TEXT NOT NULL,
  is_read         TINYINT(1) NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL,
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_notifications_user_id (user_id),
  INDEX idx_notifications_is_read (is_read),
  INDEX idx_notifications_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ADMIN TABLE (role mapping)
-- ============================================================

CREATE TABLE IF NOT EXISTS admin (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  role            VARCHAR(100) NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL,
  CONSTRAINT fk_admin_user
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_admin_user_id (user_id),
  INDEX idx_admin_user_id (user_id),
  INDEX idx_admin_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USER_PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  user_id                 INT NOT NULL,
  phone                   VARCHAR(50),
  address                 TEXT,
  city                    VARCHAR(120),
  country                 VARCHAR(120),
  postal_code             VARCHAR(32),
  social_links            JSON,
  two_factor_enabled      TINYINT(1) NOT NULL DEFAULT 0,
  two_factor_secret       TEXT,
  two_factor_backup_codes TEXT,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_user_profiles_user_id (user_id),
  INDEX idx_user_profiles_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PASSWORD RESETS
-- ============================================================

CREATE TABLE IF NOT EXISTS password_resets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  token       VARCHAR(255) NOT NULL UNIQUE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  TIMESTAMP NOT NULL,
  CONSTRAINT fk_password_resets_user
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_password_resets_user_id (user_id),
  INDEX idx_password_resets_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DOWNLOADS + PRODUCT_RATINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS downloads (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  product_id    INT NOT NULL,
  downloaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address    VARCHAR(45),
  user_agent    TEXT,
  CONSTRAINT fk_downloads_user
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_downloads_product
    FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_downloads_user_id (user_id),
  INDEX idx_downloads_product_id (product_id),
  INDEX idx_downloads_downloaded_at (downloaded_at),
  INDEX idx_downloads_user_product_date (user_id, product_id, downloaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_ratings (
  product_id     INT PRIMARY KEY,
  average_rating DECIMAL(4,2) NOT NULL DEFAULT 0,
  total_ratings  INT NOT NULL DEFAULT 0,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_ratings_product
    FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- COUPONS / USER_COUPONS / REFERRALS
-- ============================================================

CREATE TABLE IF NOT EXISTS coupons (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  code                VARCHAR(50) NOT NULL UNIQUE,
  name                VARCHAR(255),
  title               VARCHAR(255),
  description         TEXT,
  discount_type       ENUM('percentage', 'fixed') DEFAULT 'percentage',
  discount_value      DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_purchase_amount DECIMAL(15,2) DEFAULT 0,
  max_discount_amount DECIMAL(15,2) NULL,
  usage_limit         INT NULL,
  valid_from          DATETIME NULL,
  valid_until         DATETIME NULL,
  is_active           TINYINT(1) NOT NULL DEFAULT 1,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_coupons_code (code),
  INDEX idx_coupons_active (is_active),
  INDEX idx_coupons_valid (valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_coupons (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  coupon_id   INT NOT NULL,
  used_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_coupons_user
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_coupons_coupon
    FOREIGN KEY (coupon_id) REFERENCES coupons(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_user_coupon (user_id, coupon_id),
  INDEX idx_user_coupons_user (user_id),
  INDEX idx_user_coupons_coupon (coupon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS referrals (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  referrer_id      INT NOT NULL,
  referred_id      INT NOT NULL,
  commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  total_earnings   DECIMAL(15,2) NOT NULL DEFAULT 0,
  status           VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_referrals_referrer
    FOREIGN KEY (referrer_id) REFERENCES users(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_referrals_referred
    FOREIGN KEY (referred_id) REFERENCES users(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_referral (referrer_id, referred_id),
  INDEX idx_referrals_referrer (referrer_id),
  INDEX idx_referrals_referred (referred_id),
  INDEX idx_referrals_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Done
SELECT '✅ qtusdevmarket MySQL schema ready' AS status;



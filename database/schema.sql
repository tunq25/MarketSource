-- ============================================================
-- MySQL Schema for QtusDev full-stack marketplace
-- Yêu cầu: tất cả bảng dùng UUID, có created_at / updated_at / deleted_at
-- Chạy: mysql -u <user> -p < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS qtusdev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE qtusdev;

-- Helper: bật chế độ kiểm tra khóa ngoại
SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- USERS
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  username VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  role ENUM('user','admin','superadmin') DEFAULT 'user',
  status ENUM('active','banned','pending') DEFAULT 'active',
  balance DECIMAL(18,2) NOT NULL DEFAULT 0,
  ip_address VARCHAR(45),
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

-- =========================
-- PRODUCTS
-- =========================
CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  seller_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description MEDIUMTEXT,
  price DECIMAL(18,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category VARCHAR(120),
  file_url VARCHAR(1000),
  image_url VARCHAR(1000),
  tags JSON,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_products_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_products_category (category),
  INDEX idx_products_is_active (is_active),
  INDEX idx_products_created (created_at)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

-- =========================
-- TRANSACTIONS (deposit / withdraw / purchase)
-- =========================
CREATE TABLE IF NOT EXISTS transactions (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  product_id CHAR(36) NULL,
  reference_code VARCHAR(200) UNIQUE,
  amount DECIMAL(18,2) NOT NULL,
  type ENUM('deposit','withdraw','purchase') NOT NULL,
  status ENUM('pending','approved','rejected','failed') DEFAULT 'pending',
  method VARCHAR(80),
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_transactions_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_transactions_user (user_id),
  INDEX idx_transactions_type_status (type, status),
  INDEX idx_transactions_created (created_at)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

-- =========================
-- WITHDRAWALS (chi tiết duyệt rút)
-- =========================
CREATE TABLE IF NOT EXISTS withdrawals (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  bank_name VARCHAR(150),
  account_number VARCHAR(120),
  account_name VARCHAR(150),
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_withdrawals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_withdrawals_admin FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_withdrawals_user (user_id),
  INDEX idx_withdrawals_status (status)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

-- =========================
-- NOTIFICATIONS
-- =========================
CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  type ENUM('system','deposit','withdraw','chat','promotion') NOT NULL,
  title VARCHAR(255),
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_read (user_id, is_read),
  INDEX idx_notifications_created (created_at)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

-- =========================
-- CHATS (Realtime user <> admin)
-- =========================
CREATE TABLE IF NOT EXISTS chats (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  admin_id CHAR(36) NULL,
  message TEXT NOT NULL,
  is_admin TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_chats_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chats_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_chats_user (user_id),
  INDEX idx_chats_admin (admin_id),
  INDEX idx_chats_created (created_at)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

-- =========================
-- AI LOGS (tracking Gemini / local LLM)
-- =========================
CREATE TABLE IF NOT EXISTS ai_logs (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NULL,
  prompt TEXT NOT NULL,
  response MEDIUMTEXT,
  provider VARCHAR(80) DEFAULT 'gemini',
  latency_ms INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_ai_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_ai_logs_user (user_id),
  INDEX idx_ai_logs_created (created_at)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

-- =========================
-- EXTRA HELPERS
-- =========================
CREATE TABLE IF NOT EXISTS admin_actions (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  admin_id CHAR(36) NOT NULL,
  action_type VARCHAR(120) NOT NULL,
  payload JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_admin_actions_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_admin_actions_type (action_type),
  INDEX idx_admin_actions_created (created_at)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

-- Done
SELECT '✅ MySQL schema ready' AS status;


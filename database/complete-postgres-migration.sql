-- ============================================================
-- COMPLETE PostgreSQL Schema for QtusDevMarket
-- Idempotent: sử dụng IF NOT EXISTS cho tất cả
-- Chạy: psql -U <user> -d <database> -f database/complete-postgres-migration.sql
-- ============================================================

-- ============================================================
-- 1. USERS (core)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  uid             VARCHAR(191) UNIQUE,
  email           VARCHAR(191) NOT NULL UNIQUE,
  username        VARCHAR(191) UNIQUE,
  name            VARCHAR(191),
  password_hash   VARCHAR(255),
  avatar_url      VARCHAR(1000),
  ip_address      VARCHAR(45),
  role            VARCHAR(50) NOT NULL DEFAULT 'user',
  balance         DECIMAL(15,2) NOT NULL DEFAULT 0,
  status          VARCHAR(50) NOT NULL DEFAULT 'active',
  last_activity   TIMESTAMPTZ NULL,
  login_count     INT NOT NULL DEFAULT 0,
  referral_code   VARCHAR(50) NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ NULL
);

-- ✅ FIX: Thêm cột mới nếu bảng users đã tồn tại (Supabase)
ALTER TABLE users ADD COLUMN IF NOT EXISTS uid VARCHAR(191) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(191) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(1000);
ALTER TABLE users ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_email_role ON users(email, role);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_users_created_at_desc ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_balance_desc ON users(balance DESC);

-- ============================================================
-- 2. USER_PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id                      SERIAL PRIMARY KEY,
  user_id                 INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  phone                   VARCHAR(50),
  address                 TEXT,
  city                    VARCHAR(120),
  country                 VARCHAR(120),
  postal_code             VARCHAR(32),
  social_links            JSONB,
  two_factor_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_secret       TEXT,
  two_factor_backup_codes TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- ============================================================
-- 3. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  price           DECIMAL(10,2) NOT NULL,
  category        VARCHAR(191),
  demo_url        VARCHAR(1000),
  download_url    VARCHAR(1000),
  file_url        VARCHAR(1000),
  thumbnail       VARCHAR(1000),
  image_url       VARCHAR(1000),
  tags            TEXT[],
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  user_id         INT REFERENCES users(id) ON DELETE SET NULL,
  download_count  INT NOT NULL DEFAULT 0,
  search_vector   tsvector,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ NULL
);

-- ✅ FIX: Thêm cột mới nếu bảng products đã tồn tại
ALTER TABLE products ADD COLUMN IF NOT EXISTS demo_url VARCHAR(1000);
ALTER TABLE products ADD COLUMN IF NOT EXISTS download_url VARCHAR(1000);
ALTER TABLE products ADD COLUMN IF NOT EXISTS file_url VARCHAR(1000);
ALTER TABLE products ADD COLUMN IF NOT EXISTS thumbnail VARCHAR(1000);
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(1000);
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS download_count INT NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at_desc ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_downloads_desc ON products(download_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN(search_vector);

-- Full-text search trigger
CREATE OR REPLACE FUNCTION update_product_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_search_vector ON products;
CREATE TRIGGER trigger_update_product_search_vector
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_product_search_vector();

-- ============================================================
-- 4. DEPOSITS
-- ============================================================
CREATE TABLE IF NOT EXISTS deposits (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email      VARCHAR(191),
  user_name       VARCHAR(191),
  amount          DECIMAL(15,2) NOT NULL,
  method          VARCHAR(191),
  transaction_id  VARCHAR(191),
  status          VARCHAR(50) NOT NULL DEFAULT 'pending',
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ NULL,
  approved_time   TIMESTAMPTZ NULL,
  approved_by     VARCHAR(191)
);

CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_timestamp ON deposits(timestamp);
CREATE INDEX IF NOT EXISTS idx_deposits_user_status ON deposits(user_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_deposits_status_created ON deposits(status, timestamp DESC);

-- ============================================================
-- 5. WITHDRAWALS
-- ============================================================
CREATE TABLE IF NOT EXISTS withdrawals (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email      VARCHAR(191),
  user_name       VARCHAR(191),
  amount          DECIMAL(15,2) NOT NULL,
  bank_name       VARCHAR(191),
  account_number  VARCHAR(191),
  account_name    VARCHAR(191),
  status          VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ NULL,
  approved_time   TIMESTAMPTZ NULL,
  approved_by     VARCHAR(191)
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_status ON withdrawals(user_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_withdrawals_status_created ON withdrawals(status, created_at DESC);

-- ============================================================
-- 6. PURCHASES
-- ============================================================
CREATE TABLE IF NOT EXISTS purchases (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id      INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  amount          DECIMAL(15,2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ NULL,
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at);
CREATE INDEX IF NOT EXISTS idx_purchases_user_created ON purchases(user_id, created_at DESC);

-- ============================================================
-- 7. TRANSACTIONS (unified)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id      INT REFERENCES products(id) ON DELETE SET NULL,
  reference_code  VARCHAR(200) UNIQUE,
  amount          DECIMAL(18,2) NOT NULL,
  type            VARCHAR(50) NOT NULL, -- 'deposit','withdraw','purchase'
  status          VARCHAR(50) NOT NULL DEFAULT 'pending',
  method          VARCHAR(80),
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type_status ON transactions(type, status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);

-- ============================================================
-- 8. REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id      INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating          INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment         TEXT,
  images          TEXT[],
  helpful_count   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ NULL,
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- ✅ FIX: Thêm cột mới nếu bảng reviews đã tồn tại
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count INT NOT NULL DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_product_created ON reviews(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews(product_id, rating);

-- ============================================================
-- 9. REVIEW_VOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS review_votes (
  id          SERIAL PRIMARY KEY,
  review_id   INT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_helpful  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON review_votes(user_id);

-- ============================================================
-- 10. PRODUCT_RATINGS (cache)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_ratings (
  product_id     INT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  average_rating DECIMAL(4,2) NOT NULL DEFAULT 0,
  total_ratings  INT NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 11. CHATS
-- ============================================================
CREATE TABLE IF NOT EXISTS chats (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id    INT REFERENCES users(id) ON DELETE SET NULL,
  message     TEXT NOT NULL,
  is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_admin_id ON chats(admin_id);
CREATE INDEX IF NOT EXISTS idx_chats_is_admin ON chats(is_admin);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at);
CREATE INDEX IF NOT EXISTS idx_chats_user_created ON chats(user_id, created_at DESC);

-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(100) NOT NULL,
  title       VARCHAR(255),
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE is_read = FALSE;

-- ============================================================
-- 13. NOTIFICATION_PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id              INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_notifications  BOOLEAN DEFAULT TRUE,
  push_notifications   BOOLEAN DEFAULT TRUE,
  sms_notifications    BOOLEAN DEFAULT FALSE,
  wishlist_price_drop  BOOLEAN DEFAULT TRUE,
  new_product_alerts   BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 14. WISHLISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlists (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ NULL,
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);

-- ============================================================
-- 15. DOWNLOADS
-- ============================================================
CREATE TABLE IF NOT EXISTS downloads (
  id            SERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id    INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address    VARCHAR(45),
  user_agent    TEXT
);

-- ✅ FIX: Thêm cột mới nếu bảng downloads đã tồn tại
ALTER TABLE downloads ADD COLUMN IF NOT EXISTS downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE downloads ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE downloads ADD COLUMN IF NOT EXISTS user_agent TEXT;

CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_product_id ON downloads(product_id);
CREATE INDEX IF NOT EXISTS idx_downloads_downloaded_at ON downloads(downloaded_at);
CREATE INDEX IF NOT EXISTS idx_downloads_user_product_date ON downloads(user_id, product_id, downloaded_at);

-- ============================================================
-- 16. FOLLOWS
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
  follower_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- ============================================================
-- 17. PRODUCT_COMMENTS (nested)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_comments (
  id          SERIAL PRIMARY KEY,
  product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  parent_id   INT REFERENCES product_comments(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_comments_product_id ON product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_user_id ON product_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_parent_id ON product_comments(parent_id);

-- ============================================================
-- 18. COUPONS
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id                  SERIAL PRIMARY KEY,
  code                VARCHAR(50) NOT NULL UNIQUE,
  name                VARCHAR(255),
  title               VARCHAR(255),
  description         TEXT,
  discount_type       VARCHAR(50) DEFAULT 'percentage', -- 'percentage' | 'fixed'
  discount_value      DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_purchase_amount DECIMAL(15,2) DEFAULT 0,
  max_discount_amount DECIMAL(15,2) NULL,
  usage_limit         INT NULL,
  valid_from          TIMESTAMPTZ NULL,
  valid_until         TIMESTAMPTZ NULL,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid ON coupons(valid_from, valid_until);

-- ============================================================
-- 19. USER_COUPONS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_coupons (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coupon_id   INT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  used_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, coupon_id)
);

CREATE INDEX IF NOT EXISTS idx_user_coupons_user ON user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_coupon ON user_coupons(coupon_id);

-- ============================================================
-- 20. REFERRALS
-- ============================================================
CREATE TABLE IF NOT EXISTS referrals (
  id                 SERIAL PRIMARY KEY,
  referrer_id        INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id        INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  total_earnings     DECIMAL(15,2) NOT NULL DEFAULT 0,
  status             VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- ============================================================
-- 21. BUNDLES
-- ============================================================
CREATE TABLE IF NOT EXISTS bundles (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  slug             VARCHAR(255) UNIQUE,
  description      TEXT,
  price            DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount_percent INT NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bundles_active ON bundles(is_active);
CREATE INDEX IF NOT EXISTS idx_bundles_price ON bundles(price);

-- ============================================================
-- 22. BUNDLE_PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS bundle_products (
  id         SERIAL PRIMARY KEY,
  bundle_id  INT NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(bundle_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_bundle_products_bundle_id ON bundle_products(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_products_product_id ON bundle_products(product_id);

-- ============================================================
-- 23. SUBSCRIPTION_BENEFITS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscription_benefits (
  id               SERIAL PRIMARY KEY,
  plan             VARCHAR(100) NOT NULL UNIQUE,
  name             VARCHAR(255),
  description      TEXT,
  discount_percent INT NOT NULL DEFAULT 0,
  free_downloads   INT NOT NULL DEFAULT 0,
  priority_support BOOLEAN DEFAULT FALSE,
  early_access     BOOLEAN DEFAULT FALSE,
  perks            JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default plans
INSERT INTO subscription_benefits (plan, name, discount_percent, free_downloads, priority_support, early_access)
VALUES
  ('basic',      'Basic',      0,  0,  FALSE, FALSE),
  ('premium',    'Premium',    10, 5,  TRUE,  FALSE),
  ('enterprise', 'Enterprise', 20, 20, TRUE,  TRUE)
ON CONFLICT (plan) DO NOTHING;

-- ============================================================
-- 24. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan        VARCHAR(100) NOT NULL,
  status      VARCHAR(50) NOT NULL DEFAULT 'active',
  start_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date    TIMESTAMPTZ NULL,
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_start_date ON subscriptions(start_date);

-- ============================================================
-- 25. PASSWORD_RESETS
-- ============================================================
CREATE TABLE IF NOT EXISTS password_resets (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(255) NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);

-- ============================================================
-- 26. ADMIN (role mapping)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_user_id ON admin(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_role ON admin(role);

-- ============================================================
-- 27. ADMIN_ACTIONS (audit log)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_actions (
  id          SERIAL PRIMARY KEY,
  admin_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(120) NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions(created_at);

-- ============================================================
-- 28. AI_LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE SET NULL,
  prompt      TEXT NOT NULL,
  response    TEXT,
  provider    VARCHAR(80) DEFAULT 'gemini',
  latency_ms  INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_user ON ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created ON ai_logs(created_at);

-- ============================================================
-- 29. ANALYTICS_EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE SET NULL,
  event_type  VARCHAR(100) NOT NULL,
  event_data  JSONB,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_data_gin ON analytics_events USING GIN(event_data);

-- ============================================================
-- 30. PRODUCT_VIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS product_views (
  id          SERIAL PRIMARY KEY,
  product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     INT REFERENCES users(id) ON DELETE SET NULL,
  ip_address  VARCHAR(45),
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ✅ FIX: Thêm cột mới nếu bảng product_views đã tồn tại
ALTER TABLE product_views ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE product_views ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);

CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_user_id ON product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at ON product_views(viewed_at);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'updated_at'
    GROUP BY table_name
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON %I;
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
    ', t, t);
  END LOOP;
END $$;

-- ============================================================
-- DONE
-- ============================================================
SELECT '✅ PostgreSQL complete schema ready — 30 tables, all indexes, triggers applied' AS status;

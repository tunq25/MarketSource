-- ============================================================
-- DATABASE INDEXES - Performance Optimization
-- ============================================================
-- ✅ FIX: Add composite indexes để tối ưu queries thường dùng
-- ============================================================

-- ============================================================
-- USERS TABLE INDEXES
-- ============================================================

-- Index cho email lookup (đã có trong create-tables.sql)
-- CREATE INDEX idx_users_email ON users(email);

-- Composite index cho user lookup by email + status
CREATE INDEX IF NOT EXISTS idx_users_email_status ON users(email, status);

-- Index cho role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);

-- Index cho created_at sorting
CREATE INDEX IF NOT EXISTS idx_users_created_at_desc ON users(created_at DESC);

-- ============================================================
-- PRODUCTS TABLE INDEXES
-- ============================================================

-- Composite index cho category + is_active filtering
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category, is_active) WHERE is_active = true;

-- Index cho price range queries
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Composite index cho search queries (title + description)
-- Note: Full-text search nên dùng PostgreSQL tsvector, nhưng đây là index đơn giản
CREATE INDEX IF NOT EXISTS idx_products_title_lower ON products(LOWER(title));
CREATE INDEX IF NOT EXISTS idx_products_created_at_desc ON products(created_at DESC);

-- Index cho download_count sorting
CREATE INDEX IF NOT EXISTS idx_products_downloads_desc ON products(download_count DESC);

-- ============================================================
-- PURCHASES TABLE INDEXES
-- ============================================================

-- Composite index cho user purchases lookup
CREATE INDEX IF NOT EXISTS idx_purchases_user_product ON purchases(user_id, product_id);

-- Index cho duplicate purchase check (critical for race condition prevention)
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_user_product_unique ON purchases(user_id, product_id);

-- Index cho purchase history queries
CREATE INDEX IF NOT EXISTS idx_purchases_user_created ON purchases(user_id, created_at DESC);

-- Index cho product sales queries
CREATE INDEX IF NOT EXISTS idx_purchases_product_created ON purchases(product_id, created_at DESC);

-- ============================================================
-- DEPOSITS TABLE INDEXES
-- ============================================================

-- Composite index cho pending deposits lookup
CREATE INDEX IF NOT EXISTS idx_deposits_user_status ON deposits(user_id, status) WHERE status = 'pending';

-- Index cho deposit history
CREATE INDEX IF NOT EXISTS idx_deposits_user_created ON deposits(user_id, created_at DESC);

-- Index cho admin approval queries
CREATE INDEX IF NOT EXISTS idx_deposits_status_created ON deposits(status, created_at DESC);

-- ============================================================
-- WITHDRAWALS TABLE INDEXES
-- ============================================================

-- Composite index cho pending withdrawals lookup
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_status ON withdrawals(user_id, status) WHERE status = 'pending';

-- Index cho withdrawal history
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_created ON withdrawals(user_id, created_at DESC);

-- Index cho admin approval queries
CREATE INDEX IF NOT EXISTS idx_withdrawals_status_created ON withdrawals(status, created_at DESC);

-- ============================================================
-- DOWNLOADS TABLE INDEXES
-- ============================================================

-- ✅ FIX: Critical index cho download count race condition prevention
-- Composite index cho daily download check (used in trackDownload)
CREATE INDEX IF NOT EXISTS idx_downloads_user_product_date ON downloads(user_id, product_id, DATE(downloaded_at));

-- Index cho download history
CREATE INDEX IF NOT EXISTS idx_downloads_user_created ON downloads(user_id, downloaded_at DESC);

-- Index cho product download stats
CREATE INDEX IF NOT EXISTS idx_downloads_product_created ON downloads(product_id, downloaded_at DESC);

-- ============================================================
-- REVIEWS TABLE INDEXES
-- ============================================================

-- Composite index cho product reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_created ON reviews(product_id, created_at DESC);

-- Index cho user reviews
CREATE INDEX IF NOT EXISTS idx_reviews_user_created ON reviews(user_id, created_at DESC);

-- Composite index cho rating queries
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews(product_id, rating);

-- ============================================================
-- CHATS TABLE INDEXES
-- ============================================================

-- Composite index cho user chat history
CREATE INDEX IF NOT EXISTS idx_chats_user_created ON chats(user_id, created_at DESC);

-- Index cho admin chat queries
CREATE INDEX IF NOT EXISTS idx_chats_admin_created ON chats(admin_id, created_at DESC) WHERE admin_id IS NOT NULL;

-- ============================================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================================

-- Composite index cho user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);

-- Index cho unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;

-- ============================================================
-- WISHLISTS TABLE INDEXES
-- ============================================================

-- Composite index cho user wishlist
CREATE INDEX IF NOT EXISTS idx_wishlists_user_product ON wishlists(user_id, product_id);

-- Unique index để prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlists_user_product_unique ON wishlists(user_id, product_id);

-- ============================================================
-- NOTES
-- ============================================================
-- 1. Các indexes này sẽ cải thiện performance cho:
--    - User purchase history queries
--    - Product search và filtering
--    - Admin approval queries (deposits/withdrawals)
--    - Download count tracking (race condition prevention)
--    - Review và rating queries
--
-- 2. Trade-off: Indexes tăng storage và có thể làm chậm INSERT/UPDATE
--    Nhưng với read-heavy workload, lợi ích lớn hơn
--
-- 3. Monitor query performance với EXPLAIN ANALYZE
--
-- 4. Có thể drop indexes nếu không dùng:
--    DROP INDEX IF EXISTS idx_name;


-- ============================================================
-- POSTGRESQL MISSING INDEXES - Performance Optimization
-- ============================================================
-- ✅ PERFORMANCE FIX: Add missing indexes để tối ưu queries
-- Chạy: psql -U <user> -d <database> -f database/add-missing-indexes-postgres.sql
-- ============================================================

-- ============================================================
-- USERS TABLE INDEXES
-- ============================================================

-- Index cho email lookup (đã có UNIQUE constraint, nhưng thêm index nếu chưa có)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index cho username lookup (đã có UNIQUE constraint)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Composite index cho user lookup by email + role
CREATE INDEX IF NOT EXISTS idx_users_email_role ON users(email, role);

-- Index cho role-based queries (admin, user filtering)
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);

-- Index cho created_at sorting (used in user lists)
CREATE INDEX IF NOT EXISTS idx_users_created_at_desc ON users(created_at DESC);

-- Index cho balance queries (for sorting users by balance)
CREATE INDEX IF NOT EXISTS idx_users_balance_desc ON users(balance DESC);

-- ============================================================
-- PRODUCTS TABLE INDEXES
-- ============================================================

-- Composite index cho category + is_active filtering (most common query)
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category, is_active) WHERE is_active = true;

-- Index cho price range queries
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Index cho search queries (title)
CREATE INDEX IF NOT EXISTS idx_products_title_lower ON products(LOWER(title));

-- Index cho created_at sorting
CREATE INDEX IF NOT EXISTS idx_products_created_at_desc ON products(created_at DESC);

-- Index cho download_count sorting (if column exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'download_count') THEN
    CREATE INDEX IF NOT EXISTS idx_products_downloads_desc ON products(download_count DESC);
  END IF;
END $$;

-- ============================================================
-- PURCHASES TABLE INDEXES
-- ============================================================

-- ✅ CRITICAL: Composite index cho user purchases lookup (used in getPurchases)
CREATE INDEX IF NOT EXISTS idx_purchases_user_product ON purchases(user_id, product_id);

-- ✅ CRITICAL: Unique index để prevent duplicate purchases (race condition prevention)
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_user_product_unique ON purchases(user_id, product_id);

-- Index cho purchase history queries (used in getPurchases)
CREATE INDEX IF NOT EXISTS idx_purchases_user_created ON purchases(user_id, created_at DESC);

-- Index cho product sales queries
CREATE INDEX IF NOT EXISTS idx_purchases_product_created ON purchases(product_id, created_at DESC);

-- ============================================================
-- DEPOSITS TABLE INDEXES
-- ============================================================

-- ✅ CRITICAL: Composite index cho pending deposits lookup (used in admin approval)
CREATE INDEX IF NOT EXISTS idx_deposits_user_status ON deposits(user_id, status) WHERE status = 'pending';

-- Index cho deposit history
CREATE INDEX IF NOT EXISTS idx_deposits_user_created ON deposits(user_id, created_at DESC);

-- ✅ CRITICAL: Index cho admin approval queries (status + created_at sorting)
CREATE INDEX IF NOT EXISTS idx_deposits_status_created ON deposits(status, created_at DESC);

-- Index cho amount queries (for filtering)
CREATE INDEX IF NOT EXISTS idx_deposits_amount ON deposits(amount);

-- ============================================================
-- WITHDRAWALS TABLE INDEXES
-- ============================================================

-- ✅ CRITICAL: Composite index cho pending withdrawals lookup (used in admin approval)
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_status ON withdrawals(user_id, status) WHERE status = 'pending';

-- Index cho withdrawal history
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_created ON withdrawals(user_id, created_at DESC);

-- ✅ CRITICAL: Index cho admin approval queries (status + created_at sorting)
CREATE INDEX IF NOT EXISTS idx_withdrawals_status_created ON withdrawals(status, created_at DESC);

-- Index cho amount queries (for filtering)
CREATE INDEX IF NOT EXISTS idx_withdrawals_amount ON withdrawals(amount);

-- ============================================================
-- CHATS TABLE INDEXES
-- ============================================================

-- ✅ CRITICAL: Composite index cho user chat history (used in getChats)
CREATE INDEX IF NOT EXISTS idx_chats_user_created ON chats(user_id, created_at DESC);

-- ✅ CRITICAL: Index cho admin chat queries (used in getChats with admin_id)
CREATE INDEX IF NOT EXISTS idx_chats_admin_created ON chats(admin_id, created_at DESC) WHERE admin_id IS NOT NULL;

-- Composite index cho user + admin chat lookup
CREATE INDEX IF NOT EXISTS idx_chats_user_admin_created ON chats(user_id, admin_id, created_at DESC);

-- ============================================================
-- REVIEWS TABLE INDEXES
-- ============================================================

-- Composite index cho product reviews (used in getReviews)
CREATE INDEX IF NOT EXISTS idx_reviews_product_created ON reviews(product_id, created_at DESC);

-- Index cho user reviews
CREATE INDEX IF NOT EXISTS idx_reviews_user_created ON reviews(user_id, created_at DESC);

-- Composite index cho rating queries
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews(product_id, rating);

-- ============================================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================================

-- ✅ CRITICAL: Composite index cho user notifications (most common query)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);

-- Index cho unread notifications (filtered index)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;

-- ============================================================
-- DOWNLOADS TABLE INDEXES (if exists)
-- ============================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'downloads') THEN
    -- ✅ CRITICAL: Composite index cho daily download check (race condition prevention)
    CREATE INDEX IF NOT EXISTS idx_downloads_user_product_date ON downloads(user_id, product_id, DATE(downloaded_at));
    
    -- Index cho download history
    CREATE INDEX IF NOT EXISTS idx_downloads_user_created ON downloads(user_id, downloaded_at DESC);
    
    -- Index cho product download stats
    CREATE INDEX IF NOT EXISTS idx_downloads_product_created ON downloads(product_id, downloaded_at DESC);
  END IF;
END $$;

-- ============================================================
-- WISHLISTS TABLE INDEXES (if exists)
-- ============================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wishlists') THEN
    -- Composite index cho user wishlist
    CREATE INDEX IF NOT EXISTS idx_wishlists_user_product ON wishlists(user_id, product_id);
    
    -- Unique index để prevent duplicates
    CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlists_user_product_unique ON wishlists(user_id, product_id);
  END IF;
END $$;

-- ============================================================
-- VERIFY INDEXES
-- ============================================================

-- Query để verify indexes đã được tạo
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('users', 'products', 'purchases', 'deposits', 'withdrawals', 'chats', 'reviews', 'notifications')
ORDER BY tablename, indexname;

-- ============================================================
-- NOTES
-- ============================================================
-- 1. Các indexes này sẽ cải thiện performance cho:
--    - User purchase history queries (getPurchases)
--    - Product search và filtering
--    - Admin approval queries (deposits/withdrawals) - CRITICAL
--    - Chat queries (getChats) - CRITICAL
--    - Download count tracking (race condition prevention)
--    - Review và rating queries
--
-- 2. Trade-off: Indexes tăng storage và có thể làm chậm INSERT/UPDATE
--    Nhưng với read-heavy workload, lợi ích lớn hơn
--
-- 3. Monitor query performance với EXPLAIN ANALYZE:
--    EXPLAIN ANALYZE SELECT * FROM purchases WHERE user_id = 1 ORDER BY created_at DESC;
--
-- 4. Có thể drop indexes nếu không dùng:
--    DROP INDEX IF EXISTS idx_name;
--
-- 5. Partial indexes (WHERE clause) giúp giảm index size:
--    CREATE INDEX ... WHERE status = 'pending';
--
-- ============================================================


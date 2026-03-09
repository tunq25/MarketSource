-- ============================================================
-- DATABASE MIGRATION: Add Download Tracking
-- ============================================================
-- Thêm cột download_count vào bảng products
-- Tạo bảng downloads để track lịch sử tải xuống
-- ============================================================

-- 1. Thêm cột download_count vào bảng products (nếu chưa có)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'download_count'
  ) THEN
    ALTER TABLE products ADD COLUMN download_count INT DEFAULT 0;
    RAISE NOTICE 'Added column download_count to products table';
  ELSE
    RAISE NOTICE 'Column download_count already exists in products table';
  END IF;
END $$;

-- 2. Tạo bảng downloads để lưu lịch sử tải xuống
CREATE TABLE IF NOT EXISTS downloads (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Index để tối ưu query check download trong ngày
CREATE INDEX IF NOT EXISTS idx_downloads_user_product_date ON downloads(user_id, product_id, DATE(downloaded_at));

-- 3. Tạo indexes cho performance
CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_product_id ON downloads(product_id);
CREATE INDEX IF NOT EXISTS idx_downloads_downloaded_at ON downloads(downloaded_at);
CREATE INDEX IF NOT EXISTS idx_products_download_count ON products(download_count);

-- Note: Download count được tăng trong application code (trackDownload function)
-- để có thể kiểm tra user đã tải trong ngày chưa trước khi tăng count

-- 6. Khởi tạo download_count = 0 cho các products chưa có
UPDATE products SET download_count = 0 WHERE download_count IS NULL;

-- 7. Thêm comment cho các cột/bảng
COMMENT ON TABLE downloads IS 'Lưu lịch sử tải xuống sản phẩm của người dùng';
COMMENT ON COLUMN products.download_count IS 'Tổng số lượt tải xuống sản phẩm';

-- 8. Kiểm tra kết quả
SELECT 
  'Migration completed successfully' as status,
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM downloads) as total_downloads,
  (SELECT SUM(download_count) FROM products) as total_download_count;


-- ============================================================
-- FIX PRODUCT_RATINGS TABLE & TRIGGER
-- Script này đảm bảo product_ratings hoạt động đúng
-- ============================================================

-- 1. Xóa VIEW nếu có (tránh conflict với TABLE)
DROP VIEW IF EXISTS product_ratings CASCADE;

-- 2. Tạo bảng product_ratings nếu chưa có
CREATE TABLE IF NOT EXISTS product_ratings (
  product_id INT PRIMARY KEY,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 3. Tạo index cho performance
CREATE INDEX IF NOT EXISTS idx_product_ratings_average_rating ON product_ratings(average_rating);
CREATE INDEX IF NOT EXISTS idx_product_ratings_total_ratings ON product_ratings(total_ratings);

-- 4. Function để tự động update product_ratings khi có review mới/cập nhật/xóa
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Tính toán lại rating cho product
  INSERT INTO product_ratings (product_id, average_rating, total_ratings, updated_at)
  SELECT 
    product_id,
    ROUND(AVG(rating)::numeric, 2) as average_rating,
    COUNT(*) as total_ratings,
    CURRENT_TIMESTAMP
  FROM reviews
  WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
  GROUP BY product_id
  ON CONFLICT (product_id) 
  DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_ratings = EXCLUDED.total_ratings,
    updated_at = EXCLUDED.updated_at;
  
  -- Nếu không còn review nào, set về 0
  IF NOT EXISTS (
    SELECT 1 FROM reviews 
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
  ) THEN
    UPDATE product_ratings 
    SET average_rating = 0, total_ratings = 0, updated_at = CURRENT_TIMESTAMP
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 5. Xóa trigger cũ nếu có
DROP TRIGGER IF EXISTS trigger_update_product_rating ON reviews;

-- 6. Tạo trigger mới
CREATE TRIGGER trigger_update_product_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();

-- 7. Tính toán lại ratings cho tất cả products hiện có
INSERT INTO product_ratings (product_id, average_rating, total_ratings, updated_at)
SELECT 
  product_id,
  ROUND(AVG(rating)::numeric, 2) as average_rating,
  COUNT(*) as total_ratings,
  CURRENT_TIMESTAMP
FROM reviews
GROUP BY product_id
ON CONFLICT (product_id) 
DO UPDATE SET
  average_rating = EXCLUDED.average_rating,
  total_ratings = EXCLUDED.total_ratings,
  updated_at = EXCLUDED.updated_at;

-- 8. Tạo products không có review với rating = 0
INSERT INTO product_ratings (product_id, average_rating, total_ratings, updated_at)
SELECT 
  p.id,
  0,
  0,
  CURRENT_TIMESTAMP
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM product_ratings pr WHERE pr.product_id = p.id
)
ON CONFLICT (product_id) DO NOTHING;

-- 9. Kiểm tra kết quả
SELECT 
  'product_ratings table created/updated successfully' as status,
  COUNT(*) as total_products_with_ratings
FROM product_ratings;

-- ============================================================
-- HOÀN TẤT
-- ============================================================


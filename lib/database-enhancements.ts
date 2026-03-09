import { query as mysqlQuery } from './database-mysql';
import { logger } from './logger';

// ============================================================
// WISHLIST FUNCTIONS
// ============================================================

export async function addToWishlist(userId: number, productId: number) {
  try {
    await mysqlQuery(
      `INSERT INTO wishlists (user_id, product_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE user_id = user_id`,
      [userId, productId]
    )

    const rows = await mysqlQuery<any>(
      'SELECT id, created_at FROM wishlists WHERE user_id = ? AND product_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId, productId]
    )

    return rows[0] || null
  } catch (error) {
    logger.error('Error adding to wishlist (MySQL):', error)
    throw error
  }
}

export async function removeFromWishlist(userId: number, productId: number) {
  try {
    await mysqlQuery(
      'DELETE FROM wishlists WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    )
    return { success: true }
  } catch (error) {
    logger.error('Error removing from wishlist (MySQL):', error)
    throw error
  }
}

export async function getWishlist(userId: number) {
  try {
    // ✅ FIX: Dùng product_ratings thay vì query reviews trực tiếp để tối ưu performance
    const rows = await mysqlQuery<any>(
      `SELECT w.*, p.*, 
              COALESCE(pr.average_rating, 0) as avg_rating,
              COALESCE(pr.total_ratings, 0) as review_count
       FROM wishlists w
       JOIN products p ON w.product_id = p.id
       LEFT JOIN product_ratings pr ON p.id = pr.product_id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [userId]
    )
    return rows
  } catch (error) {
    logger.error('Error getting wishlist (MySQL):', error)
    throw error
  }
}

export async function isInWishlist(userId: number, productId: number): Promise<boolean> {
  try {
    const rows = await mysqlQuery<any>(
      'SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    )
    return rows.length > 0
  } catch (error) {
    logger.error('Error checking wishlist (MySQL):', error)
    return false
  }
}

// ============================================================
// PRODUCT SEARCH (Full-Text Search)
// ============================================================

export async function searchProducts(query: string, filters?: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  limit?: number;
  offset?: number;
}) {
  try {
    // ✅ MySQL: dùng LIKE + JSON_SEARCH trên tags (JSON) thay cho full-text Postgres
    let sql = `
      SELECT p.*,
             pr.average_rating as avg_rating,
             pr.total_ratings as review_count,
             1 as rank
      FROM products p
      LEFT JOIN product_ratings pr ON p.id = pr.product_id
      WHERE p.is_active = TRUE
        AND (
          p.title LIKE ?
          OR p.description LIKE ?
          OR (p.tags IS NOT NULL AND JSON_SEARCH(p.tags, 'one', ?, NULL) IS NOT NULL)
        )
    `
    const params: any[] = []
    const likeQuery = `%${query}%`
    params.push(likeQuery, likeQuery, likeQuery)

    if (filters?.category) {
      sql += ` AND p.category = ?`
      params.push(filters.category)
    }

    if (filters?.minPrice !== undefined) {
      sql += ` AND p.price >= ?`
      params.push(filters.minPrice)
    }

    if (filters?.maxPrice !== undefined) {
      sql += ` AND p.price <= ?`
      params.push(filters.maxPrice)
    }

    if (filters?.minRating !== undefined) {
      // ✅ FIX: Dùng product_ratings thay vì query reviews trực tiếp
      sql += ` AND (pr.average_rating >= ? OR pr.average_rating IS NULL)`
      params.push(filters.minRating)
    }

    // ✅ Order theo "độ khớp" đơn giản + created_at
    sql += `
      ORDER BY 
        CASE 
          WHEN p.title LIKE ? THEN 1
          WHEN p.description LIKE ? THEN 2
          ELSE 3
        END,
        p.created_at DESC
    `
    params.push(likeQuery, likeQuery)

    if (filters?.limit) {
      sql += ` LIMIT ?`
      params.push(filters.limit)
    }

    if (filters?.offset) {
      sql += ` OFFSET ?`
      params.push(filters.offset)
    }

    const sqlStr = String(sql)
    const rows = await mysqlQuery<any>(sqlStr, params)
    return rows
  } catch (error) {
    logger.error('Error searching products (MySQL):', error)
    throw error
  }
}

// ============================================================
// ANALYTICS FUNCTIONS
// ============================================================

export async function trackEvent(eventType: string, eventData: any, userId?: number, ipAddress?: string, userAgent?: string) {
  try {
    await mysqlQuery(
      `INSERT INTO analytics_events (user_id, event_type, event_data, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [userId || null, eventType, JSON.stringify(eventData), ipAddress || null, userAgent || null]
    )
  } catch (error) {
    logger.error('Error tracking event (MySQL):', error)
    // Don't throw - analytics should not break the app
  }
}

export async function trackProductView(productId: number, userId?: number, ipAddress?: string) {
  try {
    await mysqlQuery(
      `INSERT INTO product_views (product_id, user_id, ip_address)
       VALUES (?, ?, ?)`,
      [productId, userId || null, ipAddress || null]
    )
  } catch (error) {
    logger.error('Error tracking product view (MySQL):', error)
  }
}

export async function getProductViews(productId: number, days: number = 30) {
  try {
    // ✅ FIX: Thêm parameterized query để tránh SQL injection
    const rows = await mysqlQuery<any>(
      `SELECT COUNT(*) as total_views,
              COUNT(DISTINCT user_id) as unique_views
       FROM product_views
       WHERE product_id = ?
         AND viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [productId, days]
    )
    return rows[0]
  } catch (error) {
    logger.error('Error getting product views (MySQL):', error)
    throw error
  }
}

// ============================================================
// BUNDLE FUNCTIONS
// ============================================================

export async function getBundles(isActive?: boolean) {
  try {
    let query = `
      SELECT b.*,
             COUNT(bp.product_id) as product_count
      FROM bundles b
      LEFT JOIN bundle_products bp ON b.id = bp.bundle_id
    `;
    const params: any[] = []

    if (isActive !== undefined) {
      query += ' WHERE b.is_active = ?'
      params.push(isActive ? 1 : 0)
    }

    query += ' GROUP BY b.id ORDER BY b.created_at DESC'

    const sqlStr = String(query)
    const rows = await mysqlQuery<any>(sqlStr, params)
    return rows
  } catch (error) {
    logger.error('Error getting bundles (MySQL):', error)
    throw error
  }
}

export async function getBundleWithProducts(bundleId: number) {
  try {
    const bundleRows = await mysqlQuery<any>(
      'SELECT * FROM bundles WHERE id = ?',
      [bundleId]
    )

    if (!bundleRows.length) {
      return null
    }

    const productRows = await mysqlQuery<any>(
      `SELECT p.*
       FROM products p
       JOIN bundle_products bp ON p.id = bp.product_id
       WHERE bp.bundle_id = ?`,
      [bundleId]
    )

    return {
      ...bundleRows[0],
      products: productRows,
    }
  } catch (error) {
    logger.error('Error getting bundle with products (MySQL):', error)
    throw error
  }
}

// ============================================================
// REVIEW VOTES FUNCTIONS
// ============================================================

export async function voteReview(reviewId: number, userId: number, isHelpful: boolean) {
  try {
    await mysqlQuery(
      `INSERT INTO review_votes (review_id, user_id, is_helpful)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_helpful = VALUES(is_helpful)`,
      [reviewId, userId, isHelpful]
    )

    // Update helpful_count
    await mysqlQuery(
      `UPDATE reviews 
       SET helpful_count = (
         SELECT COUNT(*) FROM review_votes 
         WHERE review_id = ? AND is_helpful = 1
       )
       WHERE id = ?`,
      [reviewId]
    )

    const rows = await mysqlQuery<any>('SELECT id FROM review_votes WHERE review_id = ? AND user_id = ?', [reviewId, userId])
    return rows[0] || null
  } catch (error) {
    logger.error('Error voting review (MySQL):', error)
    throw error
  }
}

// ============================================================
// SUBSCRIPTION FUNCTIONS
// ============================================================

export async function getUserSubscription(userId: number) {
  try {
    const rows = await mysqlQuery<any>(
      `SELECT s.*, sb.*
       FROM subscriptions s
       LEFT JOIN subscription_benefits sb ON s.plan = sb.plan
       WHERE s.user_id = ? AND s.status = 'active'
       ORDER BY s.start_date DESC
       LIMIT 1`,
      [userId]
    )
    return rows[0] || null
  } catch (error) {
    logger.error('Error getting user subscription (MySQL):', error)
    throw error
  }
}

export async function getSubscriptionDiscount(userId: number): Promise<number> {
  try {
    const subscription = await getUserSubscription(userId);
    return subscription?.discount_percent || 0;
  } catch (error) {
    return 0;
  }
}


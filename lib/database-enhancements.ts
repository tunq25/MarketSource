import { query } from './database';
import { logger } from './logger';

// ============================================================
// WISHLIST FUNCTIONS
// ============================================================

export async function addToWishlist(userId: number, productId: number) {
  try {
    await query(
      `INSERT INTO wishlists (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [userId, productId]
    )

    const rows = await query<any>(
      'SELECT id, created_at FROM wishlists WHERE user_id = $1 AND product_id = $2 ORDER BY created_at DESC LIMIT 1',
      [userId, productId]
    )

    return rows[0] || null
  } catch (error) {
    logger.error('Error adding to wishlist:', error)
    throw error
  }
}

export async function removeFromWishlist(userId: number, productId: number) {
  try {
    await query(
      'DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    )
    return { success: true }
  } catch (error) {
    logger.error('Error removing from wishlist:', error)
    throw error
  }
}

export async function getWishlist(userId: number) {
  try {
    const rows = await query<any>(
      `SELECT w.*, p.*, 
              COALESCE(pr.average_rating, 0) as avg_rating,
              COALESCE(pr.total_ratings, 0) as review_count
       FROM wishlists w
       JOIN products p ON w.product_id = p.id
       LEFT JOIN product_ratings pr ON p.id = pr.product_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    )
    return rows
  } catch (error) {
    logger.error('Error getting wishlist:', error)
    throw error
  }
}

export async function isInWishlist(userId: number, productId: number): Promise<boolean> {
  try {
    const rows = await query<any>(
      'SELECT id FROM wishlists WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    )
    return rows.length > 0
  } catch (error) {
    logger.error('Error checking wishlist:', error)
    return false
  }
}

// ============================================================
// PRODUCT SEARCH (Full-Text Search)
// ============================================================

export async function searchProducts(searchQuery: string, filters?: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  limit?: number;
  offset?: number;
}) {
  try {
    let sql = `
      SELECT p.*,
             pr.average_rating as avg_rating,
             pr.total_ratings as review_count,
             1 as rank
      FROM products p
      LEFT JOIN product_ratings pr ON p.id = pr.product_id
      WHERE p.deleted_at IS NULL AND p.is_active = TRUE
        AND (
          p.title ILIKE $1
          OR p.description ILIKE $1
          OR p.tags::text ILIKE $1
        )
    `
    const likeQuery = `%${searchQuery}%`
    const params: any[] = [likeQuery]
    let paramIndex = 2

    if (filters?.category) {
      sql += ` AND p.category = $${paramIndex}`
      params.push(filters.category)
      paramIndex++
    }

    if (filters?.minPrice !== undefined) {
      sql += ` AND p.price >= $${paramIndex}`
      params.push(filters.minPrice)
      paramIndex++
    }

    if (filters?.maxPrice !== undefined) {
      sql += ` AND p.price <= $${paramIndex}`
      params.push(filters.maxPrice)
      paramIndex++
    }

    if (filters?.minRating !== undefined) {
      sql += ` AND (pr.average_rating >= $${paramIndex} OR pr.average_rating IS NULL)`
      params.push(filters.minRating)
      paramIndex++
    }

    sql += `
      ORDER BY 
        CASE 
          WHEN p.title ILIKE $1 THEN 1
          WHEN p.description ILIKE $1 THEN 2
          ELSE 3
        END,
        p.created_at DESC
    `

    if (filters?.limit) {
      sql += ` LIMIT $${paramIndex}`
      params.push(filters.limit)
      paramIndex++
    }

    if (filters?.offset) {
      sql += ` OFFSET $${paramIndex}`
      params.push(filters.offset)
    }

    const rows = await query<any>(sql, params)
    return rows
  } catch (error) {
    logger.error('Error searching products:', error)
    throw error
  }
}

// ============================================================
// ANALYTICS FUNCTIONS
// ============================================================

export async function trackEvent(eventType: string, eventData: any, userId?: number, ipAddress?: string, userAgent?: string) {
  try {
    await query(
      `INSERT INTO analytics_events (user_id, event_type, event_data, ip_address, user_agent)
       VALUES ($1, $2, $3::jsonb, $4, $5)`,
      [userId || null, eventType, JSON.stringify(eventData), ipAddress || null, userAgent || null]
    )
  } catch (error) {
    logger.error('Error tracking event:', error)
  }
}

export async function trackProductView(productId: number, userId?: number, ipAddress?: string) {
  try {
    await query(
      `INSERT INTO product_views (product_id, user_id, ip_address)
       VALUES ($1, $2, $3)`,
      [productId, userId || null, ipAddress || null]
    )
  } catch (error) {
    logger.error('Error tracking product view:', error)
  }
}

export async function getProductViews(productId: number, days: number = 30) {
  try {
    const rows = await query<any>(
      `SELECT COUNT(*) as total_views,
              COUNT(DISTINCT user_id) as unique_views
       FROM product_views
       WHERE product_id = $1
         AND viewed_at >= CURRENT_TIMESTAMP - ($2 * INTERVAL '1 day')`,
      [productId, days]
    )
    return rows[0]
  } catch (error) {
    logger.error('Error getting product views:', error)
    throw error
  }
}

// ============================================================
// BUNDLE FUNCTIONS
// ============================================================

export async function getBundles(isActive?: boolean) {
  try {
    let sql = `
      SELECT b.*,
             COUNT(bp.product_id) as product_count
      FROM bundles b
      LEFT JOIN bundle_products bp ON b.id = bp.bundle_id
    `;
    const params: any[] = []

    if (isActive !== undefined) {
      sql += ' WHERE b.is_active = $1'
      params.push(isActive)
    }

    sql += ' GROUP BY b.id ORDER BY b.created_at DESC'

    const rows = await query<any>(sql, params)
    return rows
  } catch (error) {
    logger.error('Error getting bundles:', error)
    throw error
  }
}

export async function getBundleWithProducts(bundleId: number) {
  try {
    const bundleRows = await query<any>(
      'SELECT * FROM bundles WHERE id = $1',
      [bundleId]
    )

    if (!bundleRows.length) {
      return null
    }

    const productRows = await query<any>(
      `SELECT p.*
       FROM products p
       JOIN bundle_products bp ON p.id = bp.product_id
       WHERE bp.bundle_id = $1`,
      [bundleId]
    )

    return {
      ...bundleRows[0],
      products: productRows,
    }
  } catch (error) {
    logger.error('Error getting bundle with products:', error)
    throw error
  }
}

// ============================================================
// REVIEW VOTES FUNCTIONS
// ============================================================

export async function voteReview(reviewId: number, userId: number, isHelpful: boolean) {
  try {
    await query(
      `INSERT INTO review_votes (review_id, user_id, is_helpful)
       VALUES ($1, $2, $3)
       ON CONFLICT (review_id, user_id) DO UPDATE SET is_helpful = EXCLUDED.is_helpful, updated_at = CURRENT_TIMESTAMP`,
      [reviewId, userId, isHelpful]
    )

    await query(
      `UPDATE reviews 
       SET helpful_count = (
         SELECT COUNT(*) FROM review_votes 
         WHERE review_id = $1 AND is_helpful = true
       )
       WHERE id = $1`,
      [reviewId]
    )

    const rows = await query<any>('SELECT id FROM review_votes WHERE review_id = $1 AND user_id = $2', [reviewId, userId])
    return rows[0] || null
  } catch (error) {
    logger.error('Error voting review:', error)
    throw error
  }
}

// ============================================================
// SUBSCRIPTION FUNCTIONS
// ============================================================

export async function getUserSubscription(userId: number) {
  try {
    const rows = await query<any>(
      `SELECT s.*, sb.*
       FROM subscriptions s
       LEFT JOIN subscription_benefits sb ON s.plan = sb.plan
       WHERE s.user_id = $1 AND s.status = 'active'
       ORDER BY s.start_date DESC
       LIMIT 1`,
      [userId]
    )
    return rows[0] || null
  } catch (error) {
    logger.error('Error getting user subscription:', error)
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

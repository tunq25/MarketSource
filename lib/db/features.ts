import { logger } from '../logger';
import { PoolClient, Pool } from 'pg';
import { pool, getPool, query, queryOne, withTransaction, getPoolInstance, hasDownloadCountColumn } from "./core";
import { createNotification } from "./admin";
export async function getReviews(filters?: {
  productId?: number;
  userId?: number;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = `
      SELECT r.*, 
             u.username, 
             u.email,
             u.avatar_url,
             pr.title as product_title
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN products pr ON r.product_id = pr.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.productId) {
      query += ` AND r.product_id = $${paramIndex}`;
      params.push(filters.productId);
      paramIndex++;
    }

    if (filters?.userId) {
      query += ` AND r.user_id = $${paramIndex}`;
      params.push(filters.userId);
      paramIndex++;
    }

    if (filters?.status) {
      query += ` AND r.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    query += ' ORDER BY r.created_at DESC';

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error getting reviews', error, { filters });
    throw error;
  }
}
export async function createReview(reviewData: {
  userId: number;
  productId: number;
  rating: number;
  comment?: string | null;
  ipAddress?: string | null;
}) {
  try {
    const result = await pool.query(
      `INSERT INTO reviews (user_id, product_id, rating, comment, ip_address, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET 
         rating = EXCLUDED.rating, 
         comment = EXCLUDED.comment, 
         ip_address = EXCLUDED.ip_address,
         status = 'pending',
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, created_at, updated_at`,
      [
        reviewData.userId,
        reviewData.productId,
        reviewData.rating,
        reviewData.comment || null,
        reviewData.ipAddress || null,
      ]
    );

    // âœ… NEW: Táº¡o thĂ´ng bĂ¡o real-time khi gá»­i Ä‘Ă¡nh giĂ¡
    try {
      await createNotification({
        userId: reviewData.userId,
        type: 'review_added',
        message: `Báº¡n Ä‘Ă£ gá»­i Ä‘Ă¡nh giĂ¡ ${reviewData.rating} sao cho sáº£n pháº©m #${reviewData.productId}.`
      });
    } catch (err) {
      logger.warn('Failed to create notification for review', { userId: reviewData.userId });
    }

    return {
      id: result.rows[0].id,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };
  } catch (error) {
    logger.error('Error creating review', error, {
      userId: reviewData.userId,
      productId: reviewData.productId
    });
    throw error;
  }
}
export async function updateReviewStatus(id: number, status: 'published' | 'rejected', adminResponse?: string) {
  try {
    const result = await pool.query(
      `UPDATE reviews 
       SET status = $1, admin_response = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [status, adminResponse || null, id]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error updating review status', error, { id, status });
    throw error;
  }
}
export async function getReviewsAdmin() {
  try {
    const result = await pool.query(`
      SELECT r.*, 
             r.created_at AS "createdAt",
             r.updated_at AS "updatedAt",
             u.email AS "userEmail", 
             u.name AS "userName",
             p.title AS "productTitle"
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `);
    return result.rows;
  } catch (error) {
    logger.error('Error getting reviews for admin', error);
    throw error;
  }
}
export async function getProductAverageRating(productId: number) {
  try {
    const result = await pool.query(
      'SELECT * FROM product_ratings WHERE product_id = $1',
      [productId]
    );

    if (result.rows.length > 0) {
      return {
        product_id: result.rows[0].product_id,
        average_rating: parseFloat(result.rows[0].average_rating || '0'),
        total_ratings: parseInt(result.rows[0].total_ratings || '0'),
        updated_at: result.rows[0].updated_at,
      };
    }

    // Return default náº¿u chÆ°a cĂ³ rating
    return {
      product_id: productId,
      average_rating: 0,
      total_ratings: 0,
      updated_at: new Date(),
    };
  } catch (error) {
    logger.error('Error getting product average rating', error, { productId });
    throw error;
  }
}
export async function voteReview(reviewId: number, userId: number, isHelpful: boolean) {
  return await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO review_votes (review_id, user_id, is_helpful)
       VALUES ($1, $2, $3)
       ON CONFLICT (review_id, user_id) 
       DO UPDATE SET is_helpful = EXCLUDED.is_helpful, updated_at = CURRENT_TIMESTAMP`,
      [reviewId, userId, isHelpful]
    );

    // Sync helpful_count to reviews table
    await client.query(
      `UPDATE reviews 
       SET helpful_count = (
         SELECT COUNT(*) FROM review_votes 
         WHERE review_id = $1 AND is_helpful = true
       )
       WHERE id = $1`,
      [reviewId]
    );

    const checkRes = await client.query(
      'SELECT id FROM review_votes WHERE review_id = $1 AND user_id = $2',
      [reviewId, userId]
    );
    return checkRes.rows[0] || null;
  });
}
export async function getWishlist(userId: number) {
  try {
    const result = await pool.query(
      `SELECT w.*, p.*, 
              COALESCE(pr.average_rating, 0) as avg_rating,
              COALESCE(pr.total_ratings, 0) as review_count
       FROM wishlists w
       JOIN products p ON w.product_id = p.id
       LEFT JOIN product_ratings pr ON p.id = pr.product_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    logger.error("Error getting wishlist", error, { userId });
    throw error;
  }
}
export async function addToWishlist(userId: number, productId: number) {
  try {
    const result = await pool.query(
      `INSERT INTO wishlists (user_id, product_id, created_at, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       ON CONFLICT (user_id, product_id) DO NOTHING 
       RETURNING id`,
      [userId, productId]
    );
    return { id: result.rows[0]?.id || 0, userId, productId };
  } catch (error) {
    logger.error("Error adding to wishlist", error, { userId, productId });
    throw error;
  }
}
export async function removeFromWishlist(userId: number, productId: number) {
  try {
    await pool.query("DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2", [
      userId,
      productId,
    ]);
    return { userId, productId };
  } catch (error) {
    logger.error("Error removing from wishlist", error, { userId, productId });
    throw error;
  }
}
export async function isInWishlist(userId: number, productId: number): Promise<boolean> {
  try {
    const result = await pool.query(
      "SELECT id FROM wishlists WHERE user_id = $1 AND product_id = $2",
      [userId, productId]
    );
    return result.rows.length > 0;
  } catch (error) {
    logger.error("Error checking wishlist status", error, { userId, productId });
    return false;
  }
}
export async function getCoupons(filters?: {
  isActive?: boolean
  limit?: number
  offset?: number
}) {
  try {
    let sql = "SELECT * FROM coupons WHERE 1=1"
    const params: any[] = []
    let paramIndex = 1;

    if (filters?.isActive !== undefined) {
      sql += ` AND is_active = $${paramIndex}`
      params.push(filters.isActive)
      paramIndex++;
    }

    sql += " ORDER BY created_at DESC"

    if (filters?.limit) {
      sql += ` LIMIT $${paramIndex}`
      params.push(filters.limit)
      paramIndex++;
    }
    if (filters?.offset) {
      sql += ` OFFSET $${paramIndex}`
      params.push(filters.offset)
    }

    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    logger.error("Error getting coupons", error, { filters });
    throw error;
  }
}
export async function createCoupon(couponData: {
  code: string
  name?: string
  title?: string
  description?: string
  discountType?: "percentage" | "fixed"
  discountValue: number
  minPurchaseAmount?: number
  maxDiscountAmount?: number | null
  usageLimit?: number | null
  validFrom?: Date | null
  validUntil?: Date | null
  isActive?: boolean
}) {
  try {
    const result = await pool.query(
      `INSERT INTO coupons (code, name, title, description, discount_type, discount_value,
        min_purchase_amount, max_discount_amount, usage_limit, valid_from, valid_until, is_active,
        created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [
        couponData.code,
        couponData.name ?? null,
        couponData.title ?? null,
        couponData.description ?? null,
        couponData.discountType ?? "percentage",
        couponData.discountValue,
        couponData.minPurchaseAmount ?? 0,
        couponData.maxDiscountAmount ?? null,
        couponData.usageLimit ?? null,
        couponData.validFrom ?? null,
        couponData.validUntil ?? null,
        couponData.isActive !== false,
      ]
    );
    return result.rows[0];
  } catch (error) {
    logger.error("Error creating coupon", error, { couponData });
    throw error;
  }
}
export async function applyCoupon(userId: number, couponCode: string) {
  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');

    const couponResult = await client.query(
      `SELECT * FROM coupons
       WHERE code = $1 AND is_active = TRUE
         AND (valid_from IS NULL OR valid_from <= CURRENT_TIMESTAMP)
         AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP)
       FOR UPDATE`,
      [couponCode]
    );

    if (couponResult.rows.length === 0) {
      throw new Error("MĂ£ coupon khĂ´ng há»£p lá»‡ hoáº·c Ä‘Ă£ háº¿t háº¡n");
    }

    const coupon = couponResult.rows[0];

    if (coupon.usage_limit !== null) {
      const usedResult = await client.query(
        "SELECT COUNT(*) as cnt FROM user_coupons WHERE coupon_id = $1",
        [coupon.id]
      );
      if (parseInt(usedResult.rows[0].cnt) >= coupon.usage_limit) {
        throw new Error("MĂ£ coupon Ä‘Ă£ háº¿t lÆ°á»£t sá»­ dá»¥ng");
      }
    }

    const existingResult = await client.query(
      "SELECT id FROM user_coupons WHERE user_id = $1 AND coupon_id = $2",
      [userId, coupon.id]
    );
    if (existingResult.rows.length > 0) {
      throw new Error("Báº¡n Ä‘Ă£ sá»­ dá»¥ng mĂ£ coupon nĂ y rá»“i");
    }

    await client.query(
      "INSERT INTO user_coupons (user_id, coupon_id, used_at, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
      [userId, coupon.id]
    );

    await client.query('COMMIT');
    return {
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: parseFloat(coupon.discount_value),
      maxDiscountAmount: coupon.max_discount_amount ? parseFloat(coupon.max_discount_amount) : null,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error("Error applying coupon", error, { userId, couponCode });
    throw error;
  } finally {
    client.release();
  }
}
export async function trackDownload(downloadData: {
  userId: number;
  productId: number;
  ipAddress?: string;
  userAgent?: string;
}) {
  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');

    // âœ… FIX: Kiá»ƒm tra user Ä‘Ă£ mua sáº£n pháº©m chÆ°a
    const purchaseCheck = await client.query(
      'SELECT id FROM purchases WHERE user_id = $1 AND product_id = $2',
      [downloadData.userId, downloadData.productId]
    );

    if (purchaseCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new Error('Báº¡n cáº§n mua sáº£n pháº©m trÆ°á»›c khi táº£i xuá»‘ng');
    }

    // âœ… FIX: Race condition prevention - Lock product row vĂ  check download atomically
    // Lock product Ä‘á»ƒ trĂ¡nh concurrent updates
    const productLock = await client.query(
      'SELECT id FROM products WHERE id = $1 FOR UPDATE',
      [downloadData.productId]
    );

    if (productLock.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new Error('Product not found');
    }

    // âœ… FIX: Check existing download vá»›i lock Ä‘á»ƒ trĂ¡nh race condition
    const existingDownload = await client.query(
      `SELECT id, downloaded_at FROM downloads 
       WHERE user_id = $1 AND product_id = $2 
       AND DATE(downloaded_at AT TIME ZONE 'UTC') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
       FOR UPDATE`,
      [downloadData.userId, downloadData.productId]
    );

    let isNewDownload = existingDownload.rows.length === 0;
    let downloadResult;

    if (isNewDownload) {
      // âœ… FIX: Insert má»›i vĂ  tÄƒng download_count atomically trong cĂ¹ng transaction
      downloadResult = await client.query(
        `INSERT INTO downloads (user_id, product_id, ip_address, user_agent, downloaded_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         RETURNING id, downloaded_at`,
        [
          downloadData.userId,
          downloadData.productId,
          downloadData.ipAddress || null,
          downloadData.userAgent || null,
        ]
      );

      // âœ… FIX: TÄƒng download_count atomically (row Ä‘Ă£ Ä‘Æ°á»£c lock) - chá»‰ náº¿u column tá»“n táº¡i
      const hasDownloadCount = await hasDownloadCountColumn();
      if (hasDownloadCount) {
        await client.query(
          'UPDATE products SET download_count = download_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [downloadData.productId]
        );
      } else {
        // Náº¿u chÆ°a cĂ³ column, chá»‰ update updated_at
        await client.query(
          'UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [downloadData.productId]
        );
      }
    } else {
      // Update timestamp cá»§a download hiá»‡n táº¡i (row Ä‘Ă£ Ä‘Æ°á»£c lock)
      downloadResult = await client.query(
        `UPDATE downloads 
         SET downloaded_at = CURRENT_TIMESTAMP,
             ip_address = $1,
             user_agent = $2
         WHERE id = $3
         RETURNING id, downloaded_at`,
        [
          downloadData.ipAddress || null,
          downloadData.userAgent || null,
          existingDownload.rows[0].id,
        ]
      );
    }

    // Get product Ä‘á»ƒ tráº£ vá» download_url
    const productResult = await client.query(
      'SELECT download_url, file_url FROM products WHERE id = $1',
      [downloadData.productId]
    );

    await client.query('COMMIT');

    return {
      id: downloadResult.rows[0].id,
      downloadedAt: downloadResult.rows[0].downloaded_at,
      downloadUrl: productResult.rows[0]?.download_url || productResult.rows[0]?.file_url || null,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error tracking download', error, {
      userId: downloadData.userId,
      productId: downloadData.productId
    });
    throw error;
  } finally {
    client.release();
  }
}
export async function getDownloads(filters?: {
  userId?: number;
  productId?: number;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = `
      SELECT d.*, 
             u.username, 
             u.email,
             p.title as product_title
      FROM downloads d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN products p ON d.product_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.userId) {
      query += ` AND d.user_id = $${paramIndex}`;
      params.push(filters.userId);
      paramIndex++;
    }

    if (filters?.productId) {
      query += ` AND d.product_id = $${paramIndex}`;
      params.push(filters.productId);
      paramIndex++;
    }

    query += ' ORDER BY d.downloaded_at DESC';

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error getting downloads', error, { filters });
    throw error;
  }
}
export async function getCouponByCode(code: string) {
  try {
    const result = await pool.query(
      `SELECT * FROM coupons
       WHERE code = $1 AND is_active = TRUE
         AND (valid_from IS NULL OR valid_from <= CURRENT_TIMESTAMP)
         AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP)`,
      [code]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error("Error getting coupon by code", error, { code });
    throw error;
  }
}


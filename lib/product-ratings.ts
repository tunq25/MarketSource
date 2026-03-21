/**
 * Product Ratings Helper Functions
 * Quản lý ratings cho products
 */

import { query } from './database';
import { logger } from './logger';

/**
 * Get product rating từ bảng product_ratings
 */
export async function getProductRating(productId: number) {
  try {
    const rows = await query<any>(
      'SELECT * FROM product_ratings WHERE product_id = $1',
      [productId]
    );

    if (rows.length === 0) {
      return {
        product_id: productId,
        average_rating: 0,
        total_ratings: 0,
        updated_at: new Date(),
      };
    }

    const row = rows[0];
    return {
      product_id: row.product_id,
      average_rating: parseFloat(row.average_rating ?? '0'),
      total_ratings: parseInt(row.total_ratings ?? '0'),
      updated_at: row.updated_at,
    };
  } catch (error) {
    logger.error('Error getting product rating:', error);
    throw error;
  }
}

/**
 * Get ratings cho nhiều products cùng lúc
 */
export async function getProductRatings(productIds: number[]) {
  try {
    if (productIds.length === 0) {
      return [];
    }

    const rows = await query<any>(
      'SELECT * FROM product_ratings WHERE product_id = ANY($1)',
      [productIds]
    );

    const ratingsMap = new Map(
      rows.map((row: any) => [
        row.product_id,
        {
          product_id: row.product_id,
          average_rating: parseFloat(row.average_rating ?? '0'),
          total_ratings: parseInt(row.total_ratings ?? '0'),
          updated_at: row.updated_at,
        },
      ])
    );

    productIds.forEach((id) => {
      if (!ratingsMap.has(id)) {
        ratingsMap.set(id, {
          product_id: id,
          average_rating: 0,
          total_ratings: 0,
          updated_at: new Date(),
        });
      }
    });

    return Array.from(ratingsMap.values());
  } catch (error) {
    logger.error('Error getting product ratings:', error);
    throw error;
  }
}

/**
 * Get top rated products
 */
export async function getTopRatedProducts(limit: number = 10) {
  try {
    const rows = await query<any>(
      `SELECT 
        pr.*,
        p.title,
        p.price,
        p.thumbnail,
        p.image_url,
        p.category
       FROM product_ratings pr
       JOIN products p ON pr.product_id = p.id
       WHERE pr.total_ratings > 0 AND p.is_active = TRUE
       ORDER BY pr.average_rating DESC, pr.total_ratings DESC
       LIMIT $1`,
      [limit]
    );

    return rows.map((row: any) => ({
      product_id: row.product_id,
      average_rating: parseFloat(row.average_rating ?? '0'),
      total_ratings: parseInt(row.total_ratings ?? '0'),
      title: row.title,
      price: parseFloat(row.price ?? '0'),
      thumbnail: row.thumbnail || row.image_url,
      category: row.category,
      updated_at: row.updated_at,
    }));
  } catch (error) {
    logger.error('Error getting top rated products:', error);
    throw error;
  }
}

/**
 * Manually recalculate rating cho một product (nếu trigger không hoạt động)
 */
export async function recalculateProductRating(productId: number) {
  try {
    await query(
      `INSERT INTO product_ratings (product_id, average_rating, total_ratings, updated_at)
       SELECT 
         product_id,
         ROUND(AVG(rating), 2) as average_rating,
         COUNT(*) as total_ratings,
         CURRENT_TIMESTAMP
       FROM reviews
       WHERE product_id = $1
       GROUP BY product_id
       ON CONFLICT (product_id) DO UPDATE SET
         average_rating = EXCLUDED.average_rating,
         total_ratings = EXCLUDED.total_ratings,
         updated_at = EXCLUDED.updated_at`,
      [productId]
    );

    return await getProductRating(productId);
  } catch (error) {
    logger.error('Error recalculating product rating:', error);
    throw error;
  }
}

/**
 * Get rating statistics cho admin dashboard
 */
export async function getRatingStatistics() {
  try {
    const rows = await query<any>(
      `SELECT 
        COUNT(*) as total_products_with_ratings,
        AVG(average_rating) as overall_average_rating,
        SUM(total_ratings) as total_reviews,
        MAX(average_rating) as highest_rating,
        MIN(average_rating) as lowest_rating
       FROM product_ratings
       WHERE total_ratings > 0`
    );

    if (rows.length === 0) {
      return {
        total_products_with_ratings: 0,
        overall_average_rating: 0,
        total_reviews: 0,
        highest_rating: 0,
        lowest_rating: 0,
      };
    }

    const row = rows[0];
    return {
      total_products_with_ratings: parseInt(row.total_products_with_ratings ?? '0'),
      overall_average_rating: parseFloat(row.overall_average_rating ?? '0'),
      total_reviews: parseInt(row.total_reviews ?? '0'),
      highest_rating: parseFloat(row.highest_rating ?? '0'),
      lowest_rating: parseFloat(row.lowest_rating ?? '0'),
    };
  } catch (error) {
    logger.error('Error getting rating statistics:', error);
    throw error;
  }
}

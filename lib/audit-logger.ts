import { queryOne } from './database-mysql';
import { logger } from './logger';

export interface AuditLogData {
  adminId: number;
  adminEmail?: string;
  action: string;
  targetType?: string;
  targetId?: string | number;
  details?: any;
  ipAddress?: string;
}

/**
 * Log an admin action to the database
 */
export async function logAdminAction(data: AuditLogData) {
  try {
    const { pool } = await import('./database-mysql');
    const conn = await pool.getConnection();
    
    try {
      await conn.query(
        `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details, ip_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.adminId,
          `${data.action}${data.adminEmail ? ` (${data.adminEmail})` : ''}`,
          data.targetType || null,
          data.targetId ? String(data.targetId) : null,
          data.details ? JSON.stringify(data.details) : null,
          data.ipAddress || null
        ]
      );
    } finally {
      conn.release();
    }
  } catch (error) {
    // Fail silently but log to system logger
    logger.error('Failed to log admin action', error, { data });
  }
}

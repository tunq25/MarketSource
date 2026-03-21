import { pool } from './database';
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
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
      [
        data.adminId,
        `${data.action}${data.adminEmail ? ` (${data.adminEmail})` : ''}`,
        data.targetType || null,
        data.targetId ? String(data.targetId) : null,
        data.details ? JSON.stringify(data.details) : null,
        data.ipAddress || null
      ]
    );
  } catch (error) {
    logger.error('Failed to log admin action', error, { data });
  }
}

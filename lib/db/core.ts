import { Pool, PoolClient } from "pg";
import { logger } from "../logger";
import { notificationEmitter, NOTIFICATION_EVENTS } from "../events";
import { randomInt } from "crypto";
const isNetlify = process.env.NETLIFY === 'true' ||
  process.env.CONTEXT === 'production' ||
  process.env.CONTEXT === 'deploy-preview' ||
  process.env.NETLIFY_DEV === 'true';
const shouldSkipDbTest =
  process.env.SKIP_DB_CHECK === 'true' ||
  isNetlify ||
  process.env.VERCEL === '1';
const isNextBuildPhase =
  typeof process.env.NEXT_PHASE === 'string' &&
  process.env.NEXT_PHASE.startsWith('phase-');
const isStaticExportPhase = process.env.NEXT_PHASE === 'phase-export';
const isBuildTime = isNextBuildPhase || isStaticExportPhase || process.env.DOCKER_BUILD === 'true';
const isServerless = isNetlify || process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
function validateDatabaseConfig() {
  const hasDatabaseUrl = !!(
    process.env.DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL
  );

  const hasDbVars = !!(
    process.env.DB_HOST &&
    process.env.DB_USER &&
    process.env.DB_PASSWORD
  );

  if (!hasDatabaseUrl && !hasDbVars) {
    if (isServerless || shouldSkipDbTest || isBuildTime) {
      logger.warn('Database configuration missing (build/serverless environment)');
      return false;
    }
    throw new Error(
      'Database configuration required. Either set:\n' +
      '  1. DATABASE_URL (or NETLIFY_DATABASE_URL), or\n' +
      '  2. DB_HOST, DB_USER, DB_PASSWORD, DB_NAME'
    );
  }
  return true;
}
const poolConfig = isServerless
  ? {
    max: 1, // Serverless chỉ cần 1 connection per function instance
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000, // Tăng timeout cho serverless (20s)
    allowExitOnIdle: true, // Cho phép exit khi idle (serverless)
  }
  : {
    max: 20, // Traditional server: nhiều connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000, // Tăng timeout cho dev cục bộ (20s)
  };
function createPool(): Pool | null {
  // Validate config trước
  const hasValidConfig = validateDatabaseConfig();
  if (!hasValidConfig) {
    return null;
  }

  // ✅ FIX: Ưu tiên DATABASE_URL, POSTGRES_URL hoặc NETLIFY_DATABASE_URL
  let databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NETLIFY_DATABASE_URL;

  // ✅ FIX IPv4: Tự động chuyển sang Session Pooler (port 6543) nếu port 5432 - Đã vô hiệu hóa để dùng đúng URL
  // if (databaseUrl && databaseUrl.includes(':5432/') && !databaseUrl.includes('pgbouncer=true')) {
  //   // Thử chuyển sang Session Pooler cho IPv4 compatibility
  //   databaseUrl = databaseUrl.replace(':5432/', ':6543/');
  //   if (!databaseUrl.includes('?')) {
  //     databaseUrl += '?pgbouncer=true';
  //   } else {
  //     databaseUrl += '&pgbouncer=true';
  //   }
  //   logger.info('Auto-switched to Session Pooler (port 6543) for IPv4 compatibility');
  // }

  if (databaseUrl) {
    try {
      const pool = new Pool({
        connectionString: databaseUrl,
        ...poolConfig,
        // ✅ SSL: bật SSL mặc định (phù hợp Supabase / managed Postgres yêu cầu SSL)
        // Có thể tắt bằng cách đặt DB_SSL=disable trong env nếu dùng Postgres local không SSL
        ssl: process.env.DB_SSL === 'disable'
          ? undefined
          : {
            // ✅ FIX: Một số provider (Supabase/Neon) cần rejectUnauthorized: false trên Vercel/Cloudflare
            // trừ khi người dùng cấu hình CA cert thủ công.
            // Nếu không có DB_SSL_STRICT=true, sẽ mặc định là false để tránh lỗi SELF_SIGNED_CERT_IN_CHAIN.
            rejectUnauthorized: process.env.DB_SSL_STRICT === 'true',
          },
      });

      if (shouldSkipDbTest) {
        logger.info('Skipping PostgreSQL connection test via DATABASE_URL (build environment)', {
          isNetlify,
          hasNetlifyDatabaseUrl: !!process.env.NETLIFY_DATABASE_URL
        });
      } else {
        // Test connection async (không block)
        pool
          .query('SELECT NOW()')
          .then(() => {
            logger.info('PostgreSQL connection successful via DATABASE_URL', {
              isNetlify,
              hasNetlifyDatabaseUrl: !!process.env.NETLIFY_DATABASE_URL,
              usingPooler: databaseUrl.includes('6543')
            });
          })
          .catch((err) => {
            logger.warn('DATABASE_URL connection test failed', {
              error: err.message,
              isNetlify,
              code: (err as any)?.code
            });
          });
      }

      return pool;
    } catch (error: any) {
      logger.warn('Failed to parse DATABASE_URL, using individual variables', {
        error: error.message,
        isNetlify
      });
    }
  }

  // Fallback: dùng các biến riêng lẻ
  // ✅ SECURITY FIX: Bắt buộc env vars, không dùng hardcoded values
  if (!process.env.DB_PASSWORD || !process.env.DB_HOST || !process.env.DB_USER) {
    throw new Error('DB_PASSWORD, DB_HOST, and DB_USER environment variables are required. Please set them in your .env file.');
  }

  // ✅ FIX: Chỉ auto-switch port 6543 nếu KHÔNG phải môi trường production hoặc được yêu cầu
  let dbPort = parseInt(process.env.DB_PORT || '5432');
  if (dbPort === 5432 && process.env.NODE_ENV !== 'production' && process.env.AUTO_SWITCH_PORT !== 'false') {
    dbPort = 6543; // Auto-switch to Session Pooler for IPv4 compatibility (mostly for local dev)
    logger.info('Auto-switched DB_PORT to 6543 (Session Pooler) for IPv4 compatibility');
  }

  const config: any = {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, // Bắt buộc, không có fallback
    port: dbPort,
    ...poolConfig,
    // ✅ SSL fallback: tương tự nhánh DATABASE_URL
    ssl: process.env.DB_SSL === 'disable'
      ? undefined
      : {
        // ✅ FIX: Một số provider (Supabase/Neon) cần rejectUnauthorized: false
        rejectUnauthorized: process.env.DB_SSL_STRICT === 'true',
      },
  };

  logger.info('Using PostgreSQL connection (fallback)', {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
  });

  const pool = new Pool(config);

  if (shouldSkipDbTest) {
    logger.info('Skipping PostgreSQL connection test via discrete env vars (build environment)');
  } else {
    // Test connection async (không block)
    pool
      .query('SELECT NOW()')
      .then(() => {
        logger.info('PostgreSQL connection successful via individual variables');
      })
      .catch((err) => {
        logger.error('PostgreSQL connection failed', err, {
          host: config.host,
          port: config.port,
          database: config.database,
          user: config.user,
        });
      });
  }

  return pool;
}
const globalForDb = global as unknown as {
  poolInstance: Pool | null;
};
let poolInstance: Pool | null = globalForDb.poolInstance || null;
export function getPoolInstance(): Pool | null {
  if (!poolInstance) {
    try {
      poolInstance = createPool();
      if (process.env.NODE_ENV !== 'production') {
        globalForDb.poolInstance = poolInstance;
      }
      // Error handler - chỉ thêm nếu poolInstance không null
      if (poolInstance) {
        poolInstance.on('error', (err) => {
          logger.error('Unexpected error on idle PostgreSQL client', err, {
            hasDatabaseUrl: !!(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL),
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || '5433',
            database: process.env.DB_NAME || 'qtusdevmarket',
            isServerless,
            isNetlify,
            errorCode: (err as any)?.code,
            errorMessage: err.message,
          });

          // Reset pool instance on error để tạo lại connection
          // (quan trọng cho serverless environment)
          if (isServerless) {
            poolInstance = null;
          }
        });

        // ✅ FIX: Test connection ngay sau khi tạo pool (chỉ trong serverless)
        if (isServerless) {
          poolInstance.query('SELECT 1')
            .then(() => {
              logger.info('Database pool connection test successful (serverless)', {
                isNetlify,
                hasNetlifyDatabaseUrl: !!process.env.NETLIFY_DATABASE_URL
              });
            })
            .catch((err) => {
              logger.warn('Database pool connection test failed (serverless)', {
                error: err.message,
                code: (err as any)?.code,
                isNetlify,
                hasNetlifyDatabaseUrl: !!process.env.NETLIFY_DATABASE_URL
              });
              // Reset pool nếu test fail
              poolInstance = null;
            });
        }
      }
    } catch (error: unknown) {
      // ✅ FIX: Throw custom Error in serverless environment to fail fast instead of returning null
      if (isServerless) {
        logger.warn('Database pool creation failed in serverless environment', {
          error: error instanceof Error ? error.message : String(error),
          code: (error as any)?.code,
        });
        throw new Error('Database pool creation failed in serverless context.');
      }
      // Nếu không phải serverless, throw error như bình thường
      logger.error('Failed to create database pool', error as Error);
      throw error;
    }
  }
  return poolInstance;
}
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction failed, rolled back', error);
    throw error;
  } finally {
    client.release();
  }
}
export async function queryWithRetry<T = any>(
  queryText: string,
  params?: any[],
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await pool.query(queryText, params);
      return result as T;
    } catch (error: any) {
      lastError = error;

      // Không retry nếu là lỗi syntax hoặc validation
      if (error.code === '42601' || error.code === '42703' || error.code === '42P01') {
        throw error;
      }

      // Retry với exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        logger.warn(`Query failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`, {
          error: error.message,
          code: error.code,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Query failed after retries');
}
const QUERY_TIMEOUT_MS = 30000;
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    // ✅ FIX: Add timeout to prevent hanging queries
    const result = await Promise.race([
      pool.query(sql, params),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Query timeout after ${QUERY_TIMEOUT_MS}ms: ${sql.substring(0, 50)}...`)),
          QUERY_TIMEOUT_MS
        )
      )
    ]);
    return result.rows as T[];
  } catch (error: any) {
    logger.error('PostgreSQL query error', error, { sql: sql.substring(0, 100) });
    throw error;
  }
}
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] || null;
}
export const pool = new Proxy({} as Pool, {
  get(_target, prop, _receiver) {
    const instance = getPoolInstance();
    if (!instance) {
      // ✅ FIX: Nếu pool instance là null (database connection fail), throw error với message rõ ràng
      throw new Error('Database connection failed. Please check environment variables. Pool instance is null.');
    }
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
}) as Pool;
export function getPool(): Pool {
  const instance = getPoolInstance();
  if (!instance) {
    throw new Error('Database connection failed. Please check environment variables.');
  }
  return instance;
}
type UserProfileRow = {
  id: number;
  user_id: number;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  social_links: Record<string, string> | null;
  two_factor_enabled: boolean;
  two_factor_secret: string | null;
  two_factor_backup_codes: string[] | null;
  created_at: Date;
  updated_at: Date;
};
type UserProfilePayload = {
  userId: number;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  socialLinks?: Record<string, string | null> | null;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  twoFactorBackupCodes?: string[] | null;
};
let ensureUserProfilesTablePromise: Promise<void> | null = null;
let isEnsuringTable = false;
const ensureUserProfilesTable = async () => {
  // Skip database operations during build time
  if (shouldSkipDbTest) {
    return;
  }

  // Prevent multiple concurrent executions
  if (isEnsuringTable && ensureUserProfilesTablePromise) {
    return ensureUserProfilesTablePromise;
  }

  isEnsuringTable = true;
  ensureUserProfilesTablePromise = (async () => {
    try {
      // Use IF NOT EXISTS to prevent race conditions
      await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(120),
        country VARCHAR(120),
        postal_code VARCHAR(32),
        social_links JSONB,
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        two_factor_secret TEXT,
        two_factor_backup_codes TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

      // Use IF NOT EXISTS for index to prevent duplicate key errors
      await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
    `);
    } catch (error: any) {
      // Ignore duplicate key errors during concurrent table creation
      // Also ignore network errors during build time
      if (
        error?.code !== '23505' &&
        error?.code !== '42P07' &&
        error?.code !== 'ENETUNREACH' &&
        !error?.message?.includes('already exists') &&
        !error?.message?.includes('ENETUNREACH')
      ) {
        logger.error('Failed to ensure user_profiles table', error);
      }
    } finally {
      isEnsuringTable = false;
    }
  })();

  return ensureUserProfilesTablePromise;
};
async function ensureUserProfilesTableReady() {
  await ensureUserProfilesTable();
}
export async function getUserProfileByUserId(userId: number): Promise<UserProfileRow | null> {
  await ensureUserProfilesTableReady();
  const result = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
}
export async function getUserProfileByEmail(email: string): Promise<UserProfileRow | null> {
  const { getUserByEmail } = await import("./users");
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }
  return getUserProfileByUserId(user.id);
}
export async function upsertUserProfile(profile: UserProfilePayload): Promise<UserProfileRow> {
  await ensureUserProfilesTableReady();
  const payload = {
    phone: profile.phone ?? null,
    address: profile.address ?? null,
    city: profile.city ?? null,
    country: profile.country ?? null,
    postalCode: profile.postalCode ?? null,
    socialLinks: profile.socialLinks ? JSON.stringify(profile.socialLinks) : null,
    twoFactor: profile.twoFactorEnabled ?? false,
    twoFactorSecret: profile.twoFactorSecret ?? null,
    twoFactorBackupCodes: profile.twoFactorBackupCodes ?? null,
  };

  const result = await pool.query(
    `
      INSERT INTO user_profiles (
        user_id,
        phone,
        address,
        city,
        country,
        postal_code,
        social_links,
        two_factor_enabled,
        two_factor_secret,
        two_factor_backup_codes,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        country = EXCLUDED.country,
        postal_code = EXCLUDED.postal_code,
        social_links = EXCLUDED.social_links,
        two_factor_enabled = EXCLUDED.two_factor_enabled,
        two_factor_secret = EXCLUDED.two_factor_secret,
        two_factor_backup_codes = EXCLUDED.two_factor_backup_codes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `,
    [
      profile.userId,
      payload.phone,
      payload.address,
      payload.city,
      payload.country,
      payload.postalCode,
      payload.socialLinks,
      payload.twoFactor,
      payload.twoFactorSecret,
      payload.twoFactorBackupCodes,
    ]
  );

  return result.rows[0];
}
export async function saveUserTwoFactorSecret(
  userId: number,
  secret: string,
  backupCodes: string[]
): Promise<void> {
  await ensureUserProfilesTableReady();
  await pool.query(
    `
      INSERT INTO user_profiles (user_id, two_factor_enabled, two_factor_secret, two_factor_backup_codes, updated_at)
      VALUES ($1, TRUE, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        two_factor_enabled = TRUE,
        two_factor_secret = $2,
        two_factor_backup_codes = $3,
        updated_at = CURRENT_TIMESTAMP
    `,
    [userId, secret, backupCodes]
  );
}
export async function disableUserTwoFactor(userId: number): Promise<void> {
  await ensureUserProfilesTableReady();
  await pool.query(
    `
      INSERT INTO user_profiles (user_id, two_factor_enabled, two_factor_secret, two_factor_backup_codes, updated_at)
      VALUES ($1, FALSE, NULL, NULL, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        two_factor_enabled = FALSE,
        two_factor_secret = NULL,
        two_factor_backup_codes = NULL,
        updated_at = CURRENT_TIMESTAMP
    `,
    [userId]
  );
}
export async function updateUserPasswordHash(userId: number, passwordHash: string) {
  try {
    await pool.query("UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
      passwordHash,
      userId,
    ]);
  } catch (error) {
    logger.error("Error updating user password hash", error, { userId });
    throw error;
  }
}
export async function deletePasswordResetTokens(userId: number) {
  try {
    await pool.query("DELETE FROM password_resets WHERE user_id = $1", [userId]);
  } catch (error) {
    logger.error("Error deleting password reset tokens", error, { userId });
    throw error;
  }
}
export async function createPasswordResetTokenRecord(
  userId: number,
  token: string,
  expiresAt: Date
) {
  try {
    await pool.query(
      "INSERT INTO password_resets (user_id, token, expires_at, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)",
      [userId, token, expiresAt]
    );
  } catch (error) {
    logger.error("Error creating password reset token record", error, { userId });
    throw error;
  }
}
export async function findValidPasswordResetToken(token: string) {
  try {
    const result = await pool.query(
      `SELECT pr.*, u.email, u.id as user_id
       FROM password_resets pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.token = $1 AND pr.expires_at > CURRENT_TIMESTAMP`,
      [token]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error("Error finding valid password reset token", error, { token });
    throw error;
  }
}
export async function consumePasswordResetToken(token: string) {
  try {
    await pool.query("DELETE FROM password_resets WHERE token = $1", [token]);
  } catch (error) {
    logger.error("Error consuming password reset token", error, { token });
    throw error;
  }
}
const DEPOSIT_REF_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
let ensureUserDepositRefTablePromise: Promise<void> | null = null;
export async function ensureUserDepositReferenceTable(): Promise<void> {
  // Chỉ bỏ qua DDL lúc `next build` / export — không dùng shouldSkipDbTest (VERCEL=1 trên máy local
  // sẽ khiến bảng không bao giờ được tạo và JOIN deposits lỗi "relation does not exist").
  if (isBuildTime) return;
  if (!ensureUserDepositRefTablePromise) {
    ensureUserDepositRefTablePromise = (async () => {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS user_deposit_reference_codes (
            user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            code VARCHAR(16) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT user_deposit_ref_code_len CHECK (char_length(code) = 16)
          );
        `);
        await pool.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS uq_user_deposit_reference_codes_code
          ON user_deposit_reference_codes (code);
        `);
      } catch (e) {
        ensureUserDepositRefTablePromise = null;
        logger.error('ensureUserDepositReferenceTable failed', e);
        throw e;
      }
    })();
  }
  await ensureUserDepositRefTablePromise;
}
export function generateDepositReferenceCode(): string {
  let out = '';
  for (let i = 0; i < 16; i++) {
    out += DEPOSIT_REF_CHARSET[randomInt(DEPOSIT_REF_CHARSET.length)];
  }
  return out;
}
export async function getOrCreateUserDepositReferenceCode(userId: number): Promise<string> {
  const uid = typeof userId === 'number' ? userId : Number(userId);
  if (!Number.isFinite(uid) || uid <= 0 || !Number.isInteger(uid)) {
    throw new Error('Invalid user id');
  }
  await ensureUserDepositReferenceTable();
  const existing = await queryOne<{ code: string }>(
    'SELECT code FROM user_deposit_reference_codes WHERE user_id = $1',
    [uid]
  );
  if (existing?.code) return existing.code;

  for (let attempt = 0; attempt < 24; attempt++) {
    const code = generateDepositReferenceCode();
    try {
      const inserted = await queryOne<{ code: string }>(
        `INSERT INTO user_deposit_reference_codes (user_id, code) VALUES ($1, $2)
         ON CONFLICT (user_id) DO NOTHING
         RETURNING code`,
        [uid, code]
      );
      if (inserted?.code) return inserted.code;
      const afterRace = await queryOne<{ code: string }>(
        'SELECT code FROM user_deposit_reference_codes WHERE user_id = $1',
        [uid]
      );
      if (afterRace?.code) return afterRace.code;
    } catch (e: any) {
      if (e?.code === '23505') continue;
      throw e;
    }
  }
  throw new Error('Could not allocate unique deposit reference code');
}
export async function getDeposits(userId?: number) {
  try {
    await ensureUserDepositReferenceTable();
    let query = `
      SELECT d.*, 
             u.email AS "userEmail", 
             COALESCE(u.username, u.name, u.email) AS "userName", 
             r.code AS deposit_reference_code
      FROM deposits d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN user_deposit_reference_codes r ON r.user_id = d.user_id
    `;
    const params: any[] = [];

    if (userId) {
      query += ' WHERE d.user_id = $1';
      params.push(userId);
    }

    query += ' ORDER BY d.timestamp DESC';

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error getting deposits', error, { userId });
    throw error;
  }
}
let ensureDepositsSchemaPromise: Promise<void> | null = null;
export async function ensureDepositsSchema(): Promise<void> {
  if (isBuildTime) return;
  if (!ensureDepositsSchemaPromise) {
    ensureDepositsSchemaPromise = (async () => {
      try {
        // 1. Thêm cột transaction_code nếu chưa có
        await pool.query(`
          ALTER TABLE deposits 
          ADD COLUMN IF NOT EXISTS transaction_code VARCHAR(16) UNIQUE;
        `);
        
        // 2. Tạo index cho transaction_code nếu chưa có
        await pool.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS idx_deposits_transaction_code 
          ON deposits (transaction_code);
        `);

        logger.info('Deposits schema updated successfully (transaction_code added)');
      } catch (e: any) {
        ensureDepositsSchemaPromise = null;
        logger.error('ensureDepositsSchema failed', e);
        // Không throw để tránh crash app nếu lỗi không nghiêm trọng
      }
    })();
  }
  await ensureDepositsSchemaPromise;
}
export async function updateDepositStatus(
  depositId: number,
  status: 'pending' | 'approved' | 'rejected',
  approvedBy?: string
) {
  return await withTransaction(async (client) => {
    // 1. Lock deposit row
    const depositResult = await client.query(
      'SELECT status FROM deposits WHERE id = $1 FOR UPDATE',
      [depositId]
    );

    if (depositResult.rows.length === 0) {
      throw new Error('Deposit not found');
    }

    const currentStatus = depositResult.rows[0].status;

    // 2. Bảo vệ: Nếu đã Approved hoặc Rejected thì không cho phép quay ngược trạng thái
    // (Approved là trạng thái cuối cùng có ảnh hưởng đến Balance, không được đổi bậy bạ)
    if (currentStatus === 'approved' && status !== 'approved') {
      throw new Error(`Cannot change status from ${currentStatus} to ${status}. Approved deposits are final!`);
    }

    if (currentStatus === 'rejected' && status !== 'rejected' && status !== 'approved') {
      // Cho phép Rejected -> Approved (có thể do bấm nhầm), nhưng phải thông qua approveDepositAndUpdateBalance
      // Ở đây ta chỉ chặn if status là pending
       if (status === 'pending') {
         throw new Error(`Cannot change status from ${currentStatus} to pending.`);
       }
    }

    // Nếu status không đổi thì return luôn
    if (currentStatus === status) return;

    // 3. Update status
    const updates: string[] = [];
    const params: any[] = [status, depositId];
    
    updates.push('status = $1');

    if (status === 'approved' && approvedBy) {
      updates.push('approved_time = CURRENT_TIMESTAMP');
      updates.push(`approved_by = $${params.length + 1}`);
      params.push(approvedBy);
    }

    await client.query(
      `UPDATE deposits SET ${updates.join(', ')} WHERE id = $2`,
      params
    );
  });
}
export async function approveDepositAndUpdateBalance(
  depositId: number,
  userId: number,
  amount: number,
  approvedBy: string
) {
  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');

    // ✅ FIX: Lock deposit row và check status để tránh double approval
    const depositResult = await client.query(
      'SELECT id, user_id, amount, status FROM deposits WHERE id = $1 FOR UPDATE',
      [depositId]
    );

    if (depositResult.rows.length === 0) {
      throw new Error('Deposit not found');
    }

    const deposit = depositResult.rows[0];

    // ✅ FIX: Check deposit đã được approve chưa
    if (deposit.status === 'approved') {
      throw new Error('Deposit has already been approved');
    }

    if (deposit.status === 'rejected') {
      throw new Error('Deposit has been rejected and cannot be approved');
    }

    // ✅ FIX: Validate userId và amount match với deposit
    // ✅ FIX: Ép kiểu cả 2 vế để tránh string vs number mismatch
    if (Number(deposit.user_id) !== Number(userId)) {
      throw new Error('User ID mismatch with deposit');
    }

    // ✅ FIX: So sánh amount với epsilon cho PostgreSQL decimal
    if (Math.abs(parseFloat(deposit.amount) - Number(amount)) > 0.01) {
      throw new Error('Amount mismatch with deposit');
    }

    // Lock user row để tránh race condition
    const userResult = await client.query(
      'SELECT balance FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    // Update deposit status
    await client.query(
      `UPDATE deposits 
       SET status = 'approved', 
           approved_time = CURRENT_TIMESTAMP, 
           approved_by = $1 
       WHERE id = $2 AND status = 'pending'`,
      [approvedBy, depositId]
    );

    // ✅ FIX: Use SQL arithmetic to avoid JS float precision loss
    const updateResult = await client.query(
      'UPDATE users SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING balance',
      [amount, userId]
    );

    const newBalance = parseFloat(updateResult.rows[0].balance);

    await client.query('COMMIT');

    // ✅ NEW: Tạo thông báo real-time khi nạp tiền thành công
    try {
      const { createNotification } = await import("./admin");
      await createNotification({
        userId,
        type: 'deposit_approved',
        message: `Yêu cầu nạp ${amount.toLocaleString('vi-VN')}đ của bạn đã được duyệt thành công!`
      });
    } catch (err) {
      logger.warn('Failed to create notification for approved deposit', { userId, depositId });
    }

    return {
      success: true,
      newBalance,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error approving deposit', error, { depositId, userId, amount });
    throw error;
  } finally {
    client.release();
  }
}
export async function updateWithdrawalStatus(
  withdrawalId: number,
  status: 'pending' | 'approved' | 'rejected',
  approvedBy?: string
) {
  return await withTransaction(async (client) => {
    // 1. Lock withdrawal row
    const withdrawalRows = await client.query(
      'SELECT user_id, amount, status FROM withdrawals WHERE id = $1 FOR UPDATE',
      [withdrawalId]
    );

    if (withdrawalRows.rows.length === 0) {
      throw new Error('Withdrawal not found');
    }

    const withdrawal = withdrawalRows.rows[0];

    // No change needed if status is the same
    if (withdrawal.status === status) return;

    // 2. Handle Refund: Pending/Approved -> Rejected
    if ((withdrawal.status === 'pending' || withdrawal.status === 'approved') && status === 'rejected') {
      await client.query(
        'UPDATE users SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [withdrawal.amount, withdrawal.user_id]
      );
    }

    // 3. Handle Re-deduction: Rejected -> Pending/Approved
    if (withdrawal.status === 'rejected' && (status === 'pending' || status === 'approved')) {
      const userResult = await client.query(
        'SELECT balance FROM users WHERE id = $1 FOR UPDATE',
        [withdrawal.user_id]
      );
      const currentBalance = parseFloat(userResult.rows[0]?.balance || '0');

      if (currentBalance < parseFloat(withdrawal.amount)) {
        throw new Error('User does not have enough balance to re-approve this withdrawal');
      }

      await client.query(
        'UPDATE users SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [withdrawal.amount, withdrawal.user_id]
      );
    }

    // 4. Update status
    const updates: string[] = [];
    const params: any[] = [status, withdrawalId];

    updates.push('status = $1');

    if (status === 'approved' && approvedBy) {
      updates.push('approved_time = CURRENT_TIMESTAMP');
      updates.push(`approved_by = $${params.length + 1}`);
      params.push(approvedBy);
    }

    await client.query(
      `UPDATE withdrawals SET ${updates.join(', ')} WHERE id = $2`,
      params
    );

    // ✅ NEW: Tạo thông báo real-time khi trạng thái rút tiền thay đổi
    try {
      const statusVn = status === 'approved' ? 'đã được duyệt' : (status === 'rejected' ? 'đã bị từ chối' : 'đang chờ xử lý');
      const { createNotification } = await import("./admin");
      await createNotification({
        userId: withdrawal.user_id,
        type: `withdrawal_${status}`,
        message: `Yêu cầu rút ${withdrawal.amount.toLocaleString('vi-VN')}đ của bạn ${statusVn}.`
      });
    } catch (err) {
      logger.warn('Failed to create notification for withdrawal update', { withdrawalId });
    }
  });
}
let _hasDownloadCountCache: boolean | null = null;
export async function hasDownloadCountColumn(): Promise<boolean> {
  if (_hasDownloadCountCache !== null) {
    return _hasDownloadCountCache;
  }
  try {
    // ✅ FIX: Check pool instance trước khi query
    const instance = getPoolInstance();
    if (!instance) {
      logger.warn('Database pool instance is null, assuming download_count column does not exist');
      _hasDownloadCountCache = false;
      return false;
    }

    const result = await instance.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'download_count'
      ) as exists
    `);
    const exists = result.rows[0]?.exists || false;
    _hasDownloadCountCache = Boolean(exists);
    return _hasDownloadCountCache;
  } catch (error: any) {
    // ✅ FIX: Log error và assume column không tồn tại
    logger.warn('Error checking download_count column, assuming it does not exist', {
      error: error?.message || String(error),
      code: error?.code
    });
    _hasDownloadCountCache = false;
    return false;
  }
}

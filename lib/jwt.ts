import { SignJWT, jwtVerify } from 'jose';

let cachedSecret: Uint8Array | null = null;
let cachedSecretKey: string | null = null;

function getSecret(): Uint8Array {
  const secretKey = process.env.JWT_SECRET;

  if (!secretKey || secretKey === 'default-secret-key-change-in-production') {
    throw new Error(
      'JWT_SECRET is not set or using default value. Please set JWT_SECRET in environment variables.'
    );
  }

  if (!cachedSecret || cachedSecretKey !== secretKey) {
    cachedSecretKey = secretKey;
    cachedSecret = new TextEncoder().encode(secretKey);
  }

  return cachedSecret;
}

/**
 * Tạo admin JWT token
 */
export async function createAdminToken(userId: string, email: string): Promise<string> {
  const token = await new SignJWT({ userId, email, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());

  return token;
}

/**
 * Verify admin JWT token
 */
export async function verifyAdminToken(token: string): Promise<{ userId: string; email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch (error) {
    return null;
  }
}


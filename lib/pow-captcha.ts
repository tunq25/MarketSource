/**
 * PoW Captcha Server-side Verification
 * Thay thế hCaptcha — xác minh Proof of Work token tại server
 */

import { createHash } from 'crypto';

const DEFAULT_DIFFICULTY = 4;
const TOKEN_MAX_AGE_MS = 5 * 60 * 1000; // 5 phút

// ✅ BUG #6 FIX: Server-side challenge tracking chống replay
const usedChallenges = new Set<string>();

// Cleanup used challenges mỗi 5 phút
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    usedChallenges.clear();
  }, TOKEN_MAX_AGE_MS);
}

export interface PoWVerifyResult {
  success: boolean;
  error?: string;
}

/**
 * Xác minh PoW token từ client
 * @param token - Base64 encoded JSON { challenge, nonce, hash, timestamp }
 * @param difficulty - Số ký tự '0' đầu hash cần có (mặc định 4)
 */
export function verifyPoWCaptcha(
  token: string,
  difficulty: number = DEFAULT_DIFFICULTY
): PoWVerifyResult {
  // Bypass trong development mode
  if (process.env.NODE_ENV === 'development') {
    return { success: true };
  }

  if (!token) {
    return { success: false, error: 'missing-token' };
  }

  try {
    // 1. Giải mã token
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    const { challenge, nonce, hash, timestamp } = decoded;

    if (!challenge || nonce === undefined || !hash || !timestamp) {
      return { success: false, error: 'invalid-token-structure' };
    }

    // 2. Kiểm tra token expiry (5 phút)
    const age = Date.now() - timestamp;
    if (age > TOKEN_MAX_AGE_MS || age < 0) {
      return { success: false, error: 'token-expired' };
    }

    // 3. Kiểm tra độ khó — hash phải bắt đầu bằng N ký tự '0'
    const prefix = '0'.repeat(difficulty);
    if (!hash.startsWith(prefix)) {
      return { success: false, error: 'insufficient-difficulty' };
    }

    // 4. Tính toán lại hash để xác minh tính trung thực
    const verifyContent = `${challenge}${nonce}`;
    const actualHash = createHash('sha256').update(verifyContent).digest('hex');

    if (actualHash !== hash) {
      return { success: false, error: 'hash-mismatch' };
    }

    // 5. ✅ BUG #6 FIX: Chống replay — mỗi challenge chỉ dùng 1 lần
    if (usedChallenges.has(challenge)) {
      return { success: false, error: 'token-already-used' };
    }
    usedChallenges.add(challenge);

    return { success: true };
  } catch (error) {
    console.error('[PoW-Captcha] Verification error:', error);
    return { success: false, error: 'verification-failed' };
  }
}

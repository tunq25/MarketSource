// ============================================================
// Auth Helper Functions
// Export các functions liên quan đến authentication
// ============================================================

import { userManager } from './userManager';
import { logger } from './logger';

// ============================================================
// Device & IP Info
// ============================================================

/**
 * Get device information
 */
export function getDeviceInfo(): { userAgent: string; platform: string; language: string; deviceType: string; browser: string; os: string } {
  if (typeof window === 'undefined') {
    return { userAgent: 'unknown', platform: 'unknown', language: 'unknown', deviceType: 'unknown', browser: 'unknown', os: 'unknown' };
  }

  const ua = navigator.userAgent;
  let deviceType = 'desktop';
  let browser = 'unknown';
  let os = 'unknown';

  // Detect device type
  if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = 'tablet';
  }

  // Detect browser
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browser = 'Chrome';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
  } else if (ua.includes('Edg')) {
    browser = 'Edge';
  } else if (ua.includes('Opera') || ua.includes('OPR')) {
    browser = 'Opera';
  }

  // Detect OS
  if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Mac OS')) {
    os = 'macOS';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
  }

  return { 
    userAgent: ua,
    platform: navigator.platform || 'unknown',
    language: navigator.language || 'unknown',
    deviceType, 
    browser, 
    os 
  };
}

/**
 * Get IP address (client-side only)
 */
export async function getIPAddress(): Promise<string> {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  try {
    // Try to get IP from API
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    logger.warn('Failed to get IP address', { error });
    return 'unknown';
  }
}

// ============================================================
// Firebase Configuration Check
// ============================================================

/**
 * Check if Firebase is configured
 */
export function isFirebaseConfigured(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const requiredKeys = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ];

  return requiredKeys.every(key => {
    const value = process.env[key] || (window as any).__ENV__?.[key];
    return value && value !== 'your_firebase_api_key' && value !== '';
  });
}

// ============================================================
// Password Reset
// ============================================================

/**
 * Request password reset
 */
export async function requestPasswordReset(
  email: string,
  options?: { deviceInfo?: { deviceType?: string; browser?: string; os?: string }; ipAddress?: string }
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch('/api/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        deviceInfo: options?.deviceInfo,
        ipAddress: options?.ipAddress,
      }),
    });

    const data = await response.json();
    return {
      success: data.success || false,
      message: data.message || data.error,
    };
  } catch (error: any) {
    logger.error('Request password reset error:', error);
    return {
      success: false,
      message: error.message || 'Có lỗi xảy ra khi gửi yêu cầu đặt lại mật khẩu',
    };
  }
}

// ============================================================
// Change Password
// ============================================================

/**
 * Change user password
 * @param email - User email (optional, will use current user if not provided)
 * @param newPassword - New password
 * @param currentPassword - Current password (optional, for verification)
 */
export async function changePassword(
  emailOrCurrentPassword: string,
  newPassword: string,
  currentPassword?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    let email: string;
    let currentPwd: string | undefined;

    // Determine if first param is email or currentPassword
    if (currentPassword !== undefined) {
      // Called with (email, newPassword, currentPassword)
      email = emailOrCurrentPassword;
      currentPwd = currentPassword;
    } else {
      // Called with (currentPassword, newPassword) or (email, newPassword)
      const user = await userManager.getUser();
      if (user?.email && emailOrCurrentPassword.includes('@')) {
        // First param is email
        email = emailOrCurrentPassword;
      } else {
        // First param is currentPassword, get email from user
        if (!user || !user.email) {
          return {
            success: false,
            message: 'Bạn chưa đăng nhập',
          };
        }
        email = user.email;
        currentPwd = emailOrCurrentPassword;
      }
    }

    // Verify current password if provided
    if (currentPwd) {
      const verifyResponse = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: currentPwd,
        }),
      });

      const verifyData = await verifyResponse.json();
      if (!verifyData.success) {
        return {
          success: false,
          message: 'Mật khẩu hiện tại không chính xác',
        };
      }
    }

    // Update password
    const updateResponse = await fetch('/api/change-password-fallback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        newPassword,
      }),
    });

    const updateData = await updateResponse.json();
    return {
      success: updateData.success || false,
      message: updateData.message || updateData.error,
    };
  } catch (error: any) {
    logger.error('Change password error:', error);
    return {
      success: false,
      message: error.message || 'Có lỗi xảy ra khi đổi mật khẩu',
    };
  }
}

// ============================================================
// Export userManager
// ============================================================

export { userManager };


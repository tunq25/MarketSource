/**
 * Email Service - Nodemailer SMTP + Resend Fallback
 * ✅ Hỗ trợ gửi OTP qua Gmail SMTP
 * ✅ Fallback sang Resend API nếu SMTP không khả dụng
 * ✅ Template email chuyên nghiệp, bảo mật
 */

import nodemailer from 'nodemailer';
import { logger } from './logger';

// ============================================================
// SMTP TRANSPORTER (Gmail) - Ưu tiên
// ============================================================
let smtpTransporter: nodemailer.Transporter | null = null;

function getSmtpTransporter(): nodemailer.Transporter | null {
  if (smtpTransporter) return smtpTransporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '465');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass || pass === 'your_app_password_here') {
    console.warn('⚠️ SMTP chưa được cấu hình đầy đủ. Sẽ fallback sang Resend hoặc Console.');
    return null;
  }

  smtpTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return smtpTransporter;
}

// ============================================================
// RESEND FALLBACK
// ============================================================
let resend: any = null;

async function getResend() {
  if (resend) return resend;

  try {
    const resendModule = await import('resend');
    const Resend = resendModule.Resend || (resendModule as any).default;
    if (!Resend) throw new Error('Resend not found');

    resend = new Resend(process.env.RESEND_API_KEY);
    return resend;
  } catch (error) {
    console.warn('Resend not available, using console fallback');
    return null;
  }
}

// ============================================================
// CORE SEND EMAIL FUNCTION
// ============================================================
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions) {
  const fromAddress = options.from || process.env.SMTP_USER || process.env.EMAIL_FROM || 'noreply@qtusdevmarket.com';
  const toAddresses = Array.isArray(options.to) ? options.to : [options.to];

  // ✅ Strategy 1: SMTP (Gmail)
  const transporter = getSmtpTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"QTUS Dev Market" <${fromAddress}>`,
        to: toAddresses.join(', '),
        subject: options.subject,
        html: options.html,
      });
      logger.info('Email sent via SMTP', { messageId: info.messageId, to: toAddresses });
      return { success: true, id: info.messageId };
    } catch (smtpError: any) {
      logger.error('SMTP send failed, trying Resend fallback...', smtpError);
    }
  }

  // ✅ Strategy 2: Resend API
  const emailService = await getResend();
  if (emailService) {
    try {
      const result = await emailService.emails.send({
        from: fromAddress,
        to: toAddresses,
        subject: options.subject,
        html: options.html,
      });
      return { success: true, id: result.id };
    } catch (resendError: any) {
      logger.error('Resend send failed', resendError);
    }
  }

  // ✅ Strategy 3: Console fallback (dev only)
  console.log('📧 Email (console fallback):', {
    to: options.to,
    subject: options.subject,
    html: options.html.substring(0, 200) + '...',
  });
  return { success: true, id: 'console-fallback' };
}

// ============================================================
// 🔐 GỬI OTP QUA EMAIL - TEMPLATE CHUYÊN NGHIỆP
// ============================================================
export async function sendOtpEmail(email: string, otp: string) {
  const siteName = 'QTUS Dev Market';
  const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://qtusdev.website';
  const expiryMinutes = 15;

  const htmlTemplate = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mã xác nhận OTP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f2f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="480" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%); padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 22px; margin: 0 0 4px 0; font-weight: 700; letter-spacing: -0.5px;">🔐 ${siteName}</h1>
              <p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 0;">Xác nhận đặt lại mật khẩu</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 40px;">
              <p style="color: #1a1a2e; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                Xin chào,
              </p>
              <p style="color: #444; font-size: 14px; line-height: 1.7; margin: 0 0 28px 0;">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã xác nhận bên dưới để hoàn tất quá trình:
              </p>

              <!-- OTP Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <div style="background: linear-gradient(135deg, #f8f7ff 0%, #f3f0ff 100%); border: 2px dashed #6366f1; border-radius: 12px; padding: 24px 32px; display: inline-block;">
                      <p style="color: #6366f1; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 8px 0; font-weight: 600;">Mã xác nhận của bạn</p>
                      <p style="color: #1a1a2e; font-size: 36px; font-weight: 800; letter-spacing: 10px; margin: 0; font-family: 'Courier New', monospace;">${otp}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 14px 16px;">
                    <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
                      ⏱️ Mã có hiệu lực trong <strong>${expiryMinutes} phút</strong>. Không chia sẻ mã này với bất kỳ ai.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #666; font-size: 13px; line-height: 1.6; margin: 0;">
                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 40px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0 0 4px 0;">
                © ${new Date().getFullYear()} ${siteName}. All rights reserved.
              </p>
              <p style="margin: 0;">
                <a href="${siteUrl}" style="color: #6366f1; font-size: 12px; text-decoration: none;">${siteUrl}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: `[${siteName}] Mã xác nhận đặt lại mật khẩu: ${otp}`,
    html: htmlTemplate,
  });
}

// ============================================================
// CÁC TEMPLATE EMAIL KHÁC (giữ nguyên)
// ============================================================

export async function sendWelcomeEmail(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Chào mừng đến với QTUS Dev Market!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Chào mừng ${name}!</h1>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại QTUS Dev Market.</p>
        <p>Bạn có thể bắt đầu khám phá các sản phẩm source code chất lượng cao ngay bây giờ!</p>
        <a href="${process.env.NEXT_PUBLIC_URL}/products" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Xem sản phẩm
        </a>
      </div>
    `,
  });
}

export async function sendPurchaseConfirmationEmail(email: string, productName: string, amount: number) {
  return sendEmail({
    to: email,
    subject: `Xác nhận mua hàng: ${productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Cảm ơn bạn đã mua hàng!</h1>
        <p>Sản phẩm: <strong>${productName}</strong></p>
        <p>Số tiền: <strong>$${amount.toFixed(2)}</strong></p>
        <p>Bạn có thể tải sản phẩm từ dashboard của mình.</p>
        <a href="${process.env.NEXT_PUBLIC_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Xem Dashboard
        </a>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_URL}/auth/reset-password?token=${resetToken}`;

  return sendEmail({
    to: email,
    subject: 'Đặt lại mật khẩu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Đặt lại mật khẩu</h1>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấp vào liên kết bên dưới để tiếp tục:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Đặt lại mật khẩu
        </a>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Liên kết này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
        </p>
      </div>
    `,
  });
}

export async function sendDepositApprovalEmail(email: string, amount: number, newBalance: number) {
  return sendEmail({
    to: email,
    subject: `Nạp tiền thành công: $${amount.toFixed(2)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Nạp tiền thành công!</h1>
        <p>Số tiền nạp: <strong>$${amount.toFixed(2)}</strong></p>
        <p>Số dư hiện tại: <strong>$${newBalance.toFixed(2)}</strong></p>
        <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
        <a href="${process.env.NEXT_PUBLIC_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Xem Dashboard
        </a>
      </div>
    `,
  });
}

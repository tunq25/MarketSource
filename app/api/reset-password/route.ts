import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { findValidPasswordResetToken, consumePasswordResetToken, updateUserPasswordHash, getUserByEmail } from "@/lib/database-mysql"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"

/**
 * ✅ Reset Password - Xác thực OTP + Đổi mật khẩu
 * Flow: Nhận { email, otp, password } → Tìm user → Kiểm tra OTP → Hash password → Cập nhật DB
 */
const resetSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  otp: z.string().length(6, 'Mã OTP phải có 6 chữ số'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').max(128),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = resetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { email, otp, password } = validation.data;

    // ✅ Tìm user bằng email
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Email không tồn tại trong hệ thống.' },
        { status: 400 }
      );
    }

    // ✅ Tìm OTP hợp lệ (token = otp, chưa hết hạn)
    const tokenRecord = await findValidPasswordResetToken(otp);

    if (!tokenRecord) {
      return NextResponse.json(
        { success: false, error: 'Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.' },
        { status: 400 }
      );
    }

    // ✅ Kiểm tra OTP thuộc đúng user này
    if (tokenRecord.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Mã OTP không khớp với email này.' },
        { status: 400 }
      );
    }

    // ✅ Hash mật khẩu mới bằng bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // ✅ Cập nhật mật khẩu user trong DB
    await updateUserPasswordHash(tokenRecord.user_id, passwordHash);

    // ✅ Xóa OTP đã sử dụng (consume)
    await consumePasswordResetToken(otp);

    logger.info('Password reset successful', { userId: user.id, email });

    return NextResponse.json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công! Bạn có thể đăng nhập với mật khẩu mới.',
    });
  } catch (error: any) {
    logger.error('Reset password API error', error, { endpoint: '/api/reset-password' });
    return NextResponse.json(
      { success: false, error: error.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}

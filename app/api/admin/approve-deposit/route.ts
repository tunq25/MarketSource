import { NextRequest, NextResponse } from "next/server"
import {
  approveDepositAndUpdateBalance,
  updateDepositStatus,
  getUserById,
  normalizeUserIdMySQL as normalizeUserId,
  getUserIdByEmail,
} from "@/lib/database-mysql"
import { requireAdmin, validateRequest } from "@/lib/api-auth"
import { userManager } from "@/lib/userManager"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY FIX: CSRF protection cho admin routes
    const { csrfProtection } = await import('@/lib/csrf');
    const csrfCheck = csrfProtection(request);
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { success: false, error: csrfCheck.error || 'CSRF token validation failed' },
        { status: 403 }
      );
    }
    
    // Require admin authentication
    await requireAdmin(request);
    
    const { depositId, amount, userId, action, userEmail } = await request.json();

    // Validate request
    const validation = validateRequest({ depositId, userId, action }, {
      required: ['depositId', 'userId', 'action']
    });
    
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error || 'Missing required fields: depositId, userId, or action' },
        { status: 400 }
      );
    }

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Validate amount if approve
    if (action === 'approve' && (!amount || amount <= 0)) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0 for approval' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // ✅ FIX: Query deposit để validate (không cần FOR UPDATE vì approveDepositAndUpdateBalanceMySQL đã có transaction)
      const { queryOne } = await import('@/lib/database-mysql');
      const deposit = await queryOne<any>(
        'SELECT id, user_id, amount, status FROM deposits WHERE id = ?',
        [depositId]
      );
      
      if (!deposit) {
        return NextResponse.json(
          { success: false, error: 'Deposit not found' },
          { status: 404 }
        );
      }

      // ✅ FIX: Validate deposit status
      if (deposit.status === 'approved') {
        return NextResponse.json(
          { success: false, error: 'Deposit has already been approved' },
          { status: 400 }
        );
      }

      if (deposit.status === 'rejected') {
        return NextResponse.json(
          { success: false, error: 'Deposit has been rejected and cannot be approved' },
          { status: 400 }
        );
      }

      // ✅ FIX: Validate userId match với deposit
      const depositUserId = deposit.user_id;
      const normalizedDepositUserId = await normalizeUserId(userId, userEmail);
      
      if (normalizedDepositUserId !== depositUserId) {
        return NextResponse.json(
          { success: false, error: 'User ID mismatch with deposit' },
          { status: 400 }
        );
      }

      // ✅ FIX: Validate amount match với deposit
      if (parseFloat(deposit.amount) !== amount) {
        return NextResponse.json(
          { success: false, error: 'Amount mismatch with deposit' },
          { status: 400 }
        );
      }

      // Normalize userId: convert string uid to PostgreSQL INT
      const dbUserId = await normalizeUserId(userId, userEmail);
      
      if (!dbUserId) {
        return NextResponse.json(
          { success: false, error: 'Cannot resolve user ID. User may not exist in database.' },
          { status: 400 }
        );
      }
      
      // Use transaction-safe function để đảm bảo atomicity
      const adminEmail = process.env.ADMIN_EMAIL || 'admin';
      const result = await approveDepositAndUpdateBalance(
        parseInt(depositId),
        dbUserId,
        amount,
        adminEmail
      );
      
      // Sync với userManager (Firestore/localStorage) nếu userId là string uid
      if (typeof userId === 'string') {
        try {
          const userData = await userManager.getUserData(userId);
          if (userData) {
            await userManager.updateBalance(userId, result.newBalance);
          }
        } catch (syncError) {
          const { logger } = await import('@/lib/logger');
          logger.warn('userManager sync failed (non-critical)', { error: syncError, userId });
        }
      }

      // ✅ FIX: Tạo notification cho user khi deposit được approve
      try {
        const { createNotification } = await import('@/lib/database-mysql');
        await createNotification({
          userId: dbUserId,
          type: 'deposit_approved',
          message: `Yêu cầu nạp tiền ${amount.toLocaleString('vi-VN')}đ đã được duyệt. Số dư hiện tại: ${result.newBalance.toLocaleString('vi-VN')}đ`,
          isRead: false,
        });
      } catch (notifError) {
        const { logger } = await import('@/lib/logger');
        logger.warn('Failed to create notification (non-critical)', { error: notifError, userId: dbUserId });
      }
    } else if (action === 'reject') {
      // Normalize userId cho reject action
      const dbUserIdForReject = await normalizeUserId(userId, userEmail);
      
      if (!dbUserIdForReject) {
        return NextResponse.json(
          { success: false, error: 'Cannot resolve user ID. User may not exist in database.' },
          { status: 400 }
        );
      }
      
      // Update deposit status to rejected
      await updateDepositStatus(parseInt(depositId), 'rejected');
      
      // ✅ FIX: Tạo notification cho user khi deposit bị reject
      try {
        const { createNotification } = await import('@/lib/database-mysql');
        await createNotification({
          userId: dbUserIdForReject,
          type: 'deposit_rejected',
          message: `Yêu cầu nạp tiền ${amount.toLocaleString('vi-VN')}đ đã bị từ chối. Vui lòng liên hệ admin để biết thêm chi tiết.`,
          isRead: false,
        });
      } catch (notifError) {
        const { logger } = await import('@/lib/logger');
        logger.warn('Failed to create notification (non-critical)', { error: notifError, userId: dbUserIdForReject });
      }
    }

    // Send notification
    if (action === 'approve') {
      const message = `✅ <b>NẠP TIỀN ĐÃ ĐƯỢC DUYỆT</b>

💰 Số tiền: ${amount.toLocaleString('vi-VN')}đ
📝 Deposit ID: ${depositId}
⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}

<i>Tiền đã được cộng vào tài khoản người dùng.</i>`;

      // ✅ SECURITY FIX: Chỉ dùng server-side env vars (không expose ra client)
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      
      if (botToken && chatId) {
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: 'HTML'
            })
          });
        } catch (error) {
          const { logger } = await import('@/lib/logger');
          logger.error('Telegram notification failed', error, { context: 'deposit-approval' });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Deposit approved successfully' : 'Deposit rejected',
      depositId,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const { createErrorResponse, logError } = await import('@/lib/error-handler');
    logError('Error processing deposit approval', error);
    return NextResponse.json(
      createErrorResponse(error, 500),
      { status: 500 }
    );
  }
}

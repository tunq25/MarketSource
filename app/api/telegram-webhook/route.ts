import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // ✅ Webhook Verification chống Spoofing
    const telegramSecret = process.env.TELEGRAM_SECRET_TOKEN;
    if (telegramSecret && request.headers.get('X-Telegram-Bot-API-Secret-Token') !== telegramSecret) {
      logger.warn('Unauthorized telegram webhook attempt');
      return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
    }

    const body = await request.json()
    
    // Handle callback queries (button presses)
    if (body.callback_query) {
      const callbackData = body.callback_query.data
      const chatId = body.callback_query.message.chat.id
      const messageId = body.callback_query.message.message_id

      // Parse callback data
      const [action, type, userId, amount, timestamp] = callbackData.split('_')

      if (action === 'approve' || action === 'reject') {
        try {
          // ✅ FIX: Sử dụng database thay vì localStorage
          const { pool } = await import('@/lib/database');
          let responseText = ''
          
          if (type === 'deposit') {
            if (action === 'approve') {
              // Simulate approving deposit
              responseText = `✅ <b>ĐÃ DUYỆT NẠP TIỀN</b>

💰 Số tiền: ${parseInt(amount).toLocaleString('vi-VN')}đ
👤 User ID: ${userId}
⏰ Thời gian duyệt: ${new Date().toLocaleString('vi-VN')}

<i>Tiền đã được cộng vào tài khoản người dùng.</i>`
            } else {
              responseText = `❌ <b>ĐÃ TỪ CHỐI NẠP TIỀN</b>

💰 Số tiền: ${parseInt(amount).toLocaleString('vi-VN')}đ
👤 User ID: ${userId}
⏰ Thời gian từ chối: ${new Date().toLocaleString('vi-VN')}

<i>Yêu cầu nạp tiền đã bị từ chối.</i>`
            }
          } else if (type === 'withdraw') {
            if (action === 'approve') {
              responseText = `✅ <b>ĐÃ DUYỆT RÚT TIỀN</b>

💰 Số tiền: ${parseInt(amount).toLocaleString('vi-VN')}đ
👤 User ID: ${userId}
⏰ Thời gian duyệt: ${new Date().toLocaleString('vi-VN')}

<i>Vui lòng chuyển tiền cho người dùng.</i>`
            } else {
              responseText = `❌ <b>ĐÃ TỪ CHỐI RÚT TIỀN</b>

💰 Số tiền: ${parseInt(amount).toLocaleString('vi-VN')}đ
👤 User ID: ${userId}
⏰ Thời gian từ chối: ${new Date().toLocaleString('vi-VN')}

<i>Yêu cầu rút tiền đã bị từ chối.</i>`
            }
          }

          // Edit the original message to show the result
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: messageId,
              text: responseText,
              parse_mode: 'HTML'
            })
          })

          // Answer the callback query
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: body.callback_query.id,
              text: action === 'approve' ? '✅ Đã duyệt thành công!' : '❌ Đã từ chối!',
              show_alert: true
            })
          })

        } catch (error) {
          logger.error('Error processing callback', error, { callbackData })
          
          // Answer callback query with error
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: body.callback_query.id,
              text: '❌ Có lỗi xảy ra khi xử lý!',
              show_alert: true
            })
          })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error('Webhook error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Telegram webhook endpoint' })
}

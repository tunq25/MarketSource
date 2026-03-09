import { logger } from './logger'

export const sendTelegramNotification = async (message: string) => {
  try {
    if (!process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || !process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID) {
      console.warn('Telegram credentials not configured')
      return false
    }

    const response = await fetch(`https://api.telegram.org/bot${process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      }),
    })

    return response.ok
  } catch (error) {
    logger.error('Telegram notification error:', error)
    return false
  }
}

export const sendDepositNotification = async (depositInfo: any) => {
  const message = `💳 <b>YÊU CẦU NẠP TIỀN MỚI</b>

👤 <b>Khách hàng:</b> ${depositInfo.userName}
📧 <b>Email:</b> ${depositInfo.userEmail}
💰 <b>Số tiền:</b> ${depositInfo.amount.toLocaleString('vi-VN')}đ
🏦 <b>Phương thức:</b> ${depositInfo.method}
📝 <b>Mã GD:</b> ${depositInfo.transactionId}
⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}

<i>Vui lòng kiểm tra và duyệt yêu cầu!</i>`

  return await sendTelegramNotification(message)
}

export const sendWithdrawalNotification = async (withdrawalInfo: any) => {
  const message = `💸 <b>YÊU CẦU RÚT TIỀN MỚI</b>

👤 <b>Khách hàng:</b> ${withdrawalInfo.userName}
📧 <b>Email:</b> ${withdrawalInfo.userEmail}
💰 <b>Số tiền:</b> ${withdrawalInfo.amount.toLocaleString('vi-VN')}đ
🏦 <b>Phương thức:</b> ${withdrawalInfo.method}
📝 <b>Thông tin:</b> ${withdrawalInfo.accountName} - ${withdrawalInfo.accountNumber}
⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}

<i>Vui lòng kiểm tra và xử lý!</i>`

  return await sendTelegramNotification(message)
}

export const sendPurchaseNotification = async (purchaseInfo: any) => {
  const message = `🛒 <b>ĐƠN HÀNG MỚI</b>

👤 <b>Khách hàng:</b> ${purchaseInfo.userName}
📧 <b>Email:</b> ${purchaseInfo.userEmail}
🛍️ <b>Sản phẩm:</b> ${purchaseInfo.productTitle}
💰 <b>Giá trị:</b> ${purchaseInfo.amount.toLocaleString('vi-VN')}đ
⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}

<i>Đơn hàng đã được thanh toán thành công!</i>`

  return await sendTelegramNotification(message)
}

// Device info helper
export const getDeviceInfo = (): { deviceType: string; browser: string; os: string } => {
  if (typeof navigator === 'undefined') {
    return { deviceType: 'Unknown', browser: 'Unknown', os: 'Unknown' };
  }
  return {
    deviceType: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
    browser: navigator.userAgent.split(')')[0].split(' ').pop() || 'Unknown',
    os: navigator.platform || 'Unknown',
  };
};

// IP address helper
export const getIPAddress = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'Unknown';
  } catch {
    return 'Unknown';
  }
};
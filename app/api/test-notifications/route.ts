import { NextResponse } from 'next/server'
import { sendDepositNotification, sendWithdrawalNotification } from '@/lib/notifications'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // Test deposit notification
    const depositData = {
      userName: "Test User",
      userEmail: "test@example.com",
      amount: 100000,
      method: "MB Bank",
      transactionId: "TXN123456789",
      requestTimeFormatted: new Date().toLocaleString("vi-VN")
    }

    await sendDepositNotification(depositData)

    // Test withdrawal notification
    const withdrawalData = {
      userName: "Test User",
      userEmail: "test@example.com",
      amount: 50000,
      fee: 5000,
      receiveAmount: 45000,
      bankName: "Vietcombank",
      accountNumber: "1234567890",
      accountName: "TEST USER",
      requestTimeFormatted: new Date().toLocaleString("vi-VN")
    }

    await sendWithdrawalNotification(withdrawalData)

    return NextResponse.json({
      success: true,
      message: "Test notifications sent successfully"
    })
  } catch (error: any) {
    logger.error('Test notification error', error, { endpoint: '/api/test-notifications' })
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { query, createNotificationMySQL } from "@/lib/database-mysql"
import { requireAdmin } from "@/lib/api-auth"
import { logger } from "@/lib/logger"
import { sendEmail } from "@/lib/email"

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
    try {
        // 1. Check admin auth
        const admin = await requireAdmin(request)
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { userId, type, title, message, sendEmail: shouldSendEmail, sendSystem } = await request.json()

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 })
        }

        // 2. Identify target users
        let targetUsers: { id: number; email: string; name: string }[] = []

        if (userId === "all") {
            targetUsers = await query<any>(
                "SELECT id, email, name FROM users"
            )
        } else {
            const user = await query<any>(
                "SELECT id, email, name FROM users WHERE id = ?",
                [userId]
            )
            if (user && user.length > 0) {
                targetUsers = user
            }
        }

        if (targetUsers.length === 0) {
            return NextResponse.json({ error: "No target users found" }, { status: 404 })
        }

        // 3. Process notifications
        const results = {
            system: 0,
            email: 0,
            errors: [] as string[]
        }

        for (const user of targetUsers) {
            // System Notification
            if (sendSystem !== false) {
                try {
                    await createNotificationMySQL({
                        userId: user.id,
                        type: type || 'system',
                        message: message,
                        isRead: false
                    })
                    results.system++
                } catch (err: any) {
                    results.errors.push(`System notification failed for ${user.email}: ${err.message}`)
                }
            }

            // Email Notification
            if (shouldSendEmail) {
                try {
                    const { sendSystemNotificationEmail } = await import('@/lib/email');
                    await sendSystemNotificationEmail(
                        user.email,
                        title || 'Bạn có thông báo mới từ hệ thống',
                        message
                    )
                    results.email++
                } catch (err: any) {
                    results.errors.push(`Email failed for ${user.email}: ${err.message}`)
                }
            }
        }

        return NextResponse.json({
            success: true,
            results,
            message: `Đã gửi ${results.system} thông báo hệ thống và ${results.email} email.`
        })

    } catch (error: any) {
        logger.error("Admin send notification error", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

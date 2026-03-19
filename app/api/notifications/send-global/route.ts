import { NextRequest, NextResponse } from "next/server"
import { verifyFirebaseToken, requireAdmin } from "@/lib/api-auth"
import { query } from "@/lib/database-mysql"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        // Require admin authentication để tạo notification
        await requireAdmin(request);

        const body = await request.json()
        const { type, message, title } = body

        if (!type || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: type, message' },
                { status: 400 }
            )
        }

        // Format message with title if provided
        const finalMessage = title ? `**${title}**\n${message}` : message;

        // Lấy tất cả user IDs
        const users = await query<any>("SELECT id FROM users WHERE status = 'active' OR status IS NULL", [])

        if (!users || users.length === 0) {
            return NextResponse.json({ success: false, error: 'No users found' }, { status: 404 })
        }

        // Prepare batch insert cho notifications
        // Bulk insert: INSERT INTO notifications (user_id, type, message, is_read, created_at) VALUES (?,?,?,?,NOW()), (?,?,?,?,NOW())...
        const values: any[] = []
        const placeholders: string[] = []

        users.forEach((u: any) => {
            placeholders.push('(?, ?, ?, ?, NOW())')
            values.push(u.id, type, finalMessage, 0)
        })

        const sql = `INSERT INTO notifications (user_id, type, message, is_read, created_at) VALUES ${placeholders.join(', ')}`

        // Execute the bulk insert
        await query(sql, values)

        return NextResponse.json({
            success: true,
            message: `Đã gửi thông báo cho ${users.length} người dùng.`
        })

    } catch (error: any) {
        const { logger } = await import('@/lib/logger');
        logger.error('Notification Send-Global error', error, { endpoint: '/api/notifications/send-global' });

        if (error.message?.includes('Unauthorized')) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }

        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

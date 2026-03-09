import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/database'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/api-auth'
import { checkRateLimitAndRespond } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// Ensure the table exists (PostgreSQL syntax) - Khớp với schema database thực tế
async function ensureSettingsTable() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id BIGSERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        type VARCHAR(255),
        group_name VARCHAR(255),
        label VARCHAR(255),
        description TEXT,
        is_public BOOLEAN DEFAULT true,
        updated_by BIGINT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    } catch (error) {
        logger.error('Error creating settings table', { error })
    }
}

// Lấy tất cả cài đặt (Public endpoint)
export async function GET(request: NextRequest) {
    try {
        const rateLimitResponse = await checkRateLimitAndRespond(request, 100, 60, 'get-settings')
        if (rateLimitResponse) return rateLimitResponse

        await ensureSettingsTable()
        const result = await pool.query('SELECT key, value FROM settings')

        // Convert DB rows into a key-value object
        const settingsObj: Record<string, string> = {}
        if (Array.isArray(result.rows)) {
            result.rows.forEach((row: any) => {
                settingsObj[row.key] = row.value
            })
        }

        return NextResponse.json({ success: true, settings: settingsObj })
    } catch (error: any) {
        logger.error('Error fetching settings', error)
        return NextResponse.json({
            error: 'Failed to fetch settings',
            detail: error.message,
            code: error.code,
            settings: {}
        }, { status: 500 })
    }
}

// Cập nhật cài đặt (Yêu cầu quyền Admin)
export async function POST(request: NextRequest) {
    try {
        const rateLimitResponse = await checkRateLimitAndRespond(request, 20, 60, 'update-settings')
        if (rateLimitResponse) return rateLimitResponse

        // Yêu cầu quyền admin
        await requireAdmin(request)

        const body = await request.json()
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
        }

        await ensureSettingsTable()

        // Upsert từng setting (PostgreSQL ON CONFLICT syntax)
        for (const [key, value] of Object.entries(body)) {
            if (typeof key === 'string' && typeof value === 'string') {
                await pool.query(
                    `INSERT INTO settings (key, value, updated_at) 
                     VALUES ($1, $2, CURRENT_TIMESTAMP) 
                     ON CONFLICT (key) DO UPDATE SET 
                       value = $2, 
                       updated_at = CURRENT_TIMESTAMP`,
                    [key, value]
                )
            }
        }

        return NextResponse.json({ success: true, message: 'Cập nhật giao diện thành công' })
    } catch (error: any) {
        logger.error('Error updating settings', { error: error.message || error.toString() })
        return NextResponse.json({ error: error.message || 'Lỗi khi cập nhật cài đặt' }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseToken, getClientIP } from '@/lib/api-auth'
import { getUserIdByEmail, query } from '@/lib/database-mysql'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/sessions
 * Trả về thiết bị / session hiện tại của user
 * Nếu chưa có bảng user_sessions, trả về session hiện tại được build từ request headers
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const { checkRateLimitAndRespond } = await import('@/lib/rate-limit')
    const rateLimitRes = await checkRateLimitAndRespond(request, 20, 60, 'sessions-get')
    if (rateLimitRes) return rateLimitRes

    // Auth
    const authUser = await verifyFirebaseToken(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const ip = getClientIP(request)
    const ua = request.headers.get('user-agent') || ''

    // Phân tích User-Agent
    const isMobile = /mobile|android|iphone|ipad/i.test(ua)
    const isTablet = /tablet|ipad/i.test(ua)
    const deviceType = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop'

    let browser = 'Unknown'
    if (/edg/i.test(ua)) browser = 'Edge'
    else if (/chrome/i.test(ua)) browser = 'Chrome'
    else if (/firefox/i.test(ua)) browser = 'Firefox'
    else if (/safari/i.test(ua)) browser = 'Safari'
    else if (/opera/i.test(ua)) browser = 'Opera'

    let os = 'Unknown'
    if (/windows/i.test(ua)) os = 'Windows'
    else if (/mac os/i.test(ua)) os = 'macOS'
    else if (/linux/i.test(ua)) os = 'Linux'
    else if (/android/i.test(ua)) os = 'Android'
    else if (/iphone|ipad/i.test(ua)) os = 'iOS'

    // Thử query bảng user_sessions nếu tồn tại
    let sessions: any[] = []
    try {
      const dbUserId = await getUserIdByEmail(authUser.email || '')
      if (dbUserId) {
        const rows = await query(`
          SELECT 
            id,
            device_name,
            device_type,
            browser,
            os,
            ip_address,
            location,
            last_activity,
            is_current,
            is_trusted,
            created_at
          FROM user_sessions
          WHERE user_id = $1
          ORDER BY last_activity DESC
          LIMIT 20
        `, [dbUserId])
        
        if (rows && rows.length > 0) {
          sessions = rows.map((s: any) => ({
            id: s.id,
            device_name: s.device_name || `${s.device_type || deviceType} - ${s.browser || browser}`,
            device_type: s.device_type || deviceType,
            browser: s.browser || browser,
            os: s.os || os,
            ip_address: s.ip_address || ip,
            location: s.location,
            last_activity: s.last_activity || s.created_at,
            is_current: Boolean(s.is_current),
            is_trusted: Boolean(s.is_trusted),
          }))
        }
      }
    } catch {
      // Bảng user_sessions chưa tồn tại → trả session hiện tại
    }

    // Nếu không có sessions từ DB, trả session hiện tại được build từ request
    if (sessions.length === 0) {
      sessions = [{
        id: `current-${Date.now()}`,
        device_name: `${deviceType} - ${browser}`,
        device_type: deviceType,
        browser,
        os,
        ip_address: ip,
        location: null,
        last_activity: new Date().toISOString(),
        is_current: true,
        is_trusted: true,
      }]
    }

    return NextResponse.json({ success: true, sessions })
  } catch (error: any) {
    logger.error('Sessions API error', error)
    return NextResponse.json({ success: false, sessions: [], error: error.message }, { status: 500 })
  }
}

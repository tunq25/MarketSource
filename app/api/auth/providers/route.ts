import { NextResponse } from "next/server"

/**
 * Cho client biết provider OAuth nào đã cấu hình (không lộ secret).
 */
export function GET() {
  return NextResponse.json({
    google: Boolean(process.env.GOOGLE_CLIENT_ID),
    github: Boolean(process.env.GITHUB_CLIENT_ID),
    facebook: Boolean(process.env.FACEBOOK_CLIENT_ID),
  })
}

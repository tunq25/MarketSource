import { NextRequest, NextResponse } from "next/server"
import { uploadAvatarFile } from "@/lib/storage/avatar"
import { createOrUpdateUser } from "@/lib/database-mysql"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const email = formData.get("email")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Thiếu file upload" }, { status: 400 })
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Thiếu email người dùng" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (buffer.length > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Avatar vượt quá giới hạn 2MB" },
        { status: 400 }
      )
    }

    const avatarUrl = await uploadAvatarFile(buffer, file.type || "image/png")

    await createOrUpdateUser({
      email,
      avatarUrl,
    })

    return NextResponse.json({ success: true, avatarUrl })
  } catch (error: any) {
    logger.error("Avatar upload failed", error)
    return NextResponse.json(
      { success: false, error: error.message || "Không thể upload avatar" },
      { status: 500 }
    )
  }
}

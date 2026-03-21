"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useState, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "err">("idle")
  const [msg, setMsg] = useState<string | null>(null)

  const resend = async () => {
    if (!email) {
      setMsg("Thiếu email. Quay lại đăng nhập hoặc đăng ký.")
      setStatus("err")
      return
    }
    setStatus("sending")
    setMsg(null)
    try {
      const { getCsrfHeaders } = await import("@/lib/csrf-client")
      const csrf = await getCsrfHeaders()
      const res = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrf },
        credentials: "include",
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg(data.error || "Không gửi được email")
        setStatus("err")
        return
      }
      setStatus("sent")
      setMsg("Đã gửi email xác minh. Vui lòng kiểm tra hộp thư.")
    } catch {
      setStatus("err")
      setMsg("Lỗi mạng. Thử lại sau.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Xác minh email</CardTitle>
          <CardDescription>
            Chúng tôi đã gửi email kèm link xác minh tới{" "}
            <strong>{email || "địa chỉ bạn đã đăng ký"}</strong>. Sau khi nhấn link trong email, bạn có thể đăng nhập bình thường.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {msg && (
            <p className={`text-sm ${status === "err" ? "text-red-600" : "text-green-600"}`}>{msg}</p>
          )}
          <Button className="w-full" variant="secondary" onClick={resend} disabled={status === "sending"}>
            {status === "sending" ? "Đang gửi…" : "Gửi lại email xác minh"}
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login">Đến trang đăng nhập</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <VerifyEmailContent />
    </Suspense>
  )
}

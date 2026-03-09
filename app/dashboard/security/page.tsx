"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const runtime = 'nodejs'

const settings = [
  { id: "2fa", title: "Xác thực 2 lớp", description: "Yêu cầu mã OTP khi đăng nhập", defaultChecked: true },
  { id: "login-alert", title: "Cảnh báo đăng nhập", description: "Gửi email khi phát hiện thiết bị lạ", defaultChecked: true },
  { id: "session-lock", title: "Khoá phiên nhanh", description: "Tự động đăng xuất sau 15 phút không hoạt động", defaultChecked: false },
]

export default function SecurityPage() {
  const shouldReduce = useReducedMotion()
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Bảo mật</h1>
        <p className="text-muted-foreground">Kiểm soát các lớp bảo vệ quan trọng cho tài khoản của bạn.</p>
      </header>
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Thiết lập an toàn</CardTitle>
          <CardDescription>Bật tắt nhanh các tuỳ chọn bảo mật.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.map((setting, index) => (
            <motion.div
              key={setting.id}
              initial={{ opacity: 0, x: shouldReduce ? 0 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between rounded-xl border px-4 py-3"
            >
              <div>
                <p className="font-medium">{setting.title}</p>
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              </div>
              <Switch defaultChecked={setting.defaultChecked} aria-label={setting.title} />
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}


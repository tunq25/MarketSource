"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentUser } from "@/hooks/use-current-user"
import { apiGet } from "@/lib/api-client"

export const runtime = 'nodejs'

const fetcher = async (endpoint: string) => apiGet(endpoint)

export default function WalletPage() {
  const user = useCurrentUser()
  const shouldReduce = useReducedMotion()
  const { data } = useSWR(user ? "/api/deposits?userId=self" : null, fetcher, {
    revalidateOnFocus: false,
  })

  const deposits = useMemo(() => data?.deposits ?? [], [data])

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Ví QtusDev</h1>
        <p className="text-muted-foreground">Nạp / rút và kiểm soát số dư của bạn.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>Số dư hiện tại</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-bold">
              {(user?.balance ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
            </p>
            <div className="flex gap-2">
              <Button size="lg" className="flex-1">
                Nạp tiền
              </Button>
              <Button size="lg" variant="outline" className="flex-1">
                Rút tiền
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>Thiết lập bảo mật</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Bật 2FA và cảnh báo đăng nhập để bảo vệ tài khoản.</p>
            <Button variant="outline">Truy cập trang bảo mật</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Lịch sử giao dịch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 text-sm font-medium text-muted-foreground">
            <span>Ngày</span>
            <span>Số tiền</span>
            <span>Phương thức</span>
            <span>Trạng thái</span>
          </div>
          <div className="divide-y">
            {deposits.slice(0, 5).map((deposit: any, index: number) => (
              <motion.div
                key={deposit.id}
                initial={{ opacity: 0, y: shouldReduce ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="grid grid-cols-4 py-3 text-sm"
              >
                <span>{new Date(deposit.timestamp || deposit.created_at).toLocaleDateString("vi-VN")}</span>
                <span className="font-semibold text-primary">
                  {Number(deposit.amount).toLocaleString("vi-VN")}đ
                </span>
                <span className="capitalize">{deposit.method || "chuyển khoản"}</span>
                <span className="capitalize">{deposit.status}</span>
              </motion.div>
            ))}
            {deposits.length === 0 && <p className="py-4 text-muted-foreground">Chưa có giao dịch.</p>}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}


"use client"

import useSWR from "swr"
import { useMemo, useCallback } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useDashboardEvents } from "@/hooks/use-dashboard-events"
import { apiGet } from "@/lib/api-client"

export const runtime = 'nodejs'

const fetcher = async (endpoint: string) => apiGet(endpoint)

export default function OrdersPage() {
  const user = useCurrentUser()
  const shouldReduce = useReducedMotion()
  const { data, isLoading, mutate } = useSWR(user ? "/api/dashboard/orders" : null, fetcher, {
    revalidateOnFocus: false,
  })

  useDashboardEvents(
    useCallback(() => {
      mutate()
    }, [mutate]),
  )

  const orders = useMemo(() => data?.data ?? [], [data])

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Đơn hàng của bạn</h1>
        <p className="text-muted-foreground">Theo dõi các giao dịch mới nhất và trạng thái phát hành</p>
      </header>
      <div className="rounded-2xl border bg-card shadow-lg">
        <div className="grid grid-cols-5 px-6 py-4 text-sm font-medium text-muted-foreground">
          <span>Mã đơn</span>
          <span>Sản phẩm</span>
          <span>Giá</span>
          <span>Trạng thái</span>
          <span>Thời gian</span>
        </div>
        {isLoading && <div className="p-6 text-muted-foreground">Đang tải...</div>}
        {!isLoading && orders.length === 0 && <div className="p-6 text-muted-foreground">Chưa có giao dịch nào.</div>}
        <ul className="divide-y">
          {orders.map((order: any, index: number) => (
            <motion.li
              key={order.id}
              initial={{ opacity: 0, y: shouldReduce ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="grid grid-cols-5 px-6 py-4 text-sm"
            >
              <span className="font-medium">{order.id.slice(0, 8)}</span>
              <span>{order.product_title || order.product_id}</span>
              <span className="font-semibold text-primary">{order.amount?.toLocaleString("vi-VN")}đ</span>
              <span className="capitalize">{order.status}</span>
              <span>{new Date(order.created_at).toLocaleString("vi-VN")}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}


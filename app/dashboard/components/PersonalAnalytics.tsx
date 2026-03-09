"use client"

import { useMemo } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarRange, Sparkles, TrendingDown, TrendingUp } from "lucide-react"

interface PurchaseSummary {
  id: string
  title: string
  amount: number
  category?: string
  purchaseDate: string
}

interface PersonalAnalyticsProps {
  purchases: PurchaseSummary[]
  wishlistCount: number
  totalDownloads: number
  onExport?: () => void
}

export function PersonalAnalytics({ purchases, wishlistCount, totalDownloads, onExport }: PersonalAnalyticsProps) {
  const analytics = useMemo(() => {
    const byMonth = new Map<string, { total: number; count: number }>()
    const byCategory = new Map<string, number>()

    purchases.forEach((purchase) => {
      const monthKey = new Date(purchase.purchaseDate).toISOString().slice(0, 7)
      const catKey = purchase.category || "Khác"

      if (!byMonth.has(monthKey)) {
        byMonth.set(monthKey, { total: 0, count: 0 })
      }

      const currentMonth = byMonth.get(monthKey)!
      currentMonth.total += purchase.amount || 0
      currentMonth.count += 1
      byMonth.set(monthKey, currentMonth)

      byCategory.set(catKey, (byCategory.get(catKey) || 0) + (purchase.amount || 0))
    })

    const monthlyTrend = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        label: formatMonthLabel(month),
        total: data.total,
        average: data.total / (data.count || 1),
      }))

    const bestMonth = monthlyTrend.reduce(
      (acc, item) => (item.total > acc.total ? item : acc),
      { month: "", label: "", total: 0, average: 0 }
    )

    const categoryChart = Array.from(byCategory.entries())
      .map(([category, total]) => ({
        category,
        total,
      }))
      .sort((a, b) => b.total - a.total)

    return {
      monthlyTrend,
      categoryChart,
      bestMonth,
      avgSpend: purchases.length
        ? purchases.reduce((sum, item) => sum + (item.amount || 0), 0) / purchases.length
        : 0,
    }
  }, [purchases])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="col-span-1 lg:col-span-2 bg-white/70 dark:bg-black/40">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-blue-500" />
              Phân tích chi tiêu
            </CardTitle>
            <CardDescription>Biểu đồ chi tiêu theo tháng và giá trị trung bình</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onExport}>
            Xuất báo cáo
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={analytics.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                      <p className="text-sm font-semibold">{data.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Tổng chi tiêu: {data.total.toLocaleString("vi-VN")}đ
                      </p>
                      <p className="text-xs text-muted-foreground">
                        TB đơn hàng: {Math.round(data.average).toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                  )
                }}
              />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              <Area type="monotone" dataKey="average" stroke="#a855f7" fill="#a855f7" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Sparkles className="w-5 h-5" />
              Tháng ấn tượng nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.bestMonth.month ? (
              <>
                <p className="text-sm text-muted-foreground">Bạn chi tiêu nhiều nhất vào</p>
                <p className="text-2xl font-semibold mt-1">{analytics.bestMonth.label}</p>
                <p className="text-sm font-medium mt-2">
                  {analytics.bestMonth.total.toLocaleString("vi-VN")}đ • TB{" "}
                  {Math.round(analytics.bestMonth.average).toLocaleString("vi-VN")}đ/đơn
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có đủ dữ liệu</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-black/40">
          <CardHeader>
            <CardTitle className="text-base">Insight nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <QuickStat
              label="Giá trị trung bình/đơn"
              value={`${Math.round(analytics.avgSpend).toLocaleString("vi-VN")}đ`}
              trend="up"
            />
            <QuickStat label="Sản phẩm yêu thích" value={`${wishlistCount} mục`} />
            <QuickStat label="Tổng lượt tải xuống" value={totalDownloads.toLocaleString("vi-VN")} trend="up" />
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-1 lg:col-span-3 bg-white/70 dark:bg-black/40">
        <CardHeader>
          <CardTitle>Chi tiêu theo danh mục</CardTitle>
          <CardDescription>Danh mục nào bạn đầu tư nhiều nhất</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.categoryChart.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu danh mục</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.categoryChart}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="category" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value: number) => `${value.toLocaleString("vi-VN")}đ`} />
                <Bar dataKey="total" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function QuickStat({ label, value, trend }: { label: string; value: string; trend?: "up" | "down" }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
      {trend && (
        <Badge variant={trend === "up" ? "default" : "secondary"} className="flex items-center gap-1">
          {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend === "up" ? "+12%" : "-5%"}
        </Badge>
      )}
    </div>
  )
}

function formatMonthLabel(month: string) {
  const [year, m] = month.split("-")
  return `${m}/${year}`
}


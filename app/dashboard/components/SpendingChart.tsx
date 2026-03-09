"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

interface SpendingChartProps {
  purchases: Array<{
    id: string | number
    price: number
    amount: number
    purchaseDate: string | Date
  }>
}

export function SpendingChart({ purchases }: SpendingChartProps) {
  // Group purchases by month
  const monthlyData = useMemo(() => {
    const monthlyMap = new Map<string, number>()
    
    purchases.forEach((purchase) => {
      const date = new Date(purchase.purchaseDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const amount = purchase.amount || purchase.price || 0
      
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + amount)
    })
    
    // Convert to array and sort by date
    const data = Array.from(monthlyMap.entries())
      .map(([month, total]) => ({
        month,
        total: Number(total),
        formattedMonth: new Date(month + '-01').toLocaleDateString('vi-VN', { 
          year: 'numeric', 
          month: 'short' 
        })
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
    
    return data
  }, [purchases])

  const totalSpent = useMemo(() => {
    return purchases.reduce((sum, p) => sum + (p.amount || p.price || 0), 0)
  }, [purchases])

  const averageMonthly = useMemo(() => {
    if (monthlyData.length === 0) return 0
    return totalSpent / monthlyData.length
  }, [monthlyData.length, totalSpent])

  if (purchases.length === 0) {
    return (
      <Card className="bg-white/60 dark:bg-black/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Biểu đồ chi tiêu
          </CardTitle>
          <CardDescription>
            Chưa có dữ liệu chi tiêu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>Bạn chưa có giao dịch nào</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/60 dark:bg-black/50">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Biểu đồ chi tiêu theo tháng
        </CardTitle>
        <CardDescription>
          Tổng chi tiêu: {totalSpent.toLocaleString('vi-VN')}đ • 
          Trung bình/tháng: {averageMonthly.toLocaleString('vi-VN')}đ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedMonth" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: number) => `${value.toLocaleString('vi-VN')}đ`}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Chi tiêu (VNĐ)"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}



"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Gift, Loader2, Percent, Tag } from "lucide-react"

export interface Coupon {
  id: string
  code: string
  name?: string
  description?: string
  type: "percentage" | "fixed"
  value: number
  minPurchase?: number
  maxDiscount?: number
  status: "available" | "used" | "expired"
  validFrom?: string
  validUntil?: string
  createdAt?: string
}

interface CouponsCenterProps {
  coupons: Coupon[]
  isApplying?: boolean
  onApply?: (code: string) => Promise<void> | void
  onRefresh?: () => void
}

export function CouponsCenter({ coupons, onApply, onRefresh, isApplying = false }: CouponsCenterProps) {
  const [tab, setTab] = useState<"available" | "used" | "expired">("available")
  const [manualCode, setManualCode] = useState("")

  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => coupon.status === tab)
  }, [coupons, tab])

  return (
    <Card className="bg-white/70 dark:bg-black/40">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-500" />
            Mã giảm giá & Voucher
          </CardTitle>
          <CardDescription>Quản lý mã khuyến mãi, voucher và lịch sử sử dụng</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Làm mới
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            placeholder="Nhập mã coupon thủ công"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            className="uppercase"
          />
          <Button
            onClick={() => manualCode && onApply?.(manualCode)}
            disabled={!manualCode || isApplying}
            className="whitespace-nowrap"
          >
            {isApplying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Áp dụng
          </Button>
        </div>

        <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="available">Có thể dùng</TabsTrigger>
            <TabsTrigger value="used">Đã dùng</TabsTrigger>
            <TabsTrigger value="expired">Hết hạn</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="space-y-4 mt-4">
            {filteredCoupons.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border rounded-xl">
                Không có mã nào trong danh mục này.
              </div>
            ) : (
              filteredCoupons.map((coupon) => (
                <div key={coupon.id} className="p-4 border rounded-xl bg-background/70 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-muted-foreground">Mã</p>
                    <p className="text-2xl font-bold">{coupon.code}</p>
                    <p className="text-sm text-muted-foreground">{coupon.description || "—"}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                      <Badge variant="outline">
                        {coupon.type === "percentage" ? (
                          <>
                            <Percent className="w-3 h-3 mr-1" /> Giảm {coupon.value}%
                          </>
                        ) : (
                          <>
                            <Tag className="w-3 h-3 mr-1" /> Giảm {coupon.value.toLocaleString("vi-VN")}đ
                          </>
                        )}
                      </Badge>
                      {coupon.minPurchase ? (
                        <Badge variant="outline">ĐH tối thiểu {coupon.minPurchase.toLocaleString("vi-VN")}đ</Badge>
                      ) : null}
                      {coupon.maxDiscount ? (
                        <Badge variant="outline">Giảm tối đa {coupon.maxDiscount.toLocaleString("vi-VN")}đ</Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {coupon.validUntil ? (
                      <p>
                        Hạn dùng:{" "}
                        <span className="font-medium">
                          {new Date(coupon.validUntil).toLocaleDateString("vi-VN")}
                        </span>
                      </p>
                    ) : null}
                    <div className="flex gap-2">
                      {coupon.status === "available" ? (
                        <Button
                          size="sm"
                          onClick={() => onApply?.(coupon.code)}
                          disabled={isApplying}
                          className="whitespace-nowrap"
                        >
                          Sử dụng ngay
                        </Button>
                      ) : (
                        <Badge variant="secondary">
                          {coupon.status === "used" ? "Đã sử dụng" : "Đã hết hạn"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}


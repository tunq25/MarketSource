"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Copy, Gift, LinkIcon, Users } from "lucide-react"

export interface ReferralStat {
  id: string
  email: string
  status: "pending" | "approved" | "paid"
  joinedAt: string
  commission: number
}

interface ReferralProgramProps {
  referralCode: string
  baseUrl?: string
  stats: ReferralStat[]
  totalCommission: number
  pendingCommission: number
  onCopy?: (link: string) => void
  onShare?: (link: string) => void
}

export function ReferralProgram({
  referralCode,
  baseUrl = typeof window !== "undefined" ? window.location.origin : "https://qtus.dev",
  stats,
  totalCommission,
  pendingCommission,
  onCopy,
  onShare,
}: ReferralProgramProps) {
  const referralLink = `${baseUrl}/auth/register?ref=${referralCode}`

  const grouped = useMemo(() => {
    return {
      pending: stats.filter((item) => item.status === "pending"),
      approved: stats.filter((item) => item.status === "approved"),
      paid: stats.filter((item) => item.status === "paid"),
    }
  }, [stats])

  const tiers = [
    { label: "Bronze", threshold: 3, description: "Hoa hồng 5%" },
    { label: "Silver", threshold: 10, description: "Hoa hồng 7%" },
    { label: "Gold", threshold: 25, description: "Hoa hồng 10% + bonus" },
  ]

  const currentTier = tiers.reduce(
    (acc, tier) => (stats.length >= tier.threshold ? tier : acc),
    { label: "Starter", threshold: 0, description: "Hoa hồng 3%" }
  )

  return (
    <Card className="bg-white/70 dark:bg-black/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-500" />
          Chương trình giới thiệu
        </CardTitle>
        <CardDescription>Chia sẻ link cá nhân để nhận hoa hồng suốt đời</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Link giới thiệu của bạn</p>
          <div className="flex flex-col gap-2 md:flex-row">
            <Input value={referralLink} readOnly className="font-mono text-xs" />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(referralLink)
                  onCopy?.(referralLink)
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button variant="default" onClick={() => onShare?.(referralLink)}>
                <LinkIcon className="w-4 h-4 mr-2" />
                Chia sẻ
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Metric label="Đã giới thiệu" value={stats.length.toString()} />
          <Metric label="Đang xét duyệt" value={grouped.pending.length.toString()} accent="text-yellow-600" />
          <Metric label="Đã trả hoa hồng" value={`${totalCommission.toLocaleString("vi-VN")}đ`} accent="text-green-600" />
          <Metric label="Hoa hồng chờ duyệt" value={`${pendingCommission.toLocaleString("vi-VN")}đ`} accent="text-blue-600" />
        </div>

        <div className="border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Cấp độ hiện tại: {currentTier.label}</p>
              <p className="text-xs text-muted-foreground">{currentTier.description}</p>
            </div>
            <Badge variant="secondary">{stats.length}/{currentTier.threshold || 3}</Badge>
          </div>
          <Progress value={(stats.length / (currentTier.threshold || 3)) * 100} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Danh sách giới thiệu
            </p>
            <Badge variant="outline">Tổng cộng {stats.length}</Badge>
          </div>

          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-2">
            {stats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Chưa có người dùng nào được giới thiệu. Chia sẻ link để bắt đầu kiếm hoa hồng.
              </p>
            ) : (
              stats.map((item) => (
                <div key={item.id} className="p-3 border rounded-lg flex flex-wrap gap-2 items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Tham gia {new Date(item.joinedAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        item.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : item.status === "approved"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {item.status === "paid" ? "Đã trả" : item.status === "approved" ? "Đã duyệt" : "Pending"}
                    </Badge>
                    <Badge variant="outline">{item.commission.toLocaleString("vi-VN")}đ</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="p-3 border rounded-xl bg-background/70">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-semibold mt-1 ${accent || ""}`}>{value}</p>
    </div>
  )
}


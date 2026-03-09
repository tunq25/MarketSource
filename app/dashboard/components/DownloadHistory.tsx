"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Filter, Link2, RefreshCw, ShieldAlert, UploadCloud } from "lucide-react"

export interface DownloadRecord {
  id: string
  productId: string
  productTitle: string
  version?: string
  size?: string
  downloadUrl?: string
  checksum?: string
  expiresAt?: string
  createdAt: string
  lastDownloadedAt?: string
  totalDownloads?: number
  ipAddress?: string
  device?: string
  status?: "active" | "expired" | "revoked"
}

interface DownloadHistoryProps {
  records: DownloadRecord[]
  isLoading?: boolean
  onRefresh?: () => void
  onRequestRegenerate?: (record: DownloadRecord) => void
  onBulkExport?: () => void
}

export function DownloadHistory({
  records,
  isLoading = false,
  onRefresh,
  onRequestRegenerate,
  onBulkExport,
}: DownloadHistoryProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "revoked">("all")

  const filteredRecords = useMemo(() => {
    let data = [...records]

    if (search.trim()) {
      data = data.filter((item) =>
        [item.productTitle, item.version, item.ipAddress]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(search.toLowerCase()))
      )
    }

    if (statusFilter !== "all") {
      data = data.filter((item) => item.status === statusFilter)
    }

    return data
  }, [records, search, statusFilter])

  const stats = useMemo(() => {
    return {
      totalDownloads: records.reduce((sum, item) => sum + (item.totalDownloads || 0), 0),
      activeLinks: records.filter((item) => item.status === "active").length,
      expiredLinks: records.filter((item) => item.status === "expired").length,
      revokedLinks: records.filter((item) => item.status === "revoked").length,
    }
  }, [records])

  return (
    <Card className="bg-white/70 dark:bg-black/40">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="w-5 h-5 text-blue-500" />
            Quản lý tải xuống
          </CardTitle>
          <CardDescription>
            Theo dõi lịch sử tải xuống, gia hạn link và bảo vệ tài sản số của bạn
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onBulkExport}>
            <UploadCloud className="w-4 h-4 mr-2" />
            Xuất lịch sử
          </Button>
          <Button size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric label="Tổng lượt tải" value={stats.totalDownloads.toLocaleString("vi-VN")} />
          <Metric label="Link đang hoạt động" value={stats.activeLinks.toLocaleString("vi-VN")} accent="text-green-600" />
          <Metric label="Link đã hết hạn" value={stats.expiredLinks.toLocaleString("vi-VN")} accent="text-yellow-600" />
          <Metric label="Link đã thu hồi" value={stats.revokedLinks.toLocaleString("vi-VN")} accent="text-red-600" />
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên sản phẩm, phiên bản, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Tabs
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="active">Hoạt động</TabsTrigger>
              <TabsTrigger value="expired">Hết hạn</TabsTrigger>
              <TabsTrigger value="revoked">Đã thu hồi</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-xl">
              <ShieldAlert className="w-8 h-8 mx-auto mb-3" />
              Chưa có bản ghi tải xuống phù hợp với bộ lọc hiện tại
            </div>
          ) : (
            filteredRecords.map((record) => (
              <div key={record.id} className="p-4 border rounded-xl bg-background/70 dark:bg-black/30 space-y-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">{record.productTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      Version {record.version || "1.0"} • {record.size || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{record.totalDownloads || 0} lượt</Badge>
                    <Badge
                      className={
                        record.status === "revoked"
                          ? "bg-red-100 text-red-800"
                          : record.status === "expired"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }
                    >
                      {record.status === "revoked" ? "Đã thu hồi" : record.status === "expired" ? "Hết hạn" : "Hoạt động"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground">
                  <div>
                    <p className="uppercase tracking-wide text-[11px]">Link tải xuống</p>
                    <p className="font-medium text-foreground text-sm break-all">{record.downloadUrl || "Chưa tạo"}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-[11px]">Hết hạn</p>
                    <p className="font-medium text-foreground text-sm">
                      {record.expiresAt ? new Date(record.expiresAt).toLocaleString("vi-VN") : "Không giới hạn"}
                    </p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-[11px]">Checksum</p>
                    <p className="font-medium text-foreground text-sm">{record.checksum || "—"}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  {record.ipAddress && <Badge variant="outline">IP: {record.ipAddress}</Badge>}
                  {record.device && <Badge variant="outline">Device: {record.device}</Badge>}
                  {record.lastDownloadedAt && (
                    <Badge variant="outline">
                      Tải gần nhất: {new Date(record.lastDownloadedAt).toLocaleString("vi-VN")}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href={record.downloadUrl || "#"} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Tải lại
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onRequestRegenerate?.(record)}>
                    <Link2 className="w-4 h-4 mr-2" />
                    Gia hạn link
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="p-4 border rounded-xl bg-background/60 dark:bg-black/30">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${accent || "text-foreground"}`}>{value}</p>
    </div>
  )
}


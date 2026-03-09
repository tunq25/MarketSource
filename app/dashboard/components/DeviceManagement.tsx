"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Smartphone, WifiOff } from "lucide-react"

export interface DeviceSession {
  id: string
  deviceName?: string
  deviceType?: string
  browser?: string
  os?: string
  ipAddress?: string
  location?: string
  lastActivity: string
  isCurrent?: boolean
  isTrusted?: boolean
}

interface DeviceManagementProps {
  sessions: DeviceSession[]
  onRevoke?: (sessionId: string) => void
  onMarkTrusted?: (sessionId: string) => void
}

export function DeviceManagement({ sessions, onRevoke, onMarkTrusted }: DeviceManagementProps) {
  return (
    <Card className="bg-white/70 dark:bg-black/40">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Thiết bị & Session
          </CardTitle>
          <CardDescription>Giám sát thiết bị đăng nhập và đăng xuất từ xa</CardDescription>
        </div>
        <Badge variant="outline">Tổng {sessions.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[460px] overflow-y-auto pr-2">
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-xl">
            <WifiOff className="w-8 h-8 mx-auto mb-3" />
            Chưa ghi nhận thiết bị nào. Session sẽ xuất hiện sau khi bạn đăng nhập.
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="p-4 border rounded-xl bg-background/70 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20">
                  <Smartphone className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold">
                    {session.deviceName || session.deviceType || "Thiết bị không xác định"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {session.browser || "Unknown"} • {session.os || "Unknown OS"}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                    {session.ipAddress && <Badge variant="outline">IP: {session.ipAddress}</Badge>}
                    {session.location && <Badge variant="outline">{session.location}</Badge>}
                    <Badge variant="outline">
                      Hoạt động gần nhất: {new Date(session.lastActivity).toLocaleString("vi-VN")}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 justify-end">
                  {session.isCurrent ? (
                    <Badge className="bg-emerald-100 text-emerald-800">Đang sử dụng</Badge>
                  ) : session.isTrusted ? (
                    <Badge variant="secondary">Trusted</Badge>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  {!session.isTrusted && (
                    <Button size="sm" variant="secondary" onClick={() => onMarkTrusted?.(session.id)}>
                      Đánh dấu tin cậy
                    </Button>
                  )}
                  {!session.isCurrent && (
                    <Button size="sm" variant="outline" onClick={() => onRevoke?.(session.id)}>
                      Đăng xuất
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}


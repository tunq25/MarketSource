"use client"

import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ShieldCheck, KeyRound, Smartphone, Tablet, Monitor, RefreshCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { DeviceSession } from "@/types"

interface SecuritySectionProps {
  securityPreferences: {
    twoFactorEnabled: boolean
    deviceAlerts: boolean
    loginNotifications: boolean
    backupCodesGenerated: boolean
    backupCodes: string[]
  }
  isDisablingTwoFactor: boolean
  isStartingTwoFactor: boolean
  isVerifyingTwoFactor: boolean
  twoFactorSecret: string
  twoFactorQRCode: string
  twoFactorToken: string
  twoFactorBackupCodes: string[]
  onTwoFactorToggle: () => void
  onTwoFactorVerify: () => void
  onTwoFactorTokenChange: (token: string) => void
  onSecurityToggle: (key: "deviceAlerts" | "loginNotifications") => (checked: boolean) => void
  deviceSessions: DeviceSession[]
  onRevokeSession: (id: string) => void
  onMarkTrusted: (id: string) => void
}

export function SecuritySection({
  securityPreferences,
  isDisablingTwoFactor,
  isStartingTwoFactor,
  isVerifyingTwoFactor,
  twoFactorSecret,
  twoFactorQRCode,
  twoFactorToken,
  twoFactorBackupCodes,
  onTwoFactorToggle,
  onTwoFactorVerify,
  onTwoFactorTokenChange,
  onSecurityToggle,
  deviceSessions,
  onRevokeSession,
  onMarkTrusted,
}: SecuritySectionProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      <Card className="md:col-span-2 glass-card-premium border-border/50 shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Xác thực hai lớp (2FA)
          </CardTitle>
          <CardDescription>
            Tăng cường bảo mật tài khoản bằng mã OTP từ Google Authenticator hoặc Authy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/40">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Trạng thái bảo mật</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${securityPreferences.twoFactorEnabled ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                <p className="font-bold text-lg">
                  {securityPreferences.twoFactorEnabled ? "Đã kích hoạt" : "Chưa kích hoạt"}
                </p>
              </div>
            </div>
            <div>
              {securityPreferences.twoFactorEnabled ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onTwoFactorToggle}
                  disabled={isDisablingTwoFactor}
                  className="glass-button border-red-500/20 text-red-600 hover:bg-red-500/10"
                >
                  {isDisablingTwoFactor ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Tắt 2FA
                </Button>
              ) : (
                <Button 
                  size="sm"
                  onClick={onTwoFactorToggle} 
                  disabled={isStartingTwoFactor}
                  className="premium-button shadow-primary/20"
                >
                  {isStartingTwoFactor ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Bật 2FA ngay
                </Button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {!securityPreferences.twoFactorEnabled && twoFactorSecret && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 border rounded-xl p-6 bg-primary/5 border-primary/10"
              >
                <div className="space-y-4 flex flex-col items-center md:items-start text-center md:text-left">
                  <p className="font-semibold text-sm">Bước 1: Quét mã QR</p>
                  {twoFactorQRCode && (
                    <div className="p-3 bg-white rounded-2xl shadow-inner inline-block">
                      <Image
                        src={twoFactorQRCode}
                        alt="2FA QR Code"
                        width={180}
                        height={180}
                        className="w-44 h-44"
                        unoptimized
                        priority
                      />
                    </div>
                  )}
                  <div className="w-full">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Hoặc nhập mã thủ công</p>
                    <code className="block p-2 bg-muted rounded text-xs break-all border border-border/40 select-all tracking-wider font-mono">
                      {twoFactorSecret}
                    </code>
                  </div>
                </div>
                
                <div className="space-y-4 flex flex-col justify-center">
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">Bước 2: Nhập mã xác nhận</p>
                    <Label htmlFor="twofactor-token" className="text-xs text-muted-foreground">Mã OTP 6 chữ số từ ứng dụng</Label>
                    <Input
                      id="twofactor-token"
                      autoFocus
                      value={twoFactorToken}
                      onChange={(e) => onTwoFactorTokenChange(e.target.value)}
                      placeholder="000 000"
                      maxLength={6}
                      className="text-center text-2xl tracking-[0.5em] font-bold h-14 glass-input"
                    />
                  </div>
                  <Button 
                    onClick={onTwoFactorVerify} 
                    disabled={isVerifyingTwoFactor || twoFactorToken.length < 6}
                    className="w-full premium-button"
                  >
                    {isVerifyingTwoFactor ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Xác minh & Kích hoạt
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Bạn cần xác minh mã để đảm bảo thiết bị đã được đồng bộ.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {(twoFactorBackupCodes.length > 0 || securityPreferences.backupCodes?.length > 0) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border rounded-xl p-6 space-y-4 bg-yellow-500/5 border-yellow-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <KeyRound className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="font-bold text-sm">Mã khôi phục dự phòng</p>
                  <p className="text-xs text-muted-foreground">
                    Lưu các mã này ở nơi an toàn. Mỗi mã chỉ sử dụng được 1 lần để đăng nhập nếu mất điện thoại.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(twoFactorBackupCodes.length > 0 ? twoFactorBackupCodes : securityPreferences.backupCodes || []).map(
                  (code) => (
                    <div key={code} className="bg-muted/50 rounded-lg py-3 text-center text-sm font-mono border border-border/40 shadow-sm transition-transform hover:scale-105">
                      {code}
                    </div>
                  )
                )}
              </div>
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => window.print()}>
                In/Tải mã khôi phục
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card-premium border-border/50 shadow-xl overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Cảnh báo & Rủi ro
          </CardTitle>
          <CardDescription>Tùy chỉnh các thông báo bảo mật quan trọng.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex-1">
          {[
            {
              key: "loginNotifications" as const,
              title: "Thông báo đăng nhập",
              description: "Nhận email ngay khi có thiết bị mới truy cập tài khoản.",
            },
            {
              key: "deviceAlerts" as const,
              title: "Cảnh báo thiết bị lạ",
              description: "Hệ thống sẽ tạm khóa các thao tác nạp/rút từ IP lạ.",
            },
          ].map((item, idx) => (
            <div key={item.key} className={`flex items-start justify-between gap-4 ${idx === 0 ? "pb-6 border-b border-border/40" : ""}`}>
              <div className="space-y-1">
                <p className="font-semibold text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
              <Switch
                checked={securityPreferences[item.key]}
                onCheckedChange={onSecurityToggle(item.key)}
              />
            </div>
          ))}
          
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 mt-2">
            <p className="text-xs font-semibold uppercase text-primary mb-2 tracking-widest">Mẹo bảo mật</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bạn nên thay đổi mật khẩu định kỳ 3 tháng 1 lần và không sử dụng chung mật khẩu với các website khác.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card-premium border-border/50 shadow-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Thiết bị truy cập
            </CardTitle>
            <CardDescription>Quản lý các phiên đăng nhập hiện tại.</CardDescription>
          </div>
          <Badge variant="secondary" className="px-3 py-1 font-bold">{deviceSessions.length}</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {deviceSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10 opacity-60 italic">Không có phiên hoạt động nào khác.</p>
            ) : (
              deviceSessions.map((session) => (
                <div 
                  key={session.id} 
                  className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${
                    session.isCurrent ? "bg-primary/5 border-primary/20" : "bg-muted/10 border-border/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-background border border-border/40 shadow-sm mt-0.5">
                        {session.deviceType === 'desktop' ? <Monitor className="w-5 h-5 text-primary" /> : 
                         session.deviceType === 'mobile' ? <Smartphone className="w-5 h-5 text-primary" /> : 
                         <Tablet className="w-5 h-5 text-primary" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm">{session.deviceName || `Thiết bị ${session.os}`}</p>
                          {session.isCurrent && <Badge className="bg-green-500 hover:bg-green-600 text-[9px] uppercase h-4 px-1">Đang dùng</Badge>}
                          {session.isTrusted && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {session.browser} • {session.os} • {session.ipAddress}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 opacity-70">
                          {session.isCurrent ? "Hoạt động ngay bây giờ" : `Hoạt động cuối: ${new Date(session.lastActivity).toLocaleString('vi-VN')}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-border/20">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[11px] h-8 text-red-500 hover:text-red-600 hover:bg-red-50/50"
                        onClick={() => onRevokeSession(String(session.id))}
                      >
                        Đăng xuất
                      </Button>
                      {!session.isTrusted && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-[11px] h-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50/50"
                          onClick={() => onMarkTrusted(String(session.id))}
                        >
                          Đánh dấu tin cậy
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

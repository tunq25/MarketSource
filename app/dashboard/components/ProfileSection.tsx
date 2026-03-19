"use client"

import { useRef, FormEvent, ChangeEvent } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User as UserIcon, Camera, Lock, Settings } from "lucide-react"
import { motion } from "framer-motion"
import type { User, DownloadRecord, Purchase } from "@/types"

interface ProfileSectionProps {
  currentUser: User
  profileForm: {
    name: string
    phone: string
    address: string
    city: string
    country: string
    socialGoogle: string
    socialGithub: string
    socialFacebook: string
  }
  profileMessage: { type: "success" | "error"; text: string } | null
  avatarPreview: string | null
  isSavingProfile: boolean
  isUploadingAvatar: boolean
  userIP: string
  deviceInfo: any
  userPurchases: Purchase[]
  stats: {
    totalSpent: number
  }
  downloadRecords: DownloadRecord[]
  onProfileInputChange: (field: any, value: string) => void
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void
  onProfileSubmit: (event: FormEvent<HTMLFormElement>) => void
  onPasswordChange: () => void
}

export function ProfileSection({
  currentUser,
  profileForm,
  profileMessage,
  avatarPreview,
  isSavingProfile,
  isUploadingAvatar,
  userIP,
  deviceInfo,
  userPurchases,
  stats,
  downloadRecords,
  onProfileInputChange,
  onAvatarChange,
  onProfileSubmit,
  onPasswordChange,
}: ProfileSectionProps) {
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      <Card className="glass-card-premium border-border/50 shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-primary" />
            Thông tin cá nhân
          </CardTitle>
          <CardDescription>Cập nhật avatar, thông tin liên hệ và mạng xã hội.</CardDescription>
          {profileMessage && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className={`text-sm font-medium mt-2 p-2 rounded-md ${
                profileMessage.type === "success" 
                  ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              }`}
            >
              {profileMessage.text}
            </motion.p>
          )}
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onProfileSubmit}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-primary/20 shadow-lg transition-transform duration-300 group-hover:scale-105">
                  <AvatarImage
                    src={avatarPreview || currentUser.avatarUrl || currentUser.image || ""}
                    alt={currentUser.name || currentUser.email}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {(currentUser.name || currentUser.email || "U").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingAvatar}
                  onClick={() => avatarInputRef.current?.click()}
                  className="glass-button"
                >
                  {isUploadingAvatar ? "Đang tải..." : "Thay đổi ảnh đại diện"}
                </Button>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Hỗ trợ PNG/JPG, dung lượng tối đa 2MB
                </p>
              </div>
              
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Tên hiển thị</Label>
                <Input
                  id="profile-name"
                  value={profileForm.name}
                  onChange={(e) => onProfileInputChange("name", e.target.value)}
                  placeholder="Nhập tên của bạn"
                  className="glass-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-phone">Số điện thoại</Label>
                <Input
                  id="profile-phone"
                  value={profileForm.phone}
                  onChange={(e) => onProfileInputChange("phone", e.target.value)}
                  placeholder="+84..."
                  className="glass-input"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="profile-address">Địa chỉ</Label>
                <Input
                  id="profile-address"
                  value={profileForm.address}
                  onChange={(e) => onProfileInputChange("address", e.target.value)}
                  placeholder="Số nhà, đường, phường..."
                  className="glass-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-city">Thành phố</Label>
                <Input
                  id="profile-city"
                  value={profileForm.city}
                  onChange={(e) => onProfileInputChange("city", e.target.value)}
                  placeholder="TP. Hồ Chí Minh"
                  className="glass-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-country">Quốc gia</Label>
                <Input
                  id="profile-country"
                  value={profileForm.country}
                  onChange={(e) => onProfileInputChange("country", e.target.value)}
                  placeholder="Việt Nam"
                  className="glass-input"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border/40">
              <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-muted-foreground" />
                Liên kết mạng xã hội
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="social-google" className="text-xs uppercase text-muted-foreground">Google</Label>
                  <Input
                    id="social-google"
                    value={profileForm.socialGoogle}
                    onChange={(e) => onProfileInputChange("socialGoogle", e.target.value)}
                    placeholder="Profile URL"
                    className="glass-input text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social-github" className="text-xs uppercase text-muted-foreground">GitHub</Label>
                  <Input
                    id="social-github"
                    value={profileForm.socialGithub}
                    onChange={(e) => onProfileInputChange("socialGithub", e.target.value)}
                    placeholder="Profile URL"
                    className="glass-input text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social-facebook" className="text-xs uppercase text-muted-foreground">Facebook</Label>
                  <Input
                    id="social-facebook"
                    value={profileForm.socialFacebook}
                    onChange={(e) => onProfileInputChange("socialFacebook", e.target.value)}
                    placeholder="Profile URL"
                    className="glass-input text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6">
              <Button type="submit" disabled={isSavingProfile} className="w-full sm:w-auto min-w-[140px] premium-button">
                {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onPasswordChange}
                className="text-muted-foreground hover:text-primary transition-colors h-10"
              >
                <Lock className="w-4 h-4 mr-2" />
                Đổi mật khẩu
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="glass-card-premium border-border/50 shadow-xl overflow-hidden h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Thống kê tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="font-semibold text-sm truncate max-w-[200px]">{currentUser.email}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <StatItem label="Ngày tham gia" value={currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString("vi-VN") : 'N/A'} />
                <StatItem label="IP hiện tại" value={userIP !== "Loading..." ? userIP : currentUser.ipAddress || "Unknown"} />
              </div>

              <div className="p-3 rounded-lg border border-border/40 bg-muted/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground uppercase opacity-70">Thiết bị & Trình duyệt</span>
                </div>
                <p className="font-medium text-xs">
                  {deviceInfo?.deviceType || "Unknown"} • {deviceInfo?.browser || "N/A"} ({deviceInfo?.os || "N/A"})
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border/40 grid grid-cols-2 gap-3">
              <HighlightBox label="Trạng thái" value={currentUser.status === "active" ? "Hoạt động" : "Tạm khóa"} color="blue" />
              <HighlightBox label="Lượt đăng nhập" value={currentUser.loginCount || 1} color="purple" />
              <HighlightBox label="Đã mua" value={userPurchases.length} color="green" />
              <HighlightBox label="Tổng chi tiêu" value={`${stats.totalSpent.toLocaleString("vi-VN")}đ`} color="yellow" />
              <HighlightBox 
                label="Tổng Downloads" 
                value={downloadRecords.reduce((sum, record) => sum + (record.totalDownloads || 0), 0)} 
                color="pink" 
                className="col-span-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg border border-border/40 bg-muted/20">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 opacity-70">{label}</p>
      <p className="font-semibold text-xs truncate">{value}</p>
    </div>
  )
}

function HighlightBox({ label, value, color, className = "" }: { label: string; value: string | number; color: string; className?: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    green: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    yellow: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  }

  return (
    <div className={`p-4 rounded-xl border ${colors[color]} ${className}`}>
      <p className="text-[10px] uppercase tracking-widest opacity-80 mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  )
}

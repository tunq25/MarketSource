"use client"

import { logger } from "@/lib/logger-client"
import type { UserSyncResult } from "@/lib/userManager"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, ArrowLeft, EyeOff, Mail, Lock, User, Github } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { ThemeToggle } from "@/components/theme-toggle"
import { getLocalStorage } from "@/lib/localStorage-utils"
import PowCaptcha from "@/components/PowCaptcha"

// Social login icons
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

function RegisterPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const logSyncStatus = (
    user: { uid?: string; email?: string; provider?: string },
    syncResult: UserSyncResult,
    context: string,
  ) => {
    const syncState = syncResult.apiSaved
      ? "synced"
      : syncResult.offlineQueued
        ? "queued-offline"
        : "local-only"

    logger.info(
      [
        `✅ UID: ${user.uid}`,
        `✅ Email: ${user.email}`,
        `✅ Provider: ${user.provider}`,
        `✅ Lưu Firestore: ${syncResult.firestoreSaved}`,
        `✅ Lưu localStorage: ${syncResult.localSaved}`,
        `✅ LoginCount: ${syncResult.loginCount}`,
        `✅ Tình trạng đồng bộ: ${syncState}`,
        `✅ Kênh: ${context}`,
      ].join(" | "),
    )

    if (!syncResult.firestoreSaved || !syncResult.apiSaved) {
      logger.error("User not synced between Firestore and localStorage", {
        uid: user.uid,
        email: user.email,
        context,
        syncState,
      })
    }
  }

  // Handle NextAuth session - save to localStorage
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      logger.debug('NextAuth session found (register), saving to localStorage', { user: session.user });

      // Save OAuth user to localStorage via API + client-side save
      const saveOAuthUser = async () => {
        try {
          // Get IP address
          let ipAddress = 'unknown';
          try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipRes.json();
            ipAddress = ipData.ip || 'unknown';
          } catch {
            // Ignore IP fetch errors
          }

          const response = await fetch('/api/auth-callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: (session.user as any).id || `social_${Date.now()}`,
              email: session.user.email,
              name: session.user.name,
              image: session.user.image,
              provider: (session.user as any).provider || 'google',
              ipAddress: ipAddress
            })
          });

          if (response.ok) {
            const data = await response.json();

            // Save to localStorage ở client-side
            const { userManager } = await import('@/lib/userManager');
            const syncResult = await userManager.setUser(data.user);
            logSyncStatus(
              {
                uid: data.user?.uid || data.user?.id,
                email: data.user?.email,
                provider: data.user?.provider || 'oauth',
              },
              syncResult,
              'oauth'
            );

            logger.debug('OAuth user saved to localStorage');
            router.push('/dashboard');
          } else {
            logger.error('Failed to normalize OAuth user');
            setError('Không thể lưu thông tin đăng ký');
          }
        } catch (error) {
          logger.error('Error saving OAuth user', error);
          setError('Lỗi khi lưu thông tin đăng ký');
        }
      };

      saveOAuthUser();
    }

    // Check for NextAuth error
    const error = searchParams?.get('error');
    if (error) {
      setError('Đăng ký thất bại. Vui lòng thử lại.');
    }
  }, [session, status, router, searchParams]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLoggedIn = getLocalStorage<string | null>("isLoggedIn", null) === "true"
      const currentUser = getLocalStorage<any>("currentUser", null)
      if (isLoggedIn && currentUser) {
        router.replace("/dashboard")
      }
    }
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError("")
  }

  const handleSocialLogin = async (provider: string) => {
    try {
      setIsLoading(true);
      setError("");
      logger.debug(`Attempting ${provider} registration`);

      await signIn(provider, {
        callbackUrl: '/dashboard',
        redirect: false  // Don't auto redirect, we'll handle it in useEffect
      });

      // Note: signIn sẽ redirect tự động nếu success
      // Nếu có lỗi, sẽ được handle trong useEffect với searchParams.error
    } catch (error: any) {
      logger.error(`Social registration error (${provider})`, error);
      setError(`Lỗi đăng ký bằng ${provider}. Vui lòng kiểm tra lại cấu hình OAuth.`);
      setIsLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Mật khẩu xác nhận không khớp")
      }

      if (!acceptTerms) {
        throw new Error("Vui lòng đồng ý với điều khoản dịch vụ")
      }

      if (!captchaToken) {
        throw new Error("Vui lòng xác minh bạn không phải robot")
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          captchaToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      // Check if user data exists
      if (!data.user) {
        throw new Error('User data not found in response');
      }

      // Save user info via userManager để đảm bảo sync đầy đủ
      const { userManager } = await import('@/lib/userManager');
      const normalizedUser = {
        uid: data.user.uid || data.user.id,
        email: data.user.email,
        displayName: data.user.displayName || data.user.name,
        name: data.user.name || data.user.displayName,
        provider: data.user.provider || 'email',
        avatar: data.user.avatar || null,
        ip: data.user.ipAddress || 'Unknown',
        ipAddress: data.user.ipAddress || 'Unknown',
        balance: data.user.balance ?? 0,
        totalSpent: data.user.totalSpent ?? 0,
        lastActivity: new Date().toISOString(),
        loginCount: data.user.loginCount ?? 1,
        joinedAt: data.user.createdAt || new Date().toISOString(),
        role: data.user.role || 'user',
        purchasedProducts: [],
        notifications: [],
        meta: {}
      };

      const syncResult = await userManager.setUser(normalizedUser);
      logSyncStatus(normalizedUser, syncResult, 'credentials');

      window.dispatchEvent(new Event("userUpdated"))

      router.replace("/dashboard")

    } catch (error: any) {
      setError(error.message)
      setCaptchaToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Đăng ký</CardTitle>
          <CardDescription className="text-center">
            Tạo tài khoản mới để bắt đầu mua sắm
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Đăng kí tài khoản của bạn</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Nhập họ và tên"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-gray-400"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-gray-400"
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked === true)}
              />
              <Label htmlFor="terms" className="text-sm">
                Tôi đồng ý với{" "}
                <Link href="/terms" className="text-purple-600 hover:text-purple-500">
                  điều khoản dịch vụ
                </Link>{" "}
                và{" "}
                <Link href="/privacy" className="text-purple-600 hover:text-purple-500">
                  chính sách bảo mật
                </Link>
              </Label>
            </div>

            {/* PoW Captcha Widget */}
            <div className="flex justify-center">
              <PowCaptcha onVerify={(token) => setCaptchaToken(token)} />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !acceptTerms || !captchaToken}>
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                "Đăng ký"
              )}
            </Button>
          </form>

          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Hoặc đăng kí bằng</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
              className="w-full"
            >
              <GoogleIcon />
              <span className="ml-2">Đăng ký với Google</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleSocialLogin('facebook')}
              disabled={isLoading}
              className="w-full"
            >
              <FacebookIcon />
              <span className="ml-2">Đăng ký với Facebook</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleSocialLogin('github')}
              disabled={isLoading}
              className="w-full"
            >
              <Github className="w-5 h-5" />
              <span className="ml-2">Đăng ký với GitHub</span>
            </Button>
          </div>

          <div className="text-center">
            <Link href="/auth/login" className="text-sm text-purple-600 hover:text-purple-500">
              Đã có tài khoản? Đăng nhập ngay
            </Link>
          </div>

          <div className="text-center mt-6">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại trang chủ
            </Link>
          </div>

          <div className="flex justify-center mt-4">
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  )
}
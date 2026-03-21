"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Mail, ArrowLeft, AlertCircle, CheckCircle, Loader2,
  Github, Facebook, Lock, Eye, EyeOff, Info, KeyRound,
  ShieldCheck, RefreshCw, Key
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { isFirebaseConfigured } from "@/lib/auth";
import Link from "next/link";
import { signIn } from "next-auth/react";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Countdown Timer cho nút "Gửi lại mã"
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // STEP 1: Gửi mã OTP đến Email
  const handleSendOtp = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) {
      setError("Vui lòng nhập email!");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const { getCsrfHeaders } = await import("@/lib/csrf-client")
      const csrf = await getCsrfHeaders()
      const response = await fetch("/api/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrf },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể gửi mã xác nhận.");
      }

      setSuccess("Mã xác nhận đã được gửi đến hộp thư của bạn! Vui lòng kiểm tra email.");
      setStep("otp");
      setResendCooldown(60);

      // Auto focus ô OTP đầu tiên
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  // Xử lý nhập OTP 6 ô
  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      otpRefs.current[5]?.focus();
    }
  }, []);

  // STEP 2: Xác minh đúng mã OTP
  const handleVerifyOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setError("Vui lòng nhập đủ 6 số mã OTP!");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const { getCsrfHeaders } = await import("@/lib/csrf-client")
      const csrf = await getCsrfHeaders()
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrf },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          otp: otpString,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể xác minh mã OTP.");
      }

      setSuccess("Mã OTP chính xác. Vui lòng tạo mật khẩu mới.");
      setStep("password");
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  }, [otp, email]);


  // STEP 3: Đổi mật khẩu
  const handleResetPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const { getCsrfHeaders } = await import("@/lib/csrf-client")
      const csrf = await getCsrfHeaders()
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrf },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          otp: otpString,
          password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể đặt lại mật khẩu.");
      }

      setSuccess("🎉 Mật khẩu đã được đặt lại thành công! Đang chuyển hướng đến trang đăng nhập...");
      setTimeout(() => router.push("/auth/login"), 2500);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  }, [otp, newPassword, confirmPassword, email, router]);

  // Gửi lại mã OTP
  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0) return;
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setSuccess("");
    await handleSendOtp();
  }, [resendCooldown, handleSendOtp]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Logo />
          <p className="mt-4 text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-950 dark:via-pink-950 dark:to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Logo />
          </Link>
          <div className="flex items-center justify-center mt-4 mb-2">
            {step === "email" ? (
              <Mail className="w-8 h-8 text-purple-600 mr-2" />
            ) : step === "otp" ? (
              <ShieldCheck className="w-8 h-8 text-green-600 mr-2" />
            ) : (
              <Key className="w-8 h-8 text-blue-600 mr-2" />
            )}
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {step === "email" ? "Quên mật khẩu" : step === "otp" ? "Xác nhận OTP" : "Tạo mật khẩu"}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {step === "email"
              ? "Nhập email để nhận mã xác nhận đặt lại mật khẩu"
              : step === "otp"
                ? `Mã xác nhận đã gửi đến ${email}`
                : "Điền mật khẩu mới bảo mật của bạn"}
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-0 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {step === "email" ? "Nhập địa chỉ Email" : step === "otp" ? "Nhập mã OTP" : "Tạo mới Mật khẩu"}
            </CardTitle>
            <CardDescription>
              {step === "email"
                ? "Chúng tôi sẽ gửi mã 6 số đến email của bạn"
                : step === "otp"
                  ? "Nhập mã OTP 6 số để xác minh"
                  : "Nhập mật khẩu mới an toàn cho tài khoản của bạn"}
            </CardDescription>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className={`w-8 h-1 rounded-full transition-colors ${step === "email" ? "bg-purple-600" : "bg-purple-300 dark:bg-purple-500"}`} />
              <div className={`w-8 h-1 rounded-full transition-colors ${step === "otp" ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"}`} />
              <div className={`w-8 h-1 rounded-full transition-colors ${step === "password" ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"}`} />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* Alerts */}
            {error && (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600 dark:text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600 dark:text-green-400">{success}</AlertDescription>
              </Alert>
            )}

            {/* ====================================================== */}
            {/* STEP 1: NHẬP EMAIL */}
            {/* ====================================================== */}
            {step === "email" && (
              <>
                {/* OAuth buttons */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => signIn("google")}
                    disabled={oauthLoading !== null || isLoading}
                    className="w-full border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {oauthLoading === "google" ? (
                      <div className="flex items-center">
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Đang đăng nhập...
                      </div>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4 text-red-500" />
                        Đăng nhập với Google
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => signIn("github")}
                    disabled={oauthLoading !== null || isLoading}
                    className="w-full border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {oauthLoading === "github" ? (
                      <div className="flex items-center">
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Đang đăng nhập...
                      </div>
                    ) : (
                      <>
                        <Github className="mr-2 h-4 w-4" />
                        Đăng nhập với GitHub
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => signIn("facebook")}
                    disabled={oauthLoading !== null || isLoading}
                    className="w-full border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {oauthLoading === "facebook" ? (
                      <div className="flex items-center">
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Đang đăng nhập...
                      </div>
                    ) : (
                      <>
                        <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                        Đăng nhập với Facebook
                      </>
                    )}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">Hoặc đặt lại mật khẩu</span>
                  </div>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email đã đăng ký</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập email của bạn"
                        className="pl-10"
                        disabled={isLoading || oauthLoading !== null}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    disabled={isLoading || oauthLoading !== null || !email}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Đang gửi mã...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <KeyRound className="h-4 w-4 mr-2" />
                        Gửi mã xác nhận OTP
                      </div>
                    )}
                  </Button>
                </form>
              </>
            )}

            {/* ====================================================== */}
            {/* STEP 2: NHẬP OTP XÁC MINH */}
            {/* ====================================================== */}
            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={email}
                      readOnly
                      className="pl-10 bg-gray-50 dark:bg-gray-800 cursor-not-allowed text-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block text-center">Mã xác nhận OTP (6 số)</Label>
                  <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => { otpRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 text-center text-2xl font-bold border-2 focus:border-purple-500 focus:ring-purple-500 transition-all rounded-xl"
                        disabled={isLoading}
                      />
                    ))}
                  </div>

                  <div className="text-center mt-4">
                    {resendCooldown > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Gửi lại mã sau <span className="font-semibold text-purple-600">{resendCooldown}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center gap-1 mx-auto"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Gửi lại mã
                      </button>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md shadow-purple-500/20 mt-4 rounded-xl"
                  disabled={isLoading || otp.join("").length !== 6}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Đang xác minh...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Xác minh thẻ OTP
                    </div>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep("email"); setError(""); setSuccess(""); setOtp(["", "", "", "", "", ""]); }}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
                >
                  ← Đổi địa chỉ email khác
                </button>
              </form>
            )}

            {/* ====================================================== */}
            {/* STEP 3: MẬT KHẨU MỚI */}
            {/* ====================================================== */}
            {step === "password" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ít nhất 6 ký tự"
                      className="pl-10 pr-10 rounded-xl"
                      disabled={isLoading}
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Xác nhận lại mật khẩu mới</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="pl-10 pr-10 rounded-xl"
                      disabled={isLoading}
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[11px] text-red-500 mt-1.5 ml-1 font-medium">Mật khẩu xác nhận không khớp!</p>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg rounded-xl"
                    disabled={
                      isLoading ||
                      !newPassword ||
                      newPassword.length < 6 ||
                      newPassword !== confirmPassword
                    }
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Đang đặt lại...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Key className="h-4 w-4 mr-2" />
                        Xác nhận đổi mật khẩu
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            )}

            <div className="text-center text-sm pt-2">
              <span className="text-muted-foreground">Bạn đã nhớ mật khẩu cũ chưa? </span>
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Đăng nhập ngay
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-5">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Về trang mua sắm
          </Link>
        </div>

        <div className="flex justify-center mt-4">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
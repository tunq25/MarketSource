"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, ArrowLeft, Wallet, Star, Download } from 'lucide-react'
import { FloatingHeader } from "@/components/floating-header"
import { Footer } from "@/components/footer"
import { Logo } from "@/components/logo"
import { getDeviceInfo, getIPAddress } from "@/lib/auth"
import { getLocalStorage, setLocalStorage, removeLocalStorage } from "@/lib/localStorage-utils"
import { logger } from "@/lib/logger-client"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"

// Lazy load Three.js components để tối ưu performance
const ThreeJSProductShowcase = dynamic(
  async () => {
    try {
      const mod = await import("@/components/three-js-product-showcase")
      return { default: mod.ThreeJSProductShowcase }
    } catch (error) {
      logger.error('Failed to load ThreeJS Product Showcase component', error)
      throw error
    }
  },
  { 
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-gradient-to-b from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900" />
  }
)

const ThreeDFallback = dynamic(
  async () => {
    try {
      const mod = await import("@/components/3d-fallback")
      return { default: mod.ThreeDFallback }
    } catch (error) {
      logger.error('Failed to load 3D Fallback component', error)
      throw error
    }
  },
  { ssr: false }
)

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadCartItems()
      loadCurrentUser()
    }
  }, [mounted])

  const loadCartItems = () => {
    try {
      const items = getLocalStorage<any[]>('cartItems', [])
      setCartItems(items)
    } catch (error) {
      logger.error('Error loading cart items', error)
      setCartItems([])
    }
  }

  const loadCurrentUser = async () => {
    try {
      // ✅ FIX: Dùng userManager để đảm bảo sync với database
      const { userManager } = await import('@/lib/userManager');
      if (userManager.isLoggedIn()) {
        const user = await userManager.getUser();
        if (user) {
          setCurrentUser(user);
          return;
        }
      }
      
      // Fallback to localStorage
      const isLoggedIn = getLocalStorage<string | null>("isLoggedIn", null) === "true"
      const currentUserFromStorage = getLocalStorage<any>("currentUser", null) || getLocalStorage<any>("qtusdev_user", null)
      
      if (isLoggedIn && currentUserFromStorage) {
        setCurrentUser(currentUserFromStorage)
      }
    } catch (error) {
      logger.error('Error loading current user', error)
    }
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    const updatedItems = cartItems.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    )
    
    setCartItems(updatedItems)
    setLocalStorage('cartItems', updatedItems)
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const removeFromCart = (productId: number) => {
    const updatedItems = cartItems.filter(item => item.id !== productId)
    
    setCartItems(updatedItems)
    setLocalStorage('cartItems', updatedItems)
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0)
  }

  const handleCheckout = async () => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để thanh toán!")
      router.push("/auth/login")
      return
    }

    if (cartItems.length === 0) {
      alert("Giỏ hàng trống!")
      return
    }

    const totalPrice = getTotalPrice()
    
    if (currentUser.balance < totalPrice) {
      alert(`Số dư không đủ! Bạn cần ${(totalPrice - currentUser.balance).toLocaleString('vi-VN')}đ nữa.`)
      router.push("/deposit")
      return
    }

    setIsLoading(true)

    try {
      // Get device info and IP
      const deviceInfo = getDeviceInfo()
      const ipAddress = "Unknown" // Non-blocking version doesn't return a value

      // ✅ FIX: Create purchase records trong database TRƯỚC khi update balance
      // Đảm bảo purchase thành công mới trừ tiền
      // Balance đã được trừ trong createPurchase() function (transaction-safe)
      const purchaseResults = [];
      try {
        for (const item of cartItems) {
          // ✅ FIX: Thêm Authorization header nếu có token
          const headers: HeadersInit = { 'Content-Type': 'application/json' };
          const token = getLocalStorage<string | null>('firebaseToken', null) || getLocalStorage<string | null>('authToken', null);
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const response = await fetch('/api/purchases', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              userId: currentUser.uid || currentUser.id,
              productId: item.id,
              amount: item.price * (item.quantity || 1),
              userEmail: currentUser.email
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `Purchase failed: ${response.status}`);
          }
          
          const result = await response.json();
          if (!result.success) {
            throw new Error(result.error || 'Purchase failed');
          }
          purchaseResults.push(result);
        }
      } catch (purchaseError: any) {
        logger.error('Failed to create purchase records in database', purchaseError);
        alert(purchaseError.message || 'Không thể tạo đơn hàng. Vui lòng thử lại!');
        setIsLoading(false);
        return; // ✅ FIX: Stop here nếu purchase fail, không trừ tiền
      }

      // ✅ FIX: Chỉ update balance SAU KHI tất cả purchases thành công
      // Balance đã được trừ trong createPurchase() function (transaction-safe)
      const { userManager } = await import('@/lib/userManager');
      // Reload user để có balance mới nhất từ database
      const updatedUserData = await userManager.getUser();
      const updatedUser = {
        ...currentUser,
        balance: updatedUserData?.balance || currentUser.balance - totalPrice,
        totalSpent: (currentUser.totalSpent || 0) + totalPrice
      }

      // Update registered users
      const registeredUsers = getLocalStorage<any[]>("registeredUsers", [])
      const updatedUsers = registeredUsers.map((u: any) => 
        (u.id === currentUser.id || u.uid === currentUser.uid || u.email === currentUser.email) ? updatedUser : u
      )
      setLocalStorage("registeredUsers", updatedUsers)
      setLocalStorage("currentUser", updatedUser)
      setCurrentUser(updatedUser)

      // Save purchases to localStorage for offline access
      const userPurchases = getLocalStorage<any[]>("userPurchases", [])
      const newPurchases = cartItems.map(item => ({
        ...item,
        userId: currentUser.id || currentUser.uid,
        userEmail: currentUser.email,
        purchaseDate: new Date().toISOString(),
        purchaseTime: new Date().toLocaleString("vi-VN"),
        deviceInfo,
        ipAddress,
        downloads: 0, // Initialize download count
        rating: 0, // Initialize rating
        reviewCount: 0, // Initialize review count
        review: null // Initialize review
      }))
      
      userPurchases.push(...newPurchases)
      setLocalStorage("userPurchases", userPurchases)

      // Send notification to admin
      const orderNotification = {
        id: Date.now(),
        type: "new_order",
        title: "Đơn hàng mới",
        message: `🛒 ${currentUser.name} đã mua ${cartItems.length} sản phẩm\n💰 Tổng tiền: ${totalPrice.toLocaleString('vi-VN')}đ\n📧 Email: ${currentUser.email}\n🌐 IP: ${ipAddress}\n📱 Thiết bị: ${deviceInfo.deviceType} - ${deviceInfo.browser}\n⏰ Thời gian: ${new Date().toLocaleString("vi-VN")}\n\nSản phẩm:\n${cartItems.map(item => `• ${item.title} (${item.quantity || 1}x)`).join('\n')}`,
        timestamp: new Date().toISOString(),
        read: false,
      }

      const adminNotifications = getLocalStorage<any[]>("adminNotifications", [])
      adminNotifications.unshift(orderNotification)
      setLocalStorage("adminNotifications", adminNotifications)

      // Clear cart
      setCartItems([])
      removeLocalStorage('cartItems')
      window.dispatchEvent(new Event('cartUpdated'))
      window.dispatchEvent(new Event('userUpdated'))

      alert(`Thanh toán thành công! Bạn đã mua ${cartItems.length} sản phẩm với tổng tiền ${totalPrice.toLocaleString('vi-VN')}đ`)
      router.push("/dashboard")

    } catch (error) {
      logger.error("Checkout error", error)
      alert("Có lỗi xảy ra khi thanh toán. Vui lòng thử lại!")
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Logo />
          <p className="mt-4 text-muted-foreground">Đang tải giỏ hàng...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* 3D Background */}
      <div className="absolute inset-0">
        <ThreeJSProductShowcase />
        <ThreeDFallback />
      </div>
      
      <FloatingHeader />
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
              <div>
                <h1 className="text-3xl font-bold flex items-center">
                  <ShoppingCart className="w-8 h-8 mr-3" />
                  Giỏ hàng
                </h1>
                <p className="text-muted-foreground">
                  {cartItems.length} sản phẩm trong giỏ hàng
                </p>
              </div>
            </div>
            {currentUser && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Số dư hiện tại</p>
                <p className="text-2xl font-bold text-green-600">
                  {(currentUser.balance || 0).toLocaleString('vi-VN')}đ
                </p>
              </div>
            )}
          </div>

          {cartItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Giỏ hàng trống</h2>
                <p className="text-muted-foreground mb-6">
                  Bạn chưa thêm sản phẩm nào vào giỏ hàng
                </p>
                <Button asChild>
                  <Link href="/products">
                    Khám phá sản phẩm
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.title}
                          width={80}
                          height={80}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge>{item.category}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {item.price.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 mr-1" />
                              <span className="text-sm text-muted-foreground">
                                {item.rating || 0}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Download className="w-4 h-4 text-muted-foreground mr-1" />
                              <span className="text-sm text-muted-foreground">
                                {item.downloads || 0} downloads
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {item.quantity || 1}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Thành tiền:
                        </span>
                        <span className="font-bold text-lg">
                          {(item.price * (item.quantity || 1)).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Tóm tắt đơn hàng</CardTitle>
                    <CardDescription>
                      Chi tiết thanh toán
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Tạm tính:</span>
                        <span>{getTotalPrice().toLocaleString('vi-VN')}đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phí vận chuyển:</span>
                        <span className="text-green-600">Miễn phí</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Tổng cộng:</span>
                        <span className="text-green-600">
                          {getTotalPrice().toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>

                    {currentUser ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Số dư hiện tại:</span>
                            <span className="font-medium">
                              {(currentUser.balance || 0).toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                          {currentUser.balance < getTotalPrice() && (
                            <p className="text-sm text-red-600 mt-1">
                              Thiếu {(getTotalPrice() - currentUser.balance).toLocaleString('vi-VN')}đ
                            </p>
                          )}
                        </div>

                        {currentUser.balance < getTotalPrice() ? (
                          <div className="space-y-2">
                            <Button asChild className="w-full" variant="outline">
                              <Link href="/deposit">
                                <Wallet className="w-4 h-4 mr-2" />
                                Nạp thêm tiền
                              </Link>
                            </Button>
                            <Button 
                              disabled 
                              className="w-full"
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Số dư không đủ
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={handleCheckout}
                            disabled={isLoading}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            {isLoading ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Đang xử lý...
                              </div>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4 mr-2" />
                                Thanh toán ngay
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground text-center">
                          Vui lòng đăng nhập để thanh toán
                        </p>
                        <Button asChild className="w-full">
                          <Link href="/auth/login">
                            Đăng nhập
                          </Link>
                        </Button>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground text-center">
                      <p>Bằng việc thanh toán, bạn đồng ý với</p>
                      <Link href="/terms" className="text-primary hover:underline">
                        Điều khoản sử dụng
                      </Link>
                      {" và "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Chính sách bảo mật
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

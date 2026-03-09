"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Home, 
  Package, 
  FolderTree, 
  HeadphonesIcon,
  User,
  LogIn,
  UserPlus,
  ShoppingCart,
  Zap
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { getLocalStorage, removeLocalStorage } from '@/lib/localStorage-utils'
import { logger } from '@/lib/logger-client'

const navItems = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/products', label: 'Sản phẩm', icon: Package },
  { href: '/categories', label: 'Danh mục', icon: FolderTree },
  { href: '/support', label: 'Hỗ trợ', icon: HeadphonesIcon },
]

export function FloatingHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    setMounted(true)
    
    // Handle scroll effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    
    // ✅ FIX: Load user data với safe localStorage utils
    const loadUserData = () => {
      try {
        const userData = getLocalStorage<any>('currentUser', null)
        const isLoggedIn = getLocalStorage<boolean | string>('isLoggedIn', false) === true || 
                          getLocalStorage<string>('isLoggedIn', 'false') === 'true'
        if (userData && isLoggedIn) {
          setUser(userData)
        } else {
          setUser(null)
        }
      } catch (error) {
        logger.error('Error loading user data in FloatingHeader', error)
        setUser(null)
      }
    }
    
    // ✅ FIX: Load cart count với safe localStorage utils
    const loadCartCount = () => {
      try {
        const cartItems = getLocalStorage<any[]>('cartItems', [])
        setCartCount(cartItems.reduce((total: number, item: any) => total + (item.quantity || 1), 0))
      } catch (error) {
        logger.error('Error loading cart count in FloatingHeader', error)
        setCartCount(0)
      }
    }
    
    loadUserData()
    loadCartCount()
    
    // Listen for updates
    const handleUserUpdate = () => loadUserData()
    const handleCartUpdate = () => loadCartCount()
    
    window.addEventListener('userUpdated', handleUserUpdate)
    window.addEventListener('cartUpdated', handleCartUpdate)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('userUpdated', handleUserUpdate)
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [])

  const handleLogout = () => {
    // ✅ FIX: Dùng safe localStorage utils
    removeLocalStorage('currentUser')
    removeLocalStorage('isLoggedIn')
    setUser(null)
    window.dispatchEvent(new Event('userUpdated'))
    router.push('/')
  }

  if (!mounted) {
    return null
  }

  return (
    <>
      {/* Desktop Header */}
      <header
        className={cn(
          'hidden md:flex fixed top-4 left-1/2 -translate-x-1/2 z-50',
          'w-full max-w-[1200px] mx-auto px-4',
          'transition-all duration-300 ease-out'
        )}
      >
        <div
          className={cn(
            'w-full h-16 px-6',
            'flex items-center justify-between gap-4',
            'bg-white/80 dark:bg-gray-900/80',
            'backdrop-blur-xl',
            'border border-white/20 dark:border-gray-700/20',
            'rounded-[50px]',
            'shadow-lg shadow-black/5 dark:shadow-black/20',
            'transition-all duration-300',
            isScrolled && 'shadow-xl shadow-black/10 dark:shadow-black/30'
          )}
        >
          {/* Left: Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0 hover:opacity-80 transition-opacity">
            <Logo />
          </Link>

          {/* Center: Navigation */}
          <nav className="flex items-center gap-1 flex-1 justify-center">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 rounded-full',
                    'text-sm font-medium',
                    'transition-all duration-200',
                    'hover:bg-white/50 dark:hover:bg-gray-800/50',
                    isActive
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
                  )}
                >
                  <span className="hidden lg:inline">{item.label}</span>
                  <Icon className="w-4 h-4 lg:hidden" />
                </Link>
              )
            })}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="h-9 w-9 rounded-full hover:bg-white/50 dark:hover:bg-gray-800/50"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Cart (if logged in) */}
            {user && (
              <Link href="/cart">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-white/50 dark:hover:bg-gray-800/50 relative"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {/* Login/Register or User Menu */}
            {user ? (
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className="h-9 px-4 rounded-full hover:bg-white/50 dark:hover:bg-gray-800/50"
                >
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">{user.name || user.email}</span>
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    className="h-9 px-4 rounded-full hover:bg-white/50 dark:hover:bg-gray-800/50"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    <span className="hidden lg:inline">Đăng nhập</span>
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button
                    className="h-9 px-6 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    <span className="hidden lg:inline">Đăng ký</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header
        className={cn(
          'md:hidden fixed top-4 left-1/2 -translate-x-1/2 z-50',
          'w-[calc(100%-32px)] max-w-[600px]',
          'transition-all duration-300 ease-out'
        )}
      >
        <div
          className={cn(
            'w-full h-14 px-4',
            'flex items-center justify-between',
            'bg-white/80 dark:bg-gray-900/80',
            'backdrop-blur-xl',
            'border border-white/20 dark:border-gray-700/20',
            'rounded-[40px]',
            'shadow-lg shadow-black/5 dark:shadow-black/20',
            'transition-all duration-300',
            isScrolled && 'shadow-xl shadow-black/10 dark:shadow-black/30'
          )}
        >
          {/* Left: Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="p-1.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              QtusDev
            </span>
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="h-8 w-8 rounded-full"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Cart (if logged in) */}
            {user && (
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full relative">
                  <ShoppingCart className="h-4 w-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {/* Menu Toggle */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="bottom" 
                className="h-[85vh] rounded-t-[40px] border-t border-white/20 dark:border-gray-700/20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl"
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <Logo />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-full"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Navigation */}
                  <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-4 px-6 py-4 rounded-2xl',
                            'text-base font-medium',
                            'transition-all duration-200',
                            isActive
                              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </nav>

                  {/* User Actions */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    {user ? (
                      <>
                        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                          <Button
                            variant="outline"
                            className="w-full h-12 rounded-2xl justify-start"
                          >
                            <User className="h-5 w-5 mr-3" />
                            <span>{user.name || user.email}</span>
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          onClick={() => {
                            handleLogout()
                            setMobileMenuOpen(false)
                          }}
                          className="w-full h-12 rounded-2xl"
                        >
                          Đăng xuất
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                          <Button
                            variant="outline"
                            className="w-full h-12 rounded-2xl"
                          >
                            <LogIn className="h-5 w-5 mr-3" />
                            Đăng nhập
                          </Button>
                        </Link>
                        <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                          <Button
                            className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                          >
                            <UserPlus className="h-5 w-5 mr-3" />
                            Đăng ký
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  )
}


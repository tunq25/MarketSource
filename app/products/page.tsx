"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Download, Eye, ShoppingCart, Search } from 'lucide-react'
import { FloatingHeader } from "@/components/floating-header"
import { Footer } from "@/components/footer"
import dynamic from "next/dynamic"
import Image from "next/image"
import { getLocalStorage, setLocalStorage } from "@/lib/localStorage-utils"
import { logger } from "@/lib/logger-client"
import { ProductSkeletonGrid } from "@/components/product-skeleton"

// Lazy load Three.js components để tối ưu performance
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

const BASE_CATEGORIES = [
    { id: "all", name: "Tất cả", count: 0 },
    { id: "website", name: "Website", count: 0 },
    { id: "mobile", name: "Mobile App", count: 0 },
    { id: "game", name: "Game", count: 0 },
    { id: "tool", name: "Tools", count: 0 },
    { id: "template", name: "Template", count: 0 },
]

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("price-low")
  const [priceRange, setPriceRange] = useState("all")
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [categories, setCategories] = useState(BASE_CATEGORIES)

  useEffect(() => {
    // ✅ FIX: Load products từ API thay vì localStorage
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const { apiGet } = await import('@/lib/api-client');
        const { mapBackendProductsToFrontend } = await import('@/lib/product-mapper');
        
        const result = await apiGet('/api/products');
        if (result.success && result.products) {
          // Map backend format → frontend format
          const mappedProducts = mapBackendProductsToFrontend(result.products);
          
          // Ensure all products have proper structure
          const validatedProducts = mappedProducts.map((product: any) => ({
            ...product,
            tags: Array.isArray(product.tags) ? product.tags : [],
            rating: product.rating || product.averageRating || 0,
            downloads: product.downloads || product.downloadCount || 0,
            price: product.price || 0,
            originalPrice: product.originalPrice || product.price || 0,
          }));

          setProducts(validatedProducts);

          // Update category counts từ BASE_CATEGORIES để tránh phụ thuộc state trong deps
          const updatedCategories = BASE_CATEGORIES.map((category) => {
            if (category.id === "all") {
              return { ...category, count: validatedProducts.length }
            } else {
              return {
                ...category,
                count: validatedProducts.filter((p: any) => p.category === category.id).length
              }
            }
          });
          setCategories(updatedCategories);
        }
      } catch (error: any) {
        logger.error('Error loading products', error);
        
        // ✅ FIX: Hiển thị thông báo lỗi rõ ràng nếu là database connection error
        if (error?.message?.includes('Database connection failed') || 
            error?.error?.includes('Database connection failed') ||
            error?.code === 'DB_CONNECTION_FAILED') {
          // Set empty products và hiển thị error message
          setProducts([]);
          // Log để user biết
          logger.error('⚠️ Database connection failed. Please check Netlify environment variables.');
          return;
        }
        
        // Fallback to localStorage nếu API fail vì lý do khác
        const uploadedProducts = getLocalStorage<any[]>("uploadedProducts", []);
        const validatedProducts = uploadedProducts.map((product: any) => ({
          ...product,
          tags: Array.isArray(product.tags) ? product.tags : [],
          rating: product.rating || 0,
          downloads: product.downloads || 0,
          price: product.price || 0,
          originalPrice: product.originalPrice || product.price || 0,
        }));
        setProducts(validatedProducts);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProducts();
  }, [])

  // ✅ FIX: Debounce search query để tránh quá nhiều re-renders
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredProducts = useMemo((): any[] => {
    return products.filter((product) => {
    const matchesSearch =
      product.title?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (Array.isArray(product.tags) && product.tags.some((tag: any) => tag.toLowerCase().includes(debouncedSearchQuery.toLowerCase())))

    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory

    const matchesPrice =
      priceRange === "all" ||
      (priceRange === "under-100k" && product.price < 100000) ||
      (priceRange === "100k-200k" && product.price >= 100000 && product.price < 200000) ||
      (priceRange === "200k-300k" && product.price >= 200000 && product.price < 300000) ||
      (priceRange === "over-300k" && product.price >= 300000)

    return matchesSearch && matchesCategory && matchesPrice
    })
  }, [products, debouncedSearchQuery, selectedCategory, priceRange])

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "popular":
        return (b.downloads || 0) - (a.downloads || 0)
      case "rating":
        return (b.rating || 0) - (a.rating || 0)
      case "relevance":
        const calculateRelevanceScore = (product: any) => {
          if (!debouncedSearchQuery) return 0;
          const lowerQuery = debouncedSearchQuery.toLowerCase();
          let score = 0;

          // Score for title
          if (product.title?.toLowerCase().includes(lowerQuery)) {
            score += 10;
          }

          // Score for description
          if (product.description?.toLowerCase().includes(lowerQuery)) {
            score += 5;
          }

          // Score for tags
          if (Array.isArray(product.tags)) {
            product.tags.forEach((tag: any) => {
              if (tag.toLowerCase().includes(lowerQuery)) {
                score += 3;
              }
            });
          }
          return score;
        };

        const scoreA = calculateRelevanceScore(a);
        const scoreB = calculateRelevanceScore(b);

        // Sort by score descending, then by rating descending as a tie-breaker
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        } else {
          return (b.rating || 0) - (a.rating || 0);
        }
      default:
        return 0
    }
  })

  const handleAddToCart = (product: any) => {
    if (typeof window !== "undefined" && (window as any).addToCart) {
      ;(window as any).addToCart(product)
    } else {
      // Fallback if addToCart is not available
      const cartItems = getLocalStorage<any[]>("cartItems", [])
      const existingItem = cartItems.find((item: any) => item.id === product.id)

      if (existingItem) {
        existingItem.quantity += 1
      } else {
        cartItems.push({ ...product, quantity: 1 })
      }

      setLocalStorage("cartItems", cartItems)
      window.dispatchEvent(new Event("cartUpdated"))
      alert(`Đã thêm "${product.title}" vào giỏ hàng!`)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen relative">
      {/* 3D Background */}
      <div className="absolute inset-0">
        <ThreeJSProductShowcase />
        <ThreeDFallback />
      </div>
      
      <FloatingHeader />

      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="mb-8 animate-fade-in-down">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Mã nguồn{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              chất lượng cao
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Khám phá hàng trăm mã nguồn được tuyển chọn kỹ lưỡng từ các developer hàng đầu
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-gray-900 dark:text-gray-100 text-sm font-medium mb-2">Tìm kiếm</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm mã nguồn..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-900 dark:text-gray-100 text-sm font-medium mb-2">Thể loại</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} ({category.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-gray-900 dark:text-gray-100 text-sm font-medium mb-2">Khoảng giá</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="under-100k">Dưới 100k</SelectItem>
                      <SelectItem value="100k-200k">100k - 200k</SelectItem>
                      <SelectItem value="200k-300k">200k - 300k</SelectItem>
                      <SelectItem value="over-300k">Trên 300k</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-gray-900 dark:text-gray-100 text-sm font-medium mb-2">Sắp xếp</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Mới nhất</SelectItem>
                      <SelectItem value="oldest">Cũ nhất</SelectItem>
                      <SelectItem value="price-low">Giá thấp đến cao</SelectItem>
                      <SelectItem value="price-high">Giá cao đến thấp</SelectItem>
                      <SelectItem value="popular">Phổ biến nhất</SelectItem>
                      <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
                      <SelectItem value="relevance">Phù hợp nhất</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Hiển thị {sortedProducts.length} kết quả
            {searchQuery && ` cho "${searchQuery}"`}
            {selectedCategory !== "all" &&
              ` trong thể loại "${categories.find((c) => c.id === selectedCategory)?.name}"`}
          </p>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <ProductSkeletonGrid count={6} />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedProducts.map((product, index) => (
              <Card
              key={product.id}
              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-500/50 transition-all duration-300 group overflow-hidden card-hover glass-card animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative overflow-hidden">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.title}
                    width={400}
                    height={192}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {product.featured && (
                  <Badge className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                    Nổi bật
                  </Badge>
                )}
                <div className="absolute top-4 right-4 flex items-center space-x-2">
                  <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-gray-900 dark:text-gray-100 text-sm">{product.rating}</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex space-x-2">
                    {product.demoLink && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 bg-transparent"
                        onClick={() => window.open(product.demoLink, "_blank")}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Demo
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-purple-400 transition-colors">
                  {product.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{product.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {Array.isArray(product.tags) &&
                    product.tags.length > 0 &&
                    product.tags.slice(0, 3).map((tag: any, index: number) => (
                      <Badge key={index} variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  {Array.isArray(product.tags) && product.tags.length > 3 && (
                    <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-xs">
                      +{product.tags.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{product.price.toLocaleString("vi-VN")}đ</span>
                    {product.originalPrice > product.price && (
                      <span className="text-sm text-gray-600 dark:text-gray-400 line-through">
                        {product.originalPrice.toLocaleString("vi-VN")}đ
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                    <Download className="w-4 h-4 mr-1" />
                    {product.downloads}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover-lift hover-glow animate-gradient"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                    Mua ngay
                  </Button>
                  {product.demoLink && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 bg-transparent hover-lift"
                      onClick={() => window.open(product.demoLink, "_blank")}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {/* No Results */}
        {sortedProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Không tìm thấy kết quả</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {products.length === 0
                ? "Chưa có sản phẩm nào được upload. Admin vui lòng upload sản phẩm mới."
                : "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để tìm thấy mã nguồn phù hợp"}
            </p>
            {/* ✅ FIX: Hiển thị thông báo nếu database connection fail */}
            {products.length === 0 && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Nếu bạn là admin, vui lòng kiểm tra database connection trên Netlify.
                </p>
              </div>
            )}
            {products.length > 0 && (
              <Button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                  setPriceRange("all")
                  setSortBy("newest")
                }}
                variant="outline"
                className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 bg-transparent"
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        )}

        {/* Load More */}
        {sortedProducts.length > 0 && (
          <div className="text-center mt-12">
            <Button
              variant="outline"
              size="lg"
              className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 px-8 bg-transparent"
            >
              Xem thêm mã nguồn
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

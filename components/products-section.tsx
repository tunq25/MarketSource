"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, type Variants } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Download, Eye, ShoppingCart, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Product } from "@/types/product"
import { apiGet } from "@/lib/api-client"
import { mapBackendProductsToFrontend } from "@/lib/product-mapper"
import { logger } from "@/lib/logger-client"

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
}

const gridVariants: Variants = {
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 150, damping: 18 },
  },
}

export function ProductsSection() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState([
    { id: "all", name: "Tất cả", count: 0 },
    { id: "website", name: "Website", count: 0 },
    { id: "mobile", name: "Mobile App", count: 0 },
    { id: "game", name: "Game", count: 0 },
    { id: "tool", name: "Tools", count: 0 },
  ])
  const [isLoading, setIsLoading] = useState(true)

  const toNumber = (value: unknown): number | null => {
    if (value === null || value === undefined) {
      return null
    }
    const parsedValue = typeof value === "number" ? value : Number.parseFloat(String(value))
    return Number.isNaN(parsedValue) ? null : parsedValue
  }

  useEffect(() => {
    const loadFromLocalStorage = () => {
      try {
      const uploadedProducts = JSON.parse(localStorage.getItem("uploadedProducts") || "[]")
      return uploadedProducts.map((product: any) => ({
        ...product,
        tags: Array.isArray(product.tags) ? product.tags : [],
        rating: product.rating || 0,
        downloads: product.downloads || 0,
        price: product.price || 0,
        originalPrice: product.originalPrice || product.price || 0,
      }))
      } catch (error) {
        logger.error('Error parsing localStorage products:', error);
        return [];
      }
    }

    const updateCategoryCounts = (validatedProducts: Product[]) => {
      setCategories((prev) =>
        prev.map((category) => {
          if (category.id === "all") {
            return { ...category, count: validatedProducts.length }
          }
          return {
            ...category,
            count: validatedProducts.filter((p: any) => p.category === category.id).length
          }
        })
      )
    }

    const loadProducts = async () => {
      try {
        const result = await apiGet("/api/products")
        if (result?.success && Array.isArray(result.products)) {
          const mapped = mapBackendProductsToFrontend(result.products).map((product: any) => ({
            ...product,
            tags: Array.isArray(product.tags) ? product.tags : [],
            rating: product.rating || product.averageRating || 0,
            downloads: product.downloads || product.downloadCount || 0,
            price: product.price || 0,
            originalPrice: product.originalPrice || product.price || 0,
          }))
          setProducts(mapped)
          updateCategoryCounts(mapped)
          return
        }
        throw new Error("Invalid response")
      } catch {
        const fallbackProducts = loadFromLocalStorage()
        setProducts(fallbackProducts)
        updateCategoryCounts(fallbackProducts)
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()

    const handleProductsUpdate = () => {
      loadProducts()
    }

    window.addEventListener("productsUpdated", handleProductsUpdate)
    
    return () => {
      window.removeEventListener("productsUpdated", handleProductsUpdate)
    }
  }, [])

  const filteredProducts = useMemo(
    () => (activeCategory === "all" ? products : products.filter(product => product.category === activeCategory)),
    [activeCategory, products],
  )

  const handleAddToCart = (product: any) => {
    if (typeof window !== "undefined" && (window as any).addToCart) {
      ;(window as any).addToCart(product)
    } else {
      // Fallback if addToCart is not available
      try {
      const cartItems = JSON.parse(localStorage.getItem("cartItems") || "[]")
      const existingItem = cartItems.find((item: any) => item.id === product.id)

      if (existingItem) {
        existingItem.quantity += 1
      } else {
        cartItems.push({ ...product, quantity: 1 })
      }

      localStorage.setItem("cartItems", JSON.stringify(cartItems))
      window.dispatchEvent(new Event("cartUpdated"))
      alert(`Đã thêm "${product.title}" vào giỏ hàng!`)
      } catch (error) {
        logger.error('Error adding to cart:', error);
        alert('Lỗi khi thêm sản phẩm vào giỏ hàng. Vui lòng thử lại!');
      }
    }
  }

  if (!isLoading && products.length === 0) {
    return (
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-gray-50 via-purple-50/20 to-white dark:from-gray-900 dark:via-purple-950/10 dark:to-gray-950" />
        <div className="container relative z-10 mx-auto px-4">
          <motion.div
            className="rounded-3xl border border-dashed border-purple-200/80 bg-white/80 p-12 text-center shadow-xl shadow-purple-500/10 backdrop-blur-2xl dark:bg-gray-900/80"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Sparkles className="mx-auto mb-4 h-12 w-12 text-purple-500" />
            <h3 className="text-3xl font-semibold text-gray-900 dark:text-white">Chưa có sản phẩm nổi bật</h3>
            <p className="mt-3 text-gray-600 dark:text-gray-300">Upload sản phẩm để kích hoạt khu vực curated showcase.</p>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-purple-950/30 dark:to-gray-950" />
      <div className="pointer-events-none absolute left-10 top-12 h-72 w-72 rounded-full bg-purple-500/15 blur-[140px]" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-80 w-80 translate-x-1/4 rounded-full bg-pink-500/10 blur-[160px]" />

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          className="text-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-120px" }}
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-gray-600 shadow-lg shadow-purple-500/10 backdrop-blur-2xl dark:bg-white/10 dark:text-gray-100">
            curated picks
          </p>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl dark:text-white">
            Mã nguồn{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              nổi bật
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Những gói code được tối ưu hiệu năng, tài liệu chuẩn enterprise và sẵn sàng triển khai thực tế.
          </p>
        </motion.div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {categories.map(category => {
            const isActive = activeCategory === category.id
            return (
              <motion.button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`rounded-full border px-5 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "border-transparent bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/40"
                    : "border-gray-200/70 bg-white/70 text-gray-700 backdrop-blur-xl hover:border-purple-200 dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-200"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {category.name} <span className="ml-2 text-xs opacity-80">({category.count})</span>
              </motion.button>
            )
          })}
        </div>

        <motion.div
          className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={gridVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          {filteredProducts.map(product => {
            const priceValue = toNumber(product.price) ?? 0
            const rawOriginalPrice = product.originalPrice ?? product.original_price ?? null
            const originalPriceValue = toNumber(rawOriginalPrice)
            const imageSrc = product.image || product.imageUrl || product.image_url || "/placeholder.svg"
            const ratingValue =
              typeof product.rating === "number"
                ? product.rating
                : typeof product.average_rating === "number"
                  ? product.average_rating
                  : 0
            const downloadsValue =
              typeof product.downloads === "number"
                ? product.downloads
                : typeof product.download_count === "number"
                  ? product.download_count
                  : 0
            const demoLink = product.demoLink || product.demoUrl || product.demo_url || null

            return (
              <motion.article
                key={product.id}
                variants={cardVariants}
                whileHover={{ y: -10 }}
                className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/95 p-[1px] shadow-2xl shadow-purple-500/10 backdrop-blur-2xl dark:bg-gray-900/80"
              >
                <div className="relative rounded-[28px] bg-white/90 dark:bg-gray-950/80">
                  <div className="relative h-56 overflow-hidden rounded-t-[28px]">
                    <Image src={imageSrc} alt={product.title} fill className="object-cover transition duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60" />
                    {product.featured && (
                      <Badge className="absolute left-5 top-5 bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg">
                        Nổi bật
                      </Badge>
                    )}
                    <div className="absolute right-5 top-5 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1 text-white backdrop-blur">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm">{ratingValue.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="space-y-4 px-6 py-6">
                    <h3 className="text-xl font-semibold text-gray-900 transition group-hover:text-purple-500 dark:text-white line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{product.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(product.tags) &&
                        product.tags.slice(0, 3).map(tag => (
                          <span
                            key={`${product.id}-${tag}`}
                            className="rounded-full border border-purple-200/60 px-3 py-1 text-xs text-purple-600 dark:border-purple-500/30 dark:text-purple-200"
                          >
                            {tag}
                          </span>
                        ))}
                      {Array.isArray(product.tags) && product.tags.length > 3 && (
                        <span className="rounded-full border border-gray-200/60 px-3 py-1 text-xs text-gray-600 dark:text-gray-300">
                          +{product.tags.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {priceValue.toLocaleString("vi-VN")}đ
                        </span>
                        {originalPriceValue && originalPriceValue > priceValue && (
                          <span className="ml-2 text-sm text-gray-500 line-through">
                            {originalPriceValue.toLocaleString("vi-VN")}đ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-300">
                        <Download className="mr-2 h-4 w-4" />
                        {downloadsValue}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/30 transition hover:translate-y-0.5 hover:shadow-purple-500/60"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Mua ngay
                      </Button>
                      {demoLink && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                          onClick={() => window.open(demoLink, "_blank")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </motion.div>

        <div className="mt-12 text-center">
          <Link href="/products">
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/80 px-8 text-gray-800 backdrop-blur-xl hover:bg-white dark:border-gray-700 dark:bg-gray-900/70 dark:text-white"
            >
              Xem tất cả mã nguồn
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

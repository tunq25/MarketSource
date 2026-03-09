"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, ShoppingCart } from "lucide-react"
import { WishlistButton } from "./wishlist-button"
import Link from "next/link"
import Image from "next/image"

interface Product {
  id: number
  title: string
  description?: string
  price: number
  thumbnail?: string
  category?: string
  avg_rating?: number
  review_count?: number
}

interface AnimatedProductCardProps {
  product: Product
  index?: number
}

export function AnimatedProductCard({ product, index = 0 }: AnimatedProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
        <Link href={`/product-info?id=${product.id}`}>
          <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
            {product.thumbnail ? (
              <Image
                src={product.thumbnail}
                alt={product.title}
                fill
                className="object-cover hover:scale-110 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{product.title[0]}</span>
              </div>
            )}
            <div className="absolute top-2 right-2">
              <WishlistButton productId={product.id} size="sm" />
            </div>
            {product.category && (
              <div className="absolute top-2 left-2">
                <Badge variant="secondary">{product.category}</Badge>
              </div>
            )}
          </div>
        </Link>

        <CardHeader className="flex-1">
          <CardTitle className="line-clamp-2">{product.title}</CardTitle>
          {product.description && (
            <CardDescription className="line-clamp-2">
              {product.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              {product.avg_rating ? (
                <>
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold">
                    {product.avg_rating.toFixed(1)}
                  </span>
                  {product.review_count && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({product.review_count})
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm text-gray-500">Chưa có đánh giá</span>
              )}
            </div>
            <div className="text-2xl font-bold text-purple-600">
              ${product.price.toFixed(2)}
            </div>
          </div>
        </CardContent>

        <CardFooter className="gap-2">
          <Button asChild className="flex-1" variant="default">
            <Link href={`/product-info?id=${product.id}`}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Xem chi tiết
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}


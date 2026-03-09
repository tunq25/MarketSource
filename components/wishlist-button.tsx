"use client"

import { useState, useEffect, useCallback } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiGet, apiPost, apiDelete } from "@/lib/api-client"
import { trackAddToWishlist } from "@/lib/analytics"
import { toast } from "sonner"
import { logger } from "@/lib/logger-client"

interface WishlistButtonProps {
  productId: number
  className?: string
  size?: "sm" | "md" | "lg" | "default" | "icon"
}

export function WishlistButton({ productId, className, size = "md" }: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  const checkWishlistStatus = useCallback(async () => {
    try {
      const result = await apiGet(`/api/wishlist?productId=${productId}`)
      setIsInWishlist(result.inWishlist || false)
    } catch (error) {
      logger.error('Error checking wishlist:', error)
    } finally {
      setIsChecking(false)
    }
  }, [productId])

  useEffect(() => {
    checkWishlistStatus()
  }, [productId, checkWishlistStatus])

  const handleToggleWishlist = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      if (isInWishlist) {
        await apiDelete(`/api/wishlist?productId=${productId}`)
        setIsInWishlist(false)
        toast.success("Đã xóa khỏi wishlist")
      } else {
        await apiPost('/api/wishlist', { productId })
        setIsInWishlist(true)
        trackAddToWishlist(productId)
        toast.success("Đã thêm vào wishlist")
      }
    } catch (error: any) {
      logger.error('Error toggling wishlist:', error)
      toast.error(error.message || "Có lỗi xảy ra")
    } finally {
      setIsLoading(false)
    }
  }

  // Map "md" to "default" since Button doesn't support "md"
  const buttonSize = size === "md" ? "default" : size;

  if (isChecking) {
    return (
      <Button
        variant="ghost"
        size={buttonSize as "sm" | "default" | "icon" | "lg" | undefined}
        className={className}
        disabled
      >
        <Heart className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size={buttonSize as "sm" | "default" | "icon" | "lg" | undefined}
      onClick={handleToggleWishlist}
      disabled={isLoading}
      className={className}
    >
      <Heart 
        className={`w-4 h-4 transition-colors ${
          isInWishlist 
            ? "fill-red-500 text-red-500" 
            : "text-gray-400 hover:text-red-500"
        }`} 
      />
    </Button>
  )
}


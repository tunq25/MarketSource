/**
 * Product Types & Interfaces
 */

export interface Product {
  id: number | string
  title: string
  description?: string | null
  price: number | string
  originalPrice?: number | null
  original_price?: number | null
  category?: string | null
  demoUrl?: string | null
  demoLink?: string | null
  demo_url?: string | null
  downloadUrl?: string | null
  download_url?: string | null
  fileUrl?: string | null
  imageUrl?: string | null
  image?: string | null
  image_url?: string | null
  tags?: string[] | null
  isActive?: boolean
  featured?: boolean
  created_at?: string | Date
  updated_at?: string | Date
  seller_id?: number | string | null
  stock?: number
  download_count?: number
  downloads?: number
  average_rating?: number
  rating?: number
  total_ratings?: number
}

export interface ProductReview {
  id: number | string
  productId: number | string
  userId: number | string
  rating: number // 1-5
  comment?: string | null
  userName?: string
  userEmail?: string
  userAvatar?: string
  productTitle?: string // For display
  created_at?: string | Date
  createdAt?: string | Date // Alias
  updated_at?: string | Date
}

export interface ProductRating {
  productId: number | string
  averageRating: number
  totalRatings: number
  updated_at?: string | Date
}

export interface Purchase {
  id: number | string
  userId: number | string
  productId: number | string
  product?: Product
  amount: number | string
  created_at?: string | Date
  purchaseDate?: string | Date
  title?: string
  category?: string
  price?: number | string
  description?: string
  downloads?: number
  rating?: number
  reviewCount?: number
  review?: string | null
  downloadLink?: string | null
  demoLink?: string | null
}

export interface DownloadRecord {
  id: number | string
  userId: number | string
  productId: number | string
  productTitle?: string
  version?: string
  totalDownloads?: number
  status?: string
  lastDownloadedAt?: string | Date
  createdAt?: string | Date
  ipAddress?: string | null
  userAgent?: string | null
  downloaded_at?: string | Date
}

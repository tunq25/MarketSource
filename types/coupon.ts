/**
 * Coupon Types & Interfaces
 */

export interface Coupon {
  id: string | number
  code: string
  title: string
  description?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minPurchase?: number
  maxDiscount?: number
  validFrom: string | Date
  validUntil: string | Date
  usageLimit?: number
  usedCount?: number
  isActive: boolean
  applicableProducts?: (string | number)[]
  applicableCategories?: string[]
}


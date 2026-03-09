"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ProductFiltersProps {
  categories?: string[]
  onFilterChange?: (filters: FilterState) => void
}

interface FilterState {
  category: string[]
  priceRange: [number, number]
  minRating: number
  sortBy: string
  searchQuery: string
}

export function ProductFilters({ categories = [], onFilterChange }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<FilterState>({
    category: searchParams?.get('category')?.split(',').filter(Boolean) || [],
    priceRange: [
      parseFloat(searchParams?.get('minPrice') || '0'),
      parseFloat(searchParams?.get('maxPrice') || '1000')
    ],
    minRating: parseFloat(searchParams?.get('minRating') || '0'),
    sortBy: searchParams?.get('sortBy') || 'popularity',
    searchQuery: searchParams?.get('q') || searchParams?.get('query') || '',
  })

  const updateURL = useCallback(() => {
    const params = new URLSearchParams()
    
    if (filters.searchQuery) params.set('q', filters.searchQuery)
    if (filters.category.length > 0) params.set('category', filters.category.join(','))
    if (filters.priceRange[0] > 0) params.set('minPrice', filters.priceRange[0].toString())
    if (filters.priceRange[1] < 1000) params.set('maxPrice', filters.priceRange[1].toString())
    if (filters.minRating > 0) params.set('minRating', filters.minRating.toString())
    if (filters.sortBy !== 'popularity') params.set('sortBy', filters.sortBy)

    router.push(`/products?${params.toString()}`, { scroll: false })
  }, [filters, router])

  useEffect(() => {
    updateURL()
    onFilterChange?.(filters)
  }, [filters, updateURL, onFilterChange])

  const handleCategoryToggle = (category: string) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...prev.category, category]
    }))
  }

  const handlePriceRangeChange = (values: number[]) => {
    setFilters(prev => ({
      ...prev,
      priceRange: [values[0], values[1]] as [number, number]
    }))
  }

  const handleRatingChange = (rating: number) => {
    setFilters(prev => ({
      ...prev,
      minRating: prev.minRating === rating ? 0 : rating
    }))
  }

  const clearFilters = () => {
    setFilters({
      category: [],
      priceRange: [0, 1000],
      minRating: 0,
      sortBy: 'popularity',
      searchQuery: '',
    })
  }

  const hasActiveFilters = 
    filters.category.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 1000 ||
    filters.minRating > 0 ||
    filters.sortBy !== 'popularity'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bộ lọc</CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div>
          <Label>Tìm kiếm</Label>
          <Input
            placeholder="Tìm sản phẩm..."
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateURL()
              }
            }}
          />
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <Label>Danh mục</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map(cat => (
                <Badge
                  key={cat}
                  variant={filters.category.includes(cat) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleCategoryToggle(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Price Range */}
        <div>
          <Label>
            Giá: ${filters.priceRange[0]} - ${filters.priceRange[1]}
          </Label>
          <Slider
            value={filters.priceRange}
            onValueChange={handlePriceRangeChange}
            min={0}
            max={1000}
            step={10}
            className="mt-2"
          />
        </div>

        {/* Rating */}
        <div>
          <Label>Đánh giá tối thiểu</Label>
          <div className="flex gap-2 mt-2">
            {[5, 4, 3, 2, 1].map(rating => (
              <Button
                key={rating}
                variant={filters.minRating === rating ? "default" : "outline"}
                size="sm"
                onClick={() => handleRatingChange(rating)}
              >
                {rating}+ ⭐
              </Button>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div>
          <Label>Sắp xếp theo</Label>
          <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">Phổ biến nhất</SelectItem>
              <SelectItem value="price_asc">Giá: Thấp → Cao</SelectItem>
              <SelectItem value="price_desc">Giá: Cao → Thấp</SelectItem>
              <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="oldest">Cũ nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}


"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Star, ThumbsUp } from "lucide-react"

export interface ProductReview {
  id: string
  productId: string
  productTitle: string
  rating: number
  comment: string
  createdAt: string
  helpfulCount?: number
  attachments?: string[]
  status?: "published" | "pending"
}

interface ReviewManagerProps {
  reviews: ProductReview[]
  onCreate?: (review: Omit<ProductReview, "id" | "createdAt">) => void
  onUpdate?: (review: ProductReview) => void
  onDelete?: (id: string) => void
}

export function ReviewManager({ reviews, onCreate, onUpdate, onDelete }: ReviewManagerProps) {
  const [form, setForm] = useState({ productId: "", productTitle: "", rating: 5, comment: "" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.productId || !form.comment) return
    onCreate?.({
      ...form,
      helpfulCount: 0,
      status: "pending",
    })
    setForm({ productId: "", productTitle: "", rating: 5, comment: "" })
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card className="bg-white/70 dark:bg-black/40">
        <CardHeader>
          <CardTitle>Viết đánh giá</CardTitle>
          <CardDescription>Chia sẻ trải nghiệm của bạn với sản phẩm</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="ID sản phẩm"
              value={form.productId}
              onChange={(e) => setForm((prev) => ({ ...prev, productId: e.target.value }))}
            />
            <input
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Tên sản phẩm"
              value={form.productTitle}
              onChange={(e) => setForm((prev) => ({ ...prev, productTitle: e.target.value }))}
            />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Đánh giá</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button type="button" key={value} onClick={() => setForm((prev) => ({ ...prev, rating: value }))}>
                    <Star className={`w-5 h-5 ${value <= form.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              rows={4}
              placeholder="Chia sẻ chi tiết về sản phẩm..."
              value={form.comment}
              onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
            />
            <Button type="submit" className="w-full">
              Gửi đánh giá
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white/70 dark:bg-black/40">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Đánh giá của bạn</CardTitle>
            <CardDescription>Quản lý các đánh giá đã gửi</CardDescription>
          </div>
          <Badge variant="outline">{reviews.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bạn chưa gửi đánh giá nào.</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{review.productTitle}</p>
                  <Badge variant="secondary">{new Date(review.createdAt).toLocaleDateString("vi-VN")}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className={`w-4 h-4 ${idx < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">
                    {review.status === "published" ? "Đã xuất bản" : "Đang duyệt"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <button className="flex items-center gap-1" type="button" onClick={() => onUpdate?.({ ...review, helpfulCount: (review.helpfulCount || 0) + 1 })}>
                    <ThumbsUp className="w-3 h-3" /> Hữu ích ({review.helpfulCount || 0})
                  </button>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onUpdate?.(review)}>
                      Sửa
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => onDelete?.(review.id)}>
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}


"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Star, Trash } from "lucide-react"

interface AdminReview {
  id: string | number
  productTitle: string
  userEmail: string
  userName?: string
  rating: number
  comment: string
  status: "pending" | "published" | "rejected"
  createdAt: string
  admin_response?: string
}

interface ReviewManagementProps {
  reviews: AdminReview[]
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
  onDelete: (id: string) => void
  onRespond: (id: string, message: string) => void
}

export function ReviewManagement({ reviews, onApprove, onReject, onDelete, onRespond }: ReviewManagementProps) {
  return (
    <Card className="neon-border-hover glass-panel text-slate-900 dark:text-slate-100">
      <CardHeader>
        <CardTitle>Quản lý đánh giá</CardTitle>
        <CardDescription>Duyệt, phản hồi hoặc xóa đánh giá spam</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">Không có đánh giá nào.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border rounded-xl p-4 space-y-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-sm">{review.productTitle}</p>
                  <p className="text-xs text-muted-foreground">{review.userEmail}</p>
                </div>
                <Badge
                  variant={
                    review.status === "published" ? "secondary" : review.status === "pending" ? "outline" : "destructive"
                  }
                  className={review.status === "published" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20" : ""}
                >
                  {review.status === "published" ? "Đã duyệt" : review.status === "pending" ? "Chờ duyệt" : "Bị từ chối"}
                </Badge>
              </div>

              <div className="flex gap-1">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} className={`w-4 h-4 ${idx < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                ))}
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300">{review.comment}</p>
              
              {review.admin_response && (
                <div className="bg-muted/50 p-2 rounded text-xs border-l-2 border-primary">
                  <p className="font-semibold mb-1">Phản hồi của Admin:</p>
                  <p>{review.admin_response}</p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleString("vi-VN")}
              </p>

              <div className="flex flex-col gap-2">
                <Textarea
                  placeholder="Gửi phản hồi cho người dùng..."
                  className="text-xs min-h-[60px]"
                  onBlur={(e) => {
                    if (e.target.value) {
                      onRespond(String(review.id), e.target.value);
                    }
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {review.status === "pending" && (
                  <>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => onApprove(String(review.id))}>
                      Duyệt
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onReject(String(review.id), "Nội dung không phù hợp")}>
                      Từ chối
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(String(review.id))}>
                  <Trash className="w-4 h-4 mr-1" />
                  Xóa
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}


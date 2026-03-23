import { revalidateTag } from "next/cache"
import { query, normalizeUserId, hasDownloadCountColumn } from "@/lib/database"

type PurchaseRow = {
  id: string
  user_uid: string
  product_id: string
  product_title: string
  amount: number
  status: string
  created_at: string
  downloads: number
  rating: number
}

export async function getUserPurchases(
  uid: string,
  limit = 50,
  email?: string | null
): Promise<PurchaseRow[]> {
  if (!uid) return []

  const dbUserId = await normalizeUserId(uid, email || undefined)
  if (!dbUserId) return []

  const hasDownloadCount = await hasDownloadCountColumn();

  const rows = await query<PurchaseRow>(
    `SELECT p.id, p.user_id as user_uid, p.product_id, pr.title as product_title, p.amount, p.status, p.created_at,
            ${hasDownloadCount ? 'COALESCE(pr.download_count, 0)' : '0'} as downloads,
            COALESCE(rt.average_rating, 0) as rating
     FROM purchases p
     LEFT JOIN products pr ON p.product_id = pr.id
     LEFT JOIN product_ratings rt ON pr.id = rt.product_id
     WHERE p.user_id = $1 
     ORDER BY p.created_at DESC 
     LIMIT $2`,
    [dbUserId, limit],
  )

  return rows.map(row => ({
    ...row,
    user_uid: String(row.user_uid || row.id), // Ensure user_uid is string
    downloads: Number(row.downloads || 0),
    rating: Number(row.rating || 0)
  }))
}

export async function revalidateUserPurchases(uid: string) {
  if (!uid) return
  revalidateTag(`orders:user:${uid}`)
}


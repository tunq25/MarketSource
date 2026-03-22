import { revalidateTag } from "next/cache"
import { query, normalizeUserId } from "@/lib/database"

type PurchaseRow = {
  id: string
  user_uid: string
  product_id: string
  product_title: string
  amount: number
  status: string
  created_at: string
}

export async function getUserPurchases(
  uid: string,
  limit = 50,
  email?: string | null
): Promise<PurchaseRow[]> {
  if (!uid) return []

  const dbUserId = await normalizeUserId(uid, email || undefined)
  if (!dbUserId) return []

  const rows = await query<PurchaseRow>(
    `SELECT p.id, p.user_id as user_uid, p.product_id, pr.title as product_title, p.amount, p.status, p.created_at 
     FROM purchases p
     LEFT JOIN products pr ON p.product_id = pr.id
     WHERE p.user_id = $1 
     ORDER BY p.created_at DESC 
     LIMIT $2`,
    [dbUserId, limit],
  )

  return rows.map(row => ({
    ...row,
    user_uid: String(row.user_uid || row.id), // Ensure user_uid is string
  }))
}

export async function revalidateUserPurchases(uid: string) {
  if (!uid) return
  revalidateTag(`orders:user:${uid}`)
}


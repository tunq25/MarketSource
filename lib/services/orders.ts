import { revalidateTag } from "next/cache"
import { query } from "@/lib/database-mysql"

type PurchaseRow = {
  id: string
  user_uid: string
  product_id: string
  product_title: string
  amount: number
  status: string
  created_at: string
}

export async function getUserPurchases(uid: string, limit = 50): Promise<PurchaseRow[]> {
  if (!uid) return []

  const rows = await query<PurchaseRow>(
    `SELECT id, user_id as user_uid, product_id, product_title, amount, status, created_at
     FROM purchases
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [uid, limit],
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


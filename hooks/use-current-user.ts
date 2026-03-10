"use client"

import { useEffect, useState, useCallback } from "react"
import type { UserData } from "@/lib/userManager"
import { userManager } from "@/lib/userManager"

export function useCurrentUser() {
  const [user, setUser] = useState<UserData | null>(null)

  const fetchUser = useCallback(() => {
    userManager
      .getUser()
      .then(current => {
        setUser(current)
      })
      .catch(() => {
        setUser(null)
      })
  }, [])

  useEffect(() => {
    fetchUser()

    // ✅ FIX: Lắng nghe event 'userUpdated' để cập nhật reactive khi balance thay đổi
    const handleUserUpdated = () => {
      fetchUser()
    }

    window.addEventListener("userUpdated", handleUserUpdated)

    return () => {
      window.removeEventListener("userUpdated", handleUserUpdated)
    }
  }, [fetchUser])

  return user
}


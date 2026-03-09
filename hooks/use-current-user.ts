"use client"

import { useEffect, useState } from "react"
import type { UserData } from "@/lib/userManager"
import { userManager } from "@/lib/userManager"

export function useCurrentUser() {
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    let cancelled = false
    userManager
      .getUser()
      .then(current => {
        if (!cancelled) setUser(current)
      })
      .catch(() => {
        setUser(null)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return user
}


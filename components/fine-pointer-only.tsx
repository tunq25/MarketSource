"use client"

import { useEffect, useState, type ReactNode } from "react"

/** Chỉ render children khi thiết bị có con trỏ chính xác (bỏ qua điện thoại / tablet cảm ứng). */
export function FinePointerOnly({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(pointer: fine)")
    const update = () => setShow(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  if (!show) return null
  return <>{children}</>
}

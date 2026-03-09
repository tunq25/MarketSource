"use client"

import { useEffect } from "react"
import useSWRMutation from "swr/mutation"

export function useDashboardEvents(onMessage: (payload: any) => void) {
  const { trigger } = useSWRMutation("dashboard-events", async () => {
    const response = await fetch("/api/dashboard/orders")
    return response.json()
  })

  useEffect(() => {
    const source = new EventSource("/api/dashboard/events")
    source.onmessage = event => {
      if (!event?.data) return
      try {
        const payload = JSON.parse(event.data)
        onMessage(payload)
        trigger()
      } catch {
        // ignore
      }
    }
    return () => {
      source.close()
    }
  }, [onMessage, trigger])
}


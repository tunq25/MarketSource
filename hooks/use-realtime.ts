import { useEffect, useState } from 'react'
import { getDatabase } from 'firebase/database'
import { ref, onValue, off } from 'firebase/database'

export function useRealtimeData(path: string) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dataRef = ref(getDatabase(), path)
    
    const unsubscribe = onValue(dataRef, 
      (snapshot) => {
        setData(snapshot.val())
        setLoading(false)
      },
      (error) => {
        setError(error.message)
        setLoading(false)
      }
    )

    return () => off(dataRef, 'value', unsubscribe)
  }, [path])

  return { data, loading, error }
}

export function useRealtimeNotifications() {
  return useRealtimeData('notifications')
}

export function useRealtimeProducts() {
  return useRealtimeData('products')
}

export function useRealtimeUsers() {
  return useRealtimeData('users')
}

export function useTriggerUpdate() {
  const [updateTrigger, setUpdateTrigger] = useState(0)
  
  const triggerUpdate = () => {
    setUpdateTrigger(prev => prev + 1)
  }
  
  return { updateTrigger, triggerUpdate }
}

// Main hook that combines all realtime functionality
export function useRealtime() {
  const notifications = useRealtimeNotifications()
  const products = useRealtimeProducts()
  const users = useRealtimeUsers()
  const { updateTrigger, triggerUpdate } = useTriggerUpdate()
  
  return {
    notifications,
    products,
    users,
    updateTrigger,
    triggerUpdate
  }
}

"use client"

export const runtime = 'nodejs'

import { logger } from "@/lib/logger-client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { userManager } from '@/lib/userManager'

interface SyncStatus {
  uid: string
  email: string | null
  firestore: boolean
  localStorage: boolean
  synced: boolean
  differences: string[]
}

export default function SyncCheckPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([])
  const [overallStatus, setOverallStatus] = useState<{
    total: number
    synced: number
    desynced: number
  } | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const allUsers = await userManager.getAllUsers()
      setUsers(allUsers)
    } catch (error) {
      logger.error('Error loading users', error)
    }
  }

  const checkSync = async () => {
    setIsLoading(true)
    const statuses: SyncStatus[] = []

    try {
      for (const user of users) {
        const status: SyncStatus = {
          uid: user.uid,
          email: user.email,
          firestore: false,
          localStorage: false,
          synced: true,
          differences: []
        }

        // Check localStorage
        const localUser = JSON.parse(localStorage.getItem('qtusdev_user') || 'null')
        const usersArr = JSON.parse(localStorage.getItem('users') || '[]')
        const userFromArr = usersArr.find((u: any) => u.uid === user.uid)
        
        if (localUser?.uid === user.uid || userFromArr) {
          status.localStorage = true
        }

        // Check Firestore (nếu có)
        try {
          const fsUser = await userManager.getUserData(user.uid)
          if (fsUser) {
            status.firestore = true
            
            // Compare data
            const localData = localUser || userFromArr || user
            if (localData) {
              if (localData.balance !== fsUser.balance) {
                status.synced = false
                status.differences.push(`Balance: ${localData.balance} vs ${fsUser.balance}`)
              }
              if (localData.lastActivity !== fsUser.lastActivity) {
                status.synced = false
                status.differences.push(`LastActivity mismatch`)
              }
              if (localData.loginCount !== fsUser.loginCount) {
                status.synced = false
                status.differences.push(`LoginCount: ${localData.loginCount} vs ${fsUser.loginCount}`)
              }
            }
          }
        } catch (error) {
          logger.warn('Firestore check failed', { uid: user.uid, error })
        }

        statuses.push(status)
      }

      setSyncStatuses(statuses)
      
      const synced = statuses.filter(s => s.synced).length
      const desynced = statuses.length - synced
      setOverallStatus({
        total: statuses.length,
        synced,
        desynced
      })
    } catch (error) {
      logger.error('Error checking sync', error)
    } finally {
      setIsLoading(false)
    }
  }

  const forceSyncUser = async (uid: string) => {
    try {
      const userData = await userManager.getUserData(uid)
      if (userData) {
        await userManager.setUser(userData)
        alert('Đồng bộ thành công!')
        checkSync() // Re-check
      }
    } catch (error) {
      logger.error('Force sync failed', error)
      alert('Lỗi khi đồng bộ')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>Kiểm tra đồng bộ dữ liệu</div>
            <Button onClick={checkSync} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Kiểm tra lại
            </Button>
          </CardTitle>
          <CardDescription>
            Kiểm tra tính nhất quán dữ liệu giữa Firestore và localStorage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overallStatus && (
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold">{overallStatus.total}</p>
                <p className="text-sm text-muted-foreground">Tổng số users</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{overallStatus.synced}</p>
                <p className="text-sm text-muted-foreground">Đã đồng bộ</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{overallStatus.desynced}</p>
                <p className="text-sm text-muted-foreground">Lệch đồng bộ</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {syncStatuses.map((status) => (
              <div key={status.uid} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold">{status.email || status.uid}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {status.localStorage && (
                        <Badge variant="outline" className="text-xs">
                          localStorage
                        </Badge>
                      )}
                      {status.firestore && (
                        <Badge variant="outline" className="text-xs">
                          Firestore
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {status.synced ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Đồng bộ
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Lệch đồng bộ
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => forceSyncUser(status.uid)}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Đồng bộ
                    </Button>
                  </div>
                </div>
                {status.differences.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">
                      Khác biệt:
                    </p>
                    <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      {status.differences.map((diff, idx) => (
                        <li key={idx}>• {diff}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {syncStatuses.length === 0 && !isLoading && (
            <p className="text-center text-muted-foreground py-8">
              Nhấn "Kiểm tra lại" để bắt đầu kiểm tra
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


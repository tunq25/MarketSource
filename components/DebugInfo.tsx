"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Database, Users, ShoppingBag, TrendingUp, CreditCard } from 'lucide-react'

export function DebugInfo() {
  const [debugData, setDebugData] = useState<any>(null)

  const loadDebugData = () => {
    const data = {
      // User data
      currentUser: JSON.parse(localStorage.getItem('currentUser') || 'null'),
      qtusdevUser: JSON.parse(localStorage.getItem('qtusdev_user') || 'null'),
      isLoggedIn: localStorage.getItem('isLoggedIn'),
      
      // Users data
      users: JSON.parse(localStorage.getItem('users') || '[]'),
      registeredUsers: JSON.parse(localStorage.getItem('registeredUsers') || '[]'),
      socialUsers: JSON.parse(localStorage.getItem('socialUsers') || '[]'),
      
      // Purchases
      userPurchases: JSON.parse(localStorage.getItem('userPurchases') || '[]'),
      
      // Deposits
      approvedDeposits: JSON.parse(localStorage.getItem('approvedDeposits') || '[]'),
      deposits: JSON.parse(localStorage.getItem('deposits') || '[]'),
      
      // Withdrawals
      approvedWithdrawals: JSON.parse(localStorage.getItem('approvedWithdrawals') || '[]'),
      withdrawals: JSON.parse(localStorage.getItem('withdrawals') || '[]'),
    }
    
    setDebugData(data)
  }

  useEffect(() => {
    loadDebugData()
  }, [])

  const createTestData = () => {
    // ✅ FIX: Không dùng eval() - tạo data trực tiếp
    const sampleDeposits = [
      {
        id: 'dep_1',
        userId: 'user_123',
        userEmail: 'test@example.com',
        amount: 100000,
        method: 'Bank Transfer',
        transactionId: 'TXN001',
        status: 'approved',
        approvedTime: new Date().toISOString(),
        timestamp: new Date().toISOString()
      }
    ];
    
    const sampleWithdrawals = [
      {
        id: 'with_1',
        userId: 'user_123',
        userEmail: 'test@example.com',
        amount: 75000,
        bankName: 'Vietcombank',
        accountNumber: '1234567890',
        accountName: 'Test User',
        status: 'approved',
        approvedTime: new Date().toISOString(),
        timestamp: new Date().toISOString()
      }
    ];
    
    const samplePurchases = [
      {
        id: 'purchase_1',
        userId: 'user_123',
        userEmail: 'test@example.com',
        title: 'Premium Template',
        description: 'A beautiful premium template',
        price: 25000,
        category: 'Templates',
        image: '/placeholder.svg',
        downloadLink: 'https://example.com/download',
        demoLink: 'https://example.com/demo',
        purchaseDate: new Date().toISOString(),
        rating: 4,
        reviewCount: 1,
        downloads: 3,
        review: 'Great template!'
      }
    ];
    
    localStorage.setItem('approvedDeposits', JSON.stringify(sampleDeposits));
    localStorage.setItem('approvedWithdrawals', JSON.stringify(sampleWithdrawals));
    localStorage.setItem('userPurchases', JSON.stringify(samplePurchases));
    
    console.log('✅ Test data created!');
    loadDebugData();
  }

  if (!debugData) return null

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Debug Information
          </div>
          <div className="flex space-x-2">
            <Button size="sm" onClick={loadDebugData}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button size="sm" onClick={createTestData} variant="outline">
              Create Test Data
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">Current User:</span>
            <Badge variant={debugData.currentUser ? "default" : "destructive"}>
              {debugData.currentUser ? "Logged In" : "Not Logged In"}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm">Is Logged In:</span>
            <Badge variant={debugData.isLoggedIn === 'true' ? "default" : "destructive"}>
              {debugData.isLoggedIn}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm">User Email:</span>
            <span className="text-sm font-medium">
              {debugData.currentUser?.email || 'N/A'}
            </span>
          </div>
        </div>

        {/* Data Counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <ShoppingBag className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold text-blue-600">{debugData.userPurchases.length}</p>
            <p className="text-xs text-muted-foreground">Purchases</p>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-green-600">{debugData.approvedDeposits.length + debugData.deposits.length}</p>
            <p className="text-xs text-muted-foreground">Deposits</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <CreditCard className="w-6 h-6 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold text-red-600">{debugData.approvedWithdrawals.length + debugData.withdrawals.length}</p>
            <p className="text-xs text-muted-foreground">Withdrawals</p>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Users className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold text-purple-600">{debugData.users.length + debugData.registeredUsers.length + debugData.socialUsers.length}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </div>
        </div>

        {/* Raw Data */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium">Raw Data (Click to expand)</summary>
          <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs overflow-auto max-h-96">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  )
}

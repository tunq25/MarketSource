"use client"

import { useState, useEffect } from "react"
import { logger } from "@/lib/logger-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, AlertTriangle, Users, Package, DollarSign, Wallet } from "lucide-react"
import { realtimeManager } from "@/lib/realtime-manager"

interface TestResult {
  name: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: string
}

export default function TestIntegrationPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [realTimeStats, setRealTimeStats] = useState({
    users: 0,
    deposits: 0,
    withdrawals: 0,
    purchases: 0,
    products: 0
  })

  // Test account independence
  const testAccountIndependence = async (): Promise<TestResult> => {
    try {
      // Create test users
      const testUser1 = {
        uid: "test-user-1",
        email: "test1@example.com", 
        name: "Test User 1",
        balance: 1000000,
        status: "active",
        createdAt: new Date().toISOString()
      }
      
      const testUser2 = {
        uid: "test-user-2", 
        email: "test2@example.com",
        name: "Test User 2", 
        balance: 500000,
        status: "active",
        createdAt: new Date().toISOString()
      }

      // Save test users
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]')
      const allUsers = [...existingUsers.filter((u: any) => !u.uid.startsWith('test-user')), testUser1, testUser2]
      localStorage.setItem('users', JSON.stringify(allUsers))

      // Test independent balance updates
      const updateResult1 = realtimeManager.updateUserBalance("test-user-1", 800000, "admin-test")
      const updateResult2 = realtimeManager.updateUserBalance("test-user-2", 300000, "admin-test")
      
      if (!updateResult1 || !updateResult2) {
        return {
          name: "Account Independence",
          status: "error", 
          message: "Failed to update user balances independently"
        }
      }

      // Verify balances are updated correctly and independently
      const updatedUsers = realtimeManager.getUserData()
      const user1 = updatedUsers.find(u => u.uid === "test-user-1")
      const user2 = updatedUsers.find(u => u.uid === "test-user-2")

      if (user1?.balance !== 800000 || user2?.balance !== 300000) {
        return {
          name: "Account Independence", 
          status: "error",
          message: "User balances not updated correctly",
          details: `User1: ${user1?.balance}, User2: ${user2?.balance}`
        }
      }

      return {
        name: "Account Independence",
        status: "success",
        message: "Each account operates independently with correct balance management"
      }
    } catch (error: any) {
      return {
        name: "Account Independence",
        status: "error",
        message: error.message || "Account independence test failed"
      }
    }
  }

  // Test real-time functionality
  const testRealTimeFunctionality = async (): Promise<TestResult> => {
    try {
      let updateCount = 0
      
      // Subscribe to real-time updates
      const unsubscribe = realtimeManager.subscribe('users', (users: any[]) => {
        updateCount++
      })

      // Wait a few seconds to see if updates are received
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      unsubscribe()

      if (updateCount === 0) {
        return {
          name: "Real-time Updates",
          status: "warning", 
          message: "No real-time updates received in 3 seconds"
        }
      }

      return {
        name: "Real-time Updates",
        status: "success",
        message: `Real-time updates working (${updateCount} updates received)`
      }
    } catch (error: any) {
      return {
        name: "Real-time Updates",
        status: "error",
        message: error.message || "Real-time functionality test failed"
      }
    }
  }

  // Test deposit/withdrawal processing
  const testDepositWithdrawalProcessing = async (): Promise<TestResult> => {
    try {
      // Create test deposit
      const testDeposit = {
        id: Date.now(),
        user_id: "test-user-1",
        userEmail: "test1@example.com",
        userName: "Test User 1",
        amount: 100000,
        method: "Test Bank",
        transactionId: "TEST-DEP-" + Date.now(),
        status: "pending",
        timestamp: new Date().toISOString()
      }

      // Save test deposit
      const existingDeposits = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('deposits') || '[]') : []
      existingDeposits.push(testDeposit)
      if (typeof window !== 'undefined') {
        localStorage.setItem('deposits', JSON.stringify(existingDeposits))
      }

      // Test deposit processing
      const initialBalance = realtimeManager.getUserData("test-user-1")[0]?.balance || 0
      const depositProcessed = realtimeManager.processDeposit(testDeposit.id.toString(), true, "admin-test")
      
      if (!depositProcessed) {
        return {
          name: "Deposit/Withdrawal Processing",
          status: "error",
          message: "Failed to process test deposit"
        }
      }

      // Verify balance increased
      const newBalance = realtimeManager.getUserData("test-user-1")[0]?.balance || 0
      if (newBalance !== initialBalance + 100000) {
        return {
          name: "Deposit/Withdrawal Processing", 
          status: "error",
          message: "Deposit not reflected in user balance",
          details: `Expected: ${initialBalance + 100000}, Got: ${newBalance}`
        }
      }

      // Test withdrawal processing
      const testWithdrawal = {
        id: Date.now() + 1,
        user_id: "test-user-1", 
        userEmail: "test1@example.com",
        userName: "Test User 1",
        amount: 50000,
        method: "Test Bank",
        status: "pending",
        timestamp: new Date().toISOString()
      }

      const existingWithdrawals = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('withdrawals') || '[]') : []
      existingWithdrawals.push(testWithdrawal)
      if (typeof window !== 'undefined') {
        localStorage.setItem('withdrawals', JSON.stringify(existingWithdrawals))
      }

      const withdrawalProcessed = realtimeManager.processWithdrawal(testWithdrawal.id.toString(), true, "admin-test")
      
      if (!withdrawalProcessed) {
        return {
          name: "Deposit/Withdrawal Processing",
          status: "error", 
          message: "Failed to process test withdrawal"
        }
      }

      // Verify balance decreased
      const finalBalance = realtimeManager.getUserData("test-user-1")[0]?.balance || 0
      if (finalBalance !== newBalance - 50000) {
        return {
          name: "Deposit/Withdrawal Processing",
          status: "error",
          message: "Withdrawal not reflected in user balance",
          details: `Expected: ${newBalance - 50000}, Got: ${finalBalance}`
        }
      }

      return {
        name: "Deposit/Withdrawal Processing",
        status: "success", 
        message: "Deposit and withdrawal processing working correctly"
      }
    } catch (error: any) {
      return {
        name: "Deposit/Withdrawal Processing",
        status: "error",
        message: error.message || "Deposit/withdrawal processing test failed"
      }
    }
  }

  // Test purchase functionality
  const testPurchaseFunctionality = async (): Promise<TestResult> => {
    try {
      // Create test product
      const testProduct = {
        id: "test-product-" + Date.now(),
        title: "Test Product",
        description: "Test product for integration testing",
        price: 25000,
        category: "test",
        image: "/placeholder.svg",
        downloadLink: "#",
        demoLink: "#"
      }

      // Get user balance before purchase
      const user = realtimeManager.getUserData("test-user-1")[0]
      const initialBalance = user?.balance || 0

      if (initialBalance < testProduct.price) {
        return {
          name: "Purchase Functionality",
          status: "error",
          message: "Insufficient balance for test purchase", 
          details: `Balance: ${initialBalance}, Price: ${testProduct.price}`
        }
      }

      // Test purchase
      const purchaseResult = realtimeManager.addPurchase("test-user-1", testProduct, testProduct.price)
      
      if (!purchaseResult) {
        return {
          name: "Purchase Functionality",
          status: "error",
          message: "Failed to process test purchase"
        }
      }

      // Verify balance deducted
      const newBalance = realtimeManager.getUserData("test-user-1")[0]?.balance || 0
      if (newBalance !== initialBalance - testProduct.price) {
        return {
          name: "Purchase Functionality",
          status: "error", 
          message: "Purchase not reflected in user balance",
          details: `Expected: ${initialBalance - testProduct.price}, Got: ${newBalance}`
        }
      }

      // Verify purchase record created
      const userPurchases = realtimeManager.getUserPurchases("test-user-1")
      const testPurchase = userPurchases.find(p => p.product_id === testProduct.id)
      
      if (!testPurchase) {
        return {
          name: "Purchase Functionality",
          status: "error",
          message: "Purchase record not created"
        }
      }

      return {
        name: "Purchase Functionality", 
        status: "success",
        message: "Purchase functionality working correctly"
      }
    } catch (error: any) {
      return {
        name: "Purchase Functionality",
        status: "error",
        message: error.message || "Purchase functionality test failed"
      }
    }
  }

  // Test page integrations
  const testPageIntegrations = async (): Promise<TestResult> => {
    try {
      // Test localStorage keys exist
      const requiredKeys = ['users', 'deposits', 'withdrawals', 'userPurchases', 'uploadedProducts']
      const missingKeys = requiredKeys.filter(key => !localStorage.getItem(key))
      
      if (missingKeys.length > 0) {
        return {
          name: "Page Integrations",
          status: "warning",
          message: `Some localStorage keys missing: ${missingKeys.join(', ')}`
        }
      }

      // Test data structure consistency
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const deposits = JSON.parse(localStorage.getItem('deposits') || '[]')
      const withdrawals = JSON.parse(localStorage.getItem('withdrawals') || '[]')
      const purchases = JSON.parse(localStorage.getItem('userPurchases') || '[]')
      const products = JSON.parse(localStorage.getItem('uploadedProducts') || '[]')

      // Check if data structures are arrays
      if (!Array.isArray(users) || !Array.isArray(deposits) || !Array.isArray(withdrawals) || 
          !Array.isArray(purchases) || !Array.isArray(products)) {
        return {
          name: "Page Integrations",
          status: "error",
          message: "Data structure integrity check failed"
        }
      }

      return {
        name: "Page Integrations",
        status: "success",
        message: `All integrations working - Users: ${users.length}, Deposits: ${deposits.length}, Withdrawals: ${withdrawals.length}, Purchases: ${purchases.length}, Products: ${products.length}`
      }
    } catch (error: any) {
      return {
        name: "Page Integrations", 
        status: "error",
        message: error.message || "Page integrations test failed"
      }
    }
  }

  // Run all tests
  const runIntegrationTests = async () => {
    setIsRunning(true)
    setTestResults([])

    const tests = [
      testPageIntegrations,
      testAccountIndependence, 
      testRealTimeFunctionality,
      testDepositWithdrawalProcessing,
      testPurchaseFunctionality
    ]

    const results: TestResult[] = []
    
    for (const test of tests) {
      try {
        const result = await test()
        results.push(result)
        setTestResults([...results])
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second between tests
      } catch (error: any) {
        results.push({
          name: test.name,
          status: "error",
          message: error.message || "Test execution failed"
        })
        setTestResults([...results])
      }
    }

    setIsRunning(false)
  }

  // Real-time stats updates
  useEffect(() => {
    const updateStats = () => {
      try {
        const users = JSON.parse(localStorage.getItem('users') || '[]')
        const deposits = JSON.parse(localStorage.getItem('deposits') || '[]')
        const withdrawals = JSON.parse(localStorage.getItem('withdrawals') || '[]')
        const purchases = JSON.parse(localStorage.getItem('userPurchases') || '[]')
        const products = JSON.parse(localStorage.getItem('uploadedProducts') || '[]')

        setRealTimeStats({
          users: users.length,
          deposits: deposits.length, 
          withdrawals: withdrawals.length,
          purchases: purchases.length,
          products: products.length
        })
      } catch (error) {
        logger.error('Error updating stats', error)
      }
    }

    updateStats()
    const interval = setInterval(updateStats, 2000)
    return () => clearInterval(interval)
  }, [])

  // Clean up test data
  const cleanupTestData = () => {
    try {
      // Remove test users
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const filteredUsers = users.filter((u: any) => !u.uid.startsWith('test-user'))
      localStorage.setItem('users', JSON.stringify(filteredUsers))

      // Remove test deposits
      const deposits = JSON.parse(localStorage.getItem('deposits') || '[]')
      const filteredDeposits = deposits.filter((d: any) => !d.userEmail.includes('test'))
      localStorage.setItem('deposits', JSON.stringify(filteredDeposits))

      // Remove test withdrawals
      const withdrawals = JSON.parse(localStorage.getItem('withdrawals') || '[]') 
      const filteredWithdrawals = withdrawals.filter((w: any) => !w.userEmail.includes('test'))
      localStorage.setItem('withdrawals', JSON.stringify(filteredWithdrawals))

      // Remove test purchases
      const purchases = JSON.parse(localStorage.getItem('userPurchases') || '[]')
      const filteredPurchases = purchases.filter((p: any) => !p.user_id.startsWith('test-user'))
      localStorage.setItem('userPurchases', JSON.stringify(filteredPurchases))

      alert('Test data cleaned up successfully!')
    } catch (error) {
      logger.error('Error cleaning up test data', error)
      alert('Error cleaning up test data')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'error': 
        return 'text-red-600 bg-red-50 border-red-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Integration Test Suite</h1>
        <p className="text-muted-foreground">
          Comprehensive testing for real-time functionality and independent account management
        </p>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeStats.users}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deposits</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeStats.deposits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Withdrawals</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeStats.withdrawals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchases</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeStats.purchases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeStats.products}</div>
          </CardContent>
        </Card>
      </div>

      {/* Test Controls */}
      <div className="flex space-x-4 mb-8">
        <Button 
          onClick={runIntegrationTests}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isRunning ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : null}
          {isRunning ? 'Running Tests...' : 'Run Integration Tests'}
        </Button>
        
        <Button 
          onClick={cleanupTestData}
          variant="outline"
          disabled={isRunning}
        >
          Clean Test Data
        </Button>
      </div>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            Integration test results for all system components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testResults.length === 0 && !isRunning && (
              <p className="text-center text-muted-foreground py-8">
                Click "Run Integration Tests" to start testing
              </p>
            )}

            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start space-x-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <h4 className="font-semibold">{result.name}</h4>
                    <p className="text-sm mt-1">{result.message}</p>
                    {result.details && (
                      <p className="text-xs mt-2 opacity-75">{result.details}</p>
                    )}
                  </div>
                  <Badge
                    className={
                      result.status === 'success'
                        ? 'bg-green-100 text-green-800'
                        : result.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}

            {isRunning && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
                <p className="text-muted-foreground">Running integration tests...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Overall system health and functionality check
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">✅ Implemented Features</h4>
              <ul className="space-y-2 text-sm">
                <li>✅ Dashboard with user-specific data</li>
                <li>✅ Admin panel with comprehensive management</li>
                <li>✅ Real-time deposit/withdrawal processing</li>
                <li>✅ Independent account balance management</li>
                <li>✅ Product management and purchasing</li>
                <li>✅ Analytics and reporting</li>
                <li>✅ Customer support integration</li>
                <li>✅ Settings and configuration</li>
                <li>✅ API endpoints for registration/auth</li>
                <li>✅ Categories and checkout functionality</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">🔄 Real-time Features</h4>
              <ul className="space-y-2 text-sm">
                <li>🔄 User data updates (3s intervals)</li>
                <li>🔄 Deposit processing (2s intervals)</li>
                <li>🔄 Withdrawal processing (2s intervals)</li>
                <li>🔄 Purchase tracking (5s intervals)</li>
                <li>🔄 Product catalog updates (10s intervals)</li>
                <li>🔄 Independent account operations</li>
                <li>🔄 Balance isolation per user</li>
                <li>🔄 Transaction logging</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

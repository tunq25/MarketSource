"use client"

import { logger } from './logger-client'

// Real-time data manager for independent account operations
export class RealtimeManager {
  private static instance: RealtimeManager
  private listeners: Map<string, Set<Function>> = new Map()
  private intervals: Map<string, any> = new Map()

  private constructor() {
    this.initializeRealtimeUpdates()
  }

  public static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager()
    }
    return RealtimeManager.instance
  }

  // Initialize real-time updates for all data types
  private initializeRealtimeUpdates() {
    // Update user data every 3 seconds
    this.startInterval('users', 3000, () => {
      this.notifyListeners('users', this.getAllUsers())
    })

    // Update deposits every 2 seconds
    this.startInterval('deposits', 2000, () => {
      this.notifyListeners('deposits', this.getAllDeposits())
    })

    // Update withdrawals every 2 seconds
    this.startInterval('withdrawals', 2000, () => {
      this.notifyListeners('withdrawals', this.getAllWithdrawals())
    })

    // Update purchases every 5 seconds
    this.startInterval('purchases', 5000, () => {
      this.notifyListeners('purchases', this.getAllPurchases())
    })

    // Update products every 10 seconds
    this.startInterval('products', 10000, () => {
      this.notifyListeners('products', this.getAllProducts())
    })
  }

  private startInterval(key: string, ms: number, callback: Function) {
    if (this.intervals.has(key)) {
      clearInterval(this.intervals.get(key)!)
    }
    const interval = setInterval(callback, ms)
    this.intervals.set(key, interval)
  }

  // Subscribe to real-time updates
  public subscribe(dataType: string, callback: Function): () => void {
    if (!this.listeners.has(dataType)) {
      this.listeners.set(dataType, new Set())
    }
    this.listeners.get(dataType)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.listeners.get(dataType)?.delete(callback)
    }
  }

  private notifyListeners(dataType: string, data: any) {
    const listeners = this.listeners.get(dataType)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }

  // Independent account management methods
  public getUserData(userId?: string): any[] {
    if (typeof window === 'undefined') return []
    try {
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]')
      if (userId) {
        return allUsers.filter((user: any) => user.uid === userId)
      }
      return allUsers
    } catch (error) {
      logger.error('Error getting user data:', error)
      return []
    }
  }

  public updateUserBalance(userId: string, newBalance: number, adminId: string): boolean {
    if (typeof window === 'undefined') return false
    try {
      const allUsers = this.getUserData()
      const userIndex = allUsers.findIndex((user: any) => user.uid === userId)
      
      if (userIndex === -1) return false

      // Update only the specific user's balance - independent operation
      allUsers[userIndex] = {
        ...allUsers[userIndex],
        balance: newBalance,
        lastBalanceUpdate: new Date().toISOString(),
        balanceUpdatedBy: adminId,
        previousBalance: allUsers[userIndex].balance || 0
      }

      localStorage.setItem('users', JSON.stringify(allUsers))
      
      // Update current user in localStorage if it's the same user
      const currentUser = localStorage.getItem('currentUser')
      if (currentUser) {
        const parsed = JSON.parse(currentUser)
        if (parsed.uid === userId) {
          localStorage.setItem('currentUser', JSON.stringify(allUsers[userIndex]))
          window.dispatchEvent(new CustomEvent('userUpdated'))
        }
      }

      this.notifyListeners('users', allUsers)
      return true
    } catch (error) {
      logger.error('Error updating user balance:', error)
      return false
    }
  }

  public processDeposit(depositId: string, approved: boolean, adminId: string): boolean {
    if (typeof window === 'undefined') return false
    try {
      const allDeposits = this.getAllDeposits()
      const depositIndex = allDeposits.findIndex((d: any) => d.id.toString() === depositId)
      
      if (depositIndex === -1) return false

      const deposit = allDeposits[depositIndex]
      
      if (approved) {
        // Find and update user balance independently
        const allUsers = this.getUserData()
        const userIndex = allUsers.findIndex((u: any) => 
          u.uid === deposit.user_id || u.email === deposit.userEmail
        )
        
        if (userIndex !== -1) {
          // Independent balance update - only affects this user
          allUsers[userIndex].balance = (allUsers[userIndex].balance || 0) + deposit.amount
          allUsers[userIndex].lastActivity = new Date().toISOString()
          
          localStorage.setItem('users', JSON.stringify(allUsers))
          this.notifyListeners('users', allUsers)
        }
      }

      // Update deposit status
      allDeposits[depositIndex] = {
        ...deposit,
        status: approved ? 'approved' : 'rejected',
        processedTime: new Date().toISOString(),
        processedBy: adminId
      }

      localStorage.setItem('deposits', JSON.stringify(allDeposits))
      this.notifyListeners('deposits', allDeposits)
      
      return true
    } catch (error) {
      logger.error('Error processing deposit:', error)
      return false
    }
  }

  public processWithdrawal(withdrawalId: string, approved: boolean, adminId: string): boolean {
    if (typeof window === 'undefined') return false
    try {
      const allWithdrawals = this.getAllWithdrawals()
      const withdrawalIndex = allWithdrawals.findIndex((w: any) => w.id.toString() === withdrawalId)
      
      if (withdrawalIndex === -1) return false

      const withdrawal = allWithdrawals[withdrawalIndex]
      
      if (approved) {
        // Find and update user balance independently
        const allUsers = this.getUserData()
        const userIndex = allUsers.findIndex((u: any) => 
          u.uid === withdrawal.user_id || u.email === withdrawal.userEmail
        )
        
        if (userIndex !== -1) {
          const user = allUsers[userIndex]
          
          // Check balance for this specific user only
          if ((user.balance || 0) >= withdrawal.amount) {
            // Independent balance update - only affects this user
            allUsers[userIndex].balance = (user.balance || 0) - withdrawal.amount
            allUsers[userIndex].lastActivity = new Date().toISOString()
            
            localStorage.setItem('users', JSON.stringify(allUsers))
            this.notifyListeners('users', allUsers)
          } else {
            return false // Insufficient balance for this specific user
          }
        }
      }

      // Update withdrawal status
      allWithdrawals[withdrawalIndex] = {
        ...withdrawal,
        status: approved ? 'approved' : 'rejected',
        processedTime: new Date().toISOString(),
        processedBy: adminId
      }

      localStorage.setItem('withdrawals', JSON.stringify(allWithdrawals))
      this.notifyListeners('withdrawals', allWithdrawals)
      
      return true
    } catch (error) {
      logger.error('Error processing withdrawal:', error)
      return false
    }
  }

  private getAllUsers(): any[] {
    return this.getUserData()
  }

  private getAllDeposits(): any[] {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem('deposits') || '[]')
    } catch (error) {
      logger.error('Error getting deposits:', error)
      return []
    }
  }

  private getAllWithdrawals(): any[] {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem('withdrawals') || '[]')
    } catch (error) {
      logger.error('Error getting withdrawals:', error)
      return []
    }
  }

  private getAllPurchases(): any[] {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem('userPurchases') || '[]')
    } catch (error) {
      logger.error('Error getting purchases:', error)
      return []
    }
  }

  private getAllProducts(): any[] {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem('uploadedProducts') || '[]')
    } catch (error) {
      logger.error('Error getting products:', error)
      return []
    }
  }

  // Add purchase with independent user balance management
  public addPurchase(userId: string, product: any, amount: number): boolean {
    if (typeof window === 'undefined') return false
    try {
      const allUsers = this.getUserData()
      const userIndex = allUsers.findIndex((u: any) => u.uid === userId)
      
      if (userIndex === -1) return false

      const user = allUsers[userIndex]
      
      // Check if this specific user has enough balance
      if ((user.balance || 0) < amount) {
        return false
      }

      // Deduct balance from this user only - independent operation
      allUsers[userIndex].balance = (user.balance || 0) - amount
      allUsers[userIndex].lastActivity = new Date().toISOString()
      
      localStorage.setItem('users', JSON.stringify(allUsers))

      // Add purchase record
      const allPurchases = this.getAllPurchases()
      const purchase = {
        id: Date.now().toString(),
        user_id: userId,
        product_id: product.id,
        amount: amount,
        title: product.title,
        description: product.description,
        image: product.image,
        downloadLink: product.downloadLink,
        demoLink: product.demoLink,
        category: product.category,
        timestamp: new Date().toISOString(),
        purchaseDate: new Date().toISOString()
      }

      allPurchases.push(purchase)
      localStorage.setItem('userPurchases', JSON.stringify(allPurchases))

      // Update product download count
      const allProducts = this.getAllProducts()
      const productIndex = allProducts.findIndex((p: any) => p.id === product.id)
      if (productIndex !== -1) {
        allProducts[productIndex].downloads = (allProducts[productIndex].downloads || 0) + 1
        localStorage.setItem('uploadedProducts', JSON.stringify(allProducts))
        this.notifyListeners('products', allProducts)
      }

      // Notify all listeners
      this.notifyListeners('users', allUsers)
      this.notifyListeners('purchases', allPurchases)
      
      // Update current user data if it's the same user
      const currentUser = localStorage.getItem('currentUser')
      if (currentUser) {
        const parsed = JSON.parse(currentUser)
        if (parsed.uid === userId) {
          localStorage.setItem('currentUser', JSON.stringify(allUsers[userIndex]))
          window.dispatchEvent(new CustomEvent('userUpdated'))
        }
      }

      return true
    } catch (error) {
      logger.error('Error adding purchase:', error)
      return false
    }
  }

  // Get user-specific data
  public getUserPurchases(userId: string): any[] {
    try {
      const allPurchases = this.getAllPurchases()
      return allPurchases.filter((p: any) => p.user_id === userId)
    } catch (error) {
      logger.error('Error getting user purchases:', error)
      return []
    }
  }

  public getUserDeposits(userEmail: string): any[] {
    try {
      const allDeposits = this.getAllDeposits()
      return allDeposits.filter((d: any) => d.userEmail === userEmail)
    } catch (error) {
      logger.error('Error getting user deposits:', error)
      return []
    }
  }

  public getUserWithdrawals(userEmail: string): any[] {
    try {
      const allWithdrawals = this.getAllWithdrawals()
      return allWithdrawals.filter((w: any) => w.userEmail === userEmail)
    } catch (error) {
      logger.error('Error getting user withdrawals:', error)
      return []
    }
  }

  // Clean up intervals when needed
  public destroy() {
    this.intervals.forEach((interval) => {
      clearInterval(interval)
    })
    this.intervals.clear()
    this.listeners.clear()
  }
}

// Export singleton instance
export const realtimeManager = RealtimeManager.getInstance()

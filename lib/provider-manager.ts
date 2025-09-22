import { ethers } from 'ethers'
import { getRPCUrl } from './constants'

// Fallback RPC endpoints when Infura is rate limited
const FALLBACK_RPCS = {
  ethereum: [
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
    'https://1rpc.io/eth',
    'https://ethereum.publicnode.com'
  ],
  arbitrum: [
    'https://arb1.arbitrum.io/rpc',
    'https://rpc.ankr.com/arbitrum',
    'https://1rpc.io/arb',
    'https://arbitrum-one.publicnode.com'
  ]
}

// Singleton provider manager to prevent multiple connections
class ProviderManager {
  private static instance: ProviderManager
  private providers: Map<string, ethers.JsonRpcProvider> = new Map()
  private fallbackProviders: Map<string, ethers.JsonRpcProvider[]> = new Map()
  private lastRequestTime: Map<string, number> = new Map()
  private requestQueue: Map<string, Function[]> = new Map()
  private requestCounts: Map<string, number> = new Map()
  private readonly MIN_REQUEST_INTERVAL = 500 // Increased to 500ms between requests
  private readonly MAX_REQUESTS_PER_SECOND = 2 // Max 2 requests per second per provider
  private readonly QUEUE_INTERVAL = 500 // Process queue every 500ms (2 requests/second)
  private votingPowerCache: Map<string, { value: any; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map()
  private readonly DEBOUNCE_DELAY = 500 // 500ms debounce delay
  
  private constructor() {}
  
  public static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager()
    }
    return ProviderManager.instance
  }
  
  public getProvider(network: 'ethereum' | 'arbitrum' | null): ethers.JsonRpcProvider {
    const key = network || 'ethereum'
    
    // Return existing provider if available
    if (this.providers.has(key)) {
      return this.providers.get(key)!
    }
    
    // Create new provider
    const rpcUrl = getRPCUrl(network)
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    
    // Add request interceptor for rate limiting
    const originalSend = provider.send.bind(provider)
    provider.send = async (method: string, params: any[]): Promise<any> => {
      const now = Date.now()
      const lastTime = this.lastRequestTime.get(key) || 0
      const timeSinceLastRequest = now - lastTime
      
      // If too soon since last request, add delay
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => 
          setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
        )
      }
      
      this.lastRequestTime.set(key, Date.now())
      
      try {
        return await originalSend(method, params)
      } catch (error: any) {
        // If rate limited, add exponential backoff
        if (error?.code === -32005 || error?.message?.includes('Too Many Requests')) {
          const backoffTime = Math.min(1000 * Math.pow(2, Math.floor(Math.random() * 4)), 8000)
          console.warn(`Rate limited on ${key}, backing off for ${backoffTime}ms`)
          await new Promise(resolve => setTimeout(resolve, backoffTime))
          return await originalSend(method, params)
        }
        throw error
      }
    }
    
    this.providers.set(key, provider)
    return provider
  }
  
  // Batch multiple contract calls into a single multicall when possible
  public async batchCall<T>(
    network: 'ethereum' | 'arbitrum' | null,
    calls: (() => Promise<T>)[]
  ): Promise<T[]> {
    // Add small delay between batches to prevent overwhelming the RPC
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100))
    
    // Execute calls with Promise.allSettled to handle partial failures
    const results = await Promise.allSettled(calls.map(call => call()))
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        console.error(`Batch call ${index} failed:`, result.reason)
        throw result.reason
      }
    })
  }
  
  // Cache voting power to prevent duplicate requests
  public getCachedVotingPower(key: string): any | null {
    const cached = this.votingPowerCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.value
    }
    return null
  }
  
  public setCachedVotingPower(key: string, value: any): void {
    this.votingPowerCache.set(key, {
      value,
      timestamp: Date.now()
    })
  }
  
  // Debounce function to prevent rapid successive calls
  public debounce<T extends (...args: any[]) => Promise<any>>(
    key: string,
    func: T,
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      // Clear existing timer if any
      const existingTimer = this.debounceTimers.get(key)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }
      
      // Set new timer
      const timer = setTimeout(async () => {
        try {
          const result = await func(...args)
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.debounceTimers.delete(key)
        }
      }, this.DEBOUNCE_DELAY)
      
      this.debounceTimers.set(key, timer)
    })
  }
  
  // Clear all cached providers (useful for cleanup)
  public clearProviders(): void {
    this.providers.clear()
    this.lastRequestTime.clear()
    this.requestQueue.clear()
    this.votingPowerCache.clear()
    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer))
    this.debounceTimers.clear()
  }
}

// Export singleton instance
export const providerManager = ProviderManager.getInstance()

// Helper function for easy access
export function getManagedProvider(network: 'ethereum' | 'arbitrum' | null = 'ethereum'): ethers.JsonRpcProvider {
  return providerManager.getProvider(network)
}
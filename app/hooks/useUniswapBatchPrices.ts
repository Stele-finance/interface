"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { ethers } from "ethers"
import { 
  getRPCUrl,
  getUniswapQuoterAddress,
  getMulticallAddress,
  getUSDCTokenAddress,
  getWETHAddress,
} from "@/lib/constants"

// QuoterV2 ABI (simplified)
const QUOTER_ABI = [
  {
    "inputs": [
      {
        "components": [
          {"internalType": "address", "name": "tokenIn", "type": "address"},
          {"internalType": "address", "name": "tokenOut", "type": "address"},
          {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
          {"internalType": "uint24", "name": "fee", "type": "uint24"},
          {"internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160"}
        ],
        "internalType": "struct IQuoterV2.QuoteExactInputSingleParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "quoteExactInputSingle",
    "outputs": [
      {"internalType": "uint256", "name": "amountOut", "type": "uint256"},
      {"internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160"},
      {"internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32"},
      {"internalType": "uint256", "name": "gasEstimate", "type": "uint256"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

// Multicall3 ABI (standardized across all chains)
const MULTICALL3_ABI = [
  {
    "inputs": [
      {"internalType": "bool", "name": "requireSuccess", "type": "bool"},
      {
        "components": [
          {"internalType": "address", "name": "target", "type": "address"},
          {"internalType": "bytes", "name": "callData", "type": "bytes"}
        ],
        "internalType": "struct Multicall3.Call[]",
        "name": "calls",
        "type": "tuple[]"
      }
    ],
    "name": "tryAggregate",
    "outputs": [
      {
        "components": [
          {"internalType": "bool", "name": "success", "type": "bool"},
          {"internalType": "bytes", "name": "returnData", "type": "bytes"}
        ],
        "internalType": "struct Multicall3.Result[]",
        "name": "returnData",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
]



// ERC20 ABI for checking token existence
const ERC20_ABI = [
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
]

export interface TokenPrice {
  symbol: string
  address: string
  priceUSD: number
  priceChange24h?: number
  lastUpdated: Date
  decimals: number
}

export interface BatchPriceData {
  tokens: Record<string, TokenPrice>
  timestamp: number
  source: string
  error?: string
}

export interface TokenInfo {
  symbol: string
  address: string
  decimals: number
}

export function useUniswapBatchPrices(tokens: TokenInfo[] = [], network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const [priceData, setPriceData] = useState<BatchPriceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastFetchTimeRef = useRef<number>(0)
  const priceDataRef = useRef<BatchPriceData | null>(null)

  // Update ref whenever priceData changes
  useEffect(() => {
    priceDataRef.current = priceData
  }, [priceData])

  const getProvider = useCallback(async () => {
    // Always use configured RPC for consistency
    return new ethers.JsonRpcProvider(getRPCUrl(network))
  }, [network])

    const fetchBatchPricesWithMulticall = useCallback(async (tokens: TokenInfo[], provider: ethers.JsonRpcProvider): Promise<Record<string, TokenPrice>> => {
    const usdcAddress = getUSDCTokenAddress(network)
    const wethAddress = getWETHAddress(network)
    const quoterAddress = getUniswapQuoterAddress(network)
    const multicallAddress = getMulticallAddress(network)

    const processedTokens: Record<string, TokenPrice> = {}
    const now = Date.now()

    // Check cache for all tokens first and separate cached from uncached
    const tokensNeedingFetch: TokenInfo[] = []
    const cachedTokens: Record<string, TokenPrice> = {}

    tokens.forEach(token => {
      const cacheKey = `${token.symbol}-${network}`
      const cached = priceCache.get(cacheKey)

      // Use cached price if still valid
      if (cached && now - cached.timestamp < CACHE_DURATION && cached.price !== null) {
        cachedTokens[token.symbol] = {
          symbol: token.symbol,
          address: token.address,
          priceUSD: cached.price,
          decimals: token.decimals,
          lastUpdated: new Date(cached.timestamp)
        }
        processedTokens[token.symbol] = cachedTokens[token.symbol]
      } else {
        tokensNeedingFetch.push(token)
      }
    })

    // If all tokens are cached, return early
    if (tokensNeedingFetch.length === 0) {
      return processedTokens
    }

    // Get real ETH price first (check cache first)
    let cachedEthPrice = 3500 // Default fallback
    const ethCacheKey = `ETH-${network}`
    const cachedEth = priceCache.get(ethCacheKey)

    if (cachedEth && now - cachedEth.timestamp < CACHE_DURATION && cachedEth.price !== null) {
      cachedEthPrice = cachedEth.price
    } else {
      try {
        const quoter = new ethers.Contract(quoterAddress, QUOTER_ABI, provider)
        const ethToUsdcParams = {
          tokenIn: wethAddress,
          tokenOut: usdcAddress,
          amountIn: ethers.parseEther('1'),
          fee: 3000, // 0.3% fee tier
          sqrtPriceLimitX96: 0
        }
        const [ethAmountOut] = await quoter.quoteExactInputSingle.staticCall(ethToUsdcParams)
        cachedEthPrice = Number(ethAmountOut) / 1e6 // USDC has 6 decimals

        // Cache ETH price
        priceCache.set(ethCacheKey, {
          price: cachedEthPrice,
          timestamp: now,
          isLoading: false
        })

        // Save to localStorage
        saveCacheToStorage()
      } catch (err) {
        console.warn('Failed to fetch ETH price, using fallback:', err)
      }
    }
    
    // Always add USDC first
    processedTokens.USDC = {
      symbol: 'USDC',
      address: usdcAddress,
      priceUSD: 1.0,
      decimals: 6,
      lastUpdated: new Date()
    }
    
    // Add ETH price
    processedTokens.ETH = {
      symbol: 'ETH',
      address: wethAddress,
      priceUSD: cachedEthPrice,
      decimals: 18,
      lastUpdated: new Date()
    }
    
    processedTokens.WETH = {
      symbol: 'WETH',
      address: wethAddress,
      priceUSD: cachedEthPrice,
      decimals: 18,
      lastUpdated: new Date()
    }

    // Filter out USDC from uncached tokens
    const tokensToProcess = tokensNeedingFetch.filter((token: TokenInfo) =>
      token.address.toLowerCase() !== usdcAddress.toLowerCase()
    ) as TokenInfo[]

    if (tokensToProcess.length === 0) {
      return processedTokens
    }

    try {
      // Create QuoterV2 interface for encoding calls
      const quoterInterface = new ethers.Interface(QUOTER_ABI)
      const calls: Array<{target: string, callData: string}> = []
      const callMapping: Array<{
        tokenIndex: number,
        feeType: 'usdc' | 'weth',
        fee: number
      }> = []

      // Generate all calls for all tokens and fee tiers
      const feeTiers = [3000, 500, 10000] // 0.3%, 0.05%, 1%
      
      for (let tokenIndex = 0; tokenIndex < tokensToProcess.length; tokenIndex++) {
        const token = tokensToProcess[tokenIndex]
        const amountIn = ethers.parseUnits("1", Number(token.decimals))
        
        // Try USDC pairs first
        for (const fee of feeTiers) {
          const params = {
            tokenIn: ethers.getAddress(token.address),
            tokenOut: ethers.getAddress(usdcAddress),
            amountIn: amountIn,
            fee: fee,
            sqrtPriceLimitX96: 0
          }
          
          const callData = quoterInterface.encodeFunctionData("quoteExactInputSingle", [params])
          calls.push({
            target: quoterAddress,
            callData: callData
          })
          
          callMapping.push({
            tokenIndex,
            feeType: 'usdc',
            fee
          })
        }

        // Try WETH pairs as fallback
        for (const fee of feeTiers) {
          const params = {
            tokenIn: ethers.getAddress(token.address),
            tokenOut: ethers.getAddress(wethAddress),
            amountIn: amountIn,
            fee: fee,
            sqrtPriceLimitX96: 0
          }
          
          const callData = quoterInterface.encodeFunctionData("quoteExactInputSingle", [params])
          calls.push({
            target: quoterAddress,
            callData: callData
          })
          
          callMapping.push({
            tokenIndex,
            feeType: 'weth',
            fee
          })
        }
      }

      // Execute multicall with Multicall3 (standardized across all networks)
      // Limit batch size to prevent gas issues and rate limiting
      const MAX_BATCH_SIZE = 20 // Reduced from 50 to prevent rate limiting
      const allResults: Array<{success: boolean, returnData: string}> = []

      // Helper function to delay between requests
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

      for (let i = 0; i < calls.length; i += MAX_BATCH_SIZE) {
        const batchCalls = calls.slice(i, i + MAX_BATCH_SIZE)
        const batchNumber = Math.floor(i / MAX_BATCH_SIZE) + 1
        const totalBatches = Math.ceil(calls.length / MAX_BATCH_SIZE)

        try {
          const multicallContract = new ethers.Contract(multicallAddress, MULTICALL3_ABI, provider)
          const response = await multicallContract.tryAggregate.staticCall(false, batchCalls)

          const batchResults = response.map((result: any) => ({
            success: result.success,
            returnData: result.returnData
          }))

          allResults.push(...batchResults)

          // Add delay between batches to prevent rate limiting (except for last batch)
          if (i + MAX_BATCH_SIZE < calls.length) {
            await delay(200) // 200ms delay between batches
          }
        } catch (batchError: any) {
          console.error(`Batch ${batchNumber}/${totalBatches} failed:`, batchError)

          // Check if it's a rate limit error
          const isRateLimitError = batchError?.message?.includes('Too Many Requests') ||
                                   batchError?.code === -32005

          if (isRateLimitError) {
            console.warn('Rate limit hit, adding longer delay...')
            // Wait longer before continuing if rate limited
            await delay(2000) // 2 second delay for rate limit
          }

          // Add failed results for this batch
          const failedResults = batchCalls.map(() => ({
            success: false,
            returnData: '0x'
          }))
          allResults.push(...failedResults)
        }
      }
      
      const results = allResults

      // Process results and find best price for each token
      for (let tokenIndex = 0; tokenIndex < tokensToProcess.length; tokenIndex++) {
        const token = tokensToProcess[tokenIndex]
        let bestPrice: TokenPrice | null = null
        
        // Check all results for this token
        for (let callIndex = 0; callIndex < callMapping.length; callIndex++) {
          const mapping = callMapping[callIndex]
          if (mapping.tokenIndex !== tokenIndex) continue
          
          const result = results[callIndex]
          if (!result.success || !result.returnData || result.returnData === '0x') continue
          
          try {
            const decoded = quoterInterface.decodeFunctionResult("quoteExactInputSingle", result.returnData)
            const amountOut = decoded[0]
            
            let priceUSD = 0
            
            if (mapping.feeType === 'usdc') {
              priceUSD = parseFloat(ethers.formatUnits(amountOut, 6))
            } else if (mapping.feeType === 'weth') {
              const ethAmount = parseFloat(ethers.formatUnits(amountOut, 18))
              // Get real ETH price from WETH -> USDC conversion
              priceUSD = ethAmount * cachedEthPrice
            }
            
            if (priceUSD > 0 && (!bestPrice || priceUSD > bestPrice.priceUSD)) {
              bestPrice = {
                symbol: token.symbol,
                address: token.address,
                priceUSD: priceUSD,
                decimals: token.decimals,
                lastUpdated: new Date()
              }
            }
          } catch (decodeError) {
            // Ignore decode errors for individual calls
          }
        }
        
        if (bestPrice) {
          processedTokens[bestPrice.symbol] = bestPrice

          // Store in cache
          const cacheKey = `${bestPrice.symbol}-${network}`
          priceCache.set(cacheKey, {
            price: bestPrice.priceUSD,
            timestamp: now,
            isLoading: false
          })
        } else {
          console.warn(`No price found for ${token.symbol} on ${network}`)
        }
      }

      // Save updated cache to localStorage
      saveCacheToStorage()

      return processedTokens

    } catch (error) {
      console.error('Multicall failed:', error)
      // Fallback to empty result
      return processedTokens
    }
  }, [network])

  const fetchBatchPrices = useCallback(async (forceRefresh: boolean = false) => {
    if (tokens.length === 0) {
      setPriceData({
        tokens: {},
        timestamp: Date.now(),
        source: 'Uniswap V3 Multicall (No tokens provided)',
      })
      setIsLoading(false)
      return
    }

    // Prevent too frequent requests (minimum 30 seconds between calls)
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetchTimeRef.current
    const MIN_FETCH_INTERVAL = 30000 // 30 seconds
    
    if (!forceRefresh && timeSinceLastFetch < MIN_FETCH_INTERVAL && priceDataRef.current) {
      return
    }

    try {
      // Only show loading for initial fetch or when no data exists
      if (!priceDataRef.current) {
        setIsLoading(true)
      }
      setError(null)
      lastFetchTimeRef.current = now
            
      const provider = await getProvider()
      const processedTokens = await fetchBatchPricesWithMulticall(tokens, provider)

      setPriceData({
        tokens: processedTokens,
        timestamp: Date.now(),
        source: 'Uniswap V3 Multicall',
      })

    } catch (fetchError) {
      console.error('Failed to fetch batch prices:', fetchError)
      console.error('Network:', network)
      console.error('Number of tokens:', tokens.length)
      
      // Provide fallback USDC price 
      const usdcAddress = getUSDCTokenAddress(network)
      setPriceData({
        tokens: {
          USDC: {
            symbol: 'USDC',
            address: usdcAddress,
            priceUSD: 1.0,
            decimals: 6,
            lastUpdated: new Date()
          }
        },
        timestamp: Date.now(),
        source: 'Fallback (Multicall Error)',
        error: `Price fetch error on ${network}: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
      })
    } finally {
      setIsLoading(false)
    }
  }, [tokens, getProvider, fetchBatchPricesWithMulticall, network])

  // Create stable token key to prevent unnecessary re-renders
  const tokenKey = useMemo(() => {
    return tokens.map(t => `${t.address}-${t.symbol}-${t.decimals}`).sort().join(',')
  }, [tokens])

  // Initial fetch using stable tokenKey
  useEffect(() => {
    if (tokenKey && tokens.length > 0) {
      fetchBatchPrices()
    } else {
      setIsLoading(false)
    }
  }, [tokenKey, fetchBatchPrices, tokens.length])

  // Auto-refresh every 2 minutes (only if there are tokens to fetch)
  useEffect(() => {
    if (!tokenKey || tokens.length === 0) return

    const interval = setInterval(() => {
      fetchBatchPrices(true) // Force refresh for periodic updates
    }, 120000) // 2 minutes

    return () => clearInterval(interval)
  }, [fetchBatchPrices, tokenKey, tokens.length])

  return {
    data: priceData,
    isLoading,
    error,
    refetch: () => fetchBatchPrices(true) // Force refresh when manually triggered
  }
}

// Hook for getting prices of user's specific tokens
export function useUserTokenPrices(userTokens: Array<{ symbol: string; address: string; decimals: string }>, network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const tokenInfos: TokenInfo[] = userTokens.map(token => ({
    symbol: token.symbol,
    address: token.address,
    decimals: parseInt(token.decimals) || 18
  }))

  return useUniswapBatchPrices(tokenInfos, network)
}

// Hook for getting prices of selected swap tokens only
export function useSwapTokenPrices(
  fromTokenSymbol: string | null,
  toTokenSymbol: string | null,
  getTokenAddress: (symbol: string) => string,
  getTokenDecimals: (symbol: string) => number,
  network: 'ethereum' | 'arbitrum' | null = 'ethereum'
) {
  const tokenInfos: TokenInfo[] = useMemo(() => {
    // Don't fetch anything if either token is missing
    if (!fromTokenSymbol || !toTokenSymbol || fromTokenSymbol === toTokenSymbol) {
      return []
    }
    
    const tokens: TokenInfo[] = []
    
    // Add fromToken
    const fromAddress = getTokenAddress(fromTokenSymbol)
    if (fromAddress) {
      tokens.push({
        symbol: fromTokenSymbol,
        address: fromAddress,
        decimals: getTokenDecimals(fromTokenSymbol)
      })
    }
    
    // Add toToken
    const toAddress = getTokenAddress(toTokenSymbol)
    if (toAddress) {
      tokens.push({
        symbol: toTokenSymbol,
        address: toAddress,
        decimals: getTokenDecimals(toTokenSymbol)
      })
    }
    
    return tokens
  }, [fromTokenSymbol, toTokenSymbol, getTokenAddress, getTokenDecimals])

  return useUniswapBatchPrices(tokenInfos, network)
}

// Price cache for preventing too many requests
interface PriceCacheItem {
  price: number | null
  timestamp: number
  isLoading: boolean
}

const priceCache = new Map<string, PriceCacheItem>()
const CACHE_DURATION = 180000 // 3 minutes cache

// LocalStorage key for persistent cache
const STORAGE_KEY = 'uniswap_token_prices'
const STORAGE_CACHE_DURATION = 300000 // 5 minutes for localStorage cache

// Load cache from localStorage on initialization
function loadCacheFromStorage() {
  if (typeof window === 'undefined') return

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      const now = Date.now()

      // Load valid cached prices into memory
      Object.entries(data).forEach(([key, item]: [string, any]) => {
        if (now - item.timestamp < STORAGE_CACHE_DURATION && item.price !== null) {
          priceCache.set(key, {
            price: item.price,
            timestamp: item.timestamp,
            isLoading: false
          })
        }
      })

      console.log(`Loaded ${priceCache.size} cached prices from localStorage`)
    }
  } catch (error) {
    console.warn('Failed to load price cache from localStorage:', error)
  }
}

// Save cache to localStorage
function saveCacheToStorage() {
  if (typeof window === 'undefined') return

  try {
    const cacheObject: Record<string, PriceCacheItem> = {}
    priceCache.forEach((value, key) => {
      cacheObject[key] = value
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheObject))
  } catch (error) {
    console.warn('Failed to save price cache to localStorage:', error)
  }
}

// Initialize cache from localStorage
loadCacheFromStorage()

// Hook for getting individual token price immediately with caching
export function useTokenPrice(
  tokenSymbol: string | null,
  getTokenAddress: (symbol: string) => string,
  getTokenDecimals: (symbol: string) => number,
  network: 'ethereum' | 'arbitrum' | null = 'ethereum'
) {
  const [price, setPrice] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cacheKey = `${tokenSymbol}-${network}`

  const fetchTokenPrice = useCallback(async () => {
    if (!tokenSymbol) {
      setPrice(null)
      setIsLoading(false)
      return
    }

    // USDC is always 1 dollar
    if (tokenSymbol === 'USDC') {
      setPrice(1.0)
      setIsLoading(false)
      return
    }

    // Check cache first
    const cached = priceCache.get(cacheKey)
    const now = Date.now()
    
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      setPrice(cached.price)
      setIsLoading(cached.isLoading)
      return
    }

    // If already loading, don't start another request
    if (cached && cached.isLoading) {
      setIsLoading(true)
      return
    }

    setIsLoading(true)
    setError(null)

    // Mark as loading in cache
    priceCache.set(cacheKey, {
      price: cached?.price || null,
      timestamp: now,
      isLoading: true
    })

    try {
      const provider = new ethers.JsonRpcProvider(getRPCUrl(network))
      const usdcAddress = getUSDCTokenAddress(network)
      const wethAddress = getWETHAddress(network)
      const quoterAddress = getUniswapQuoterAddress(network)
      
      const tokenAddress = getTokenAddress(tokenSymbol)
      const tokenDecimals = getTokenDecimals(tokenSymbol)
      
      if (!tokenAddress) {
        throw new Error(`Token address not found for ${tokenSymbol}`)
      }

      const quoterInterface = new ethers.Interface(QUOTER_ABI)
      const amountIn = ethers.parseUnits("1", Number(tokenDecimals))
      
      // Try to get price via USDC first
      const feeTiers = [3000, 500, 10000] // 0.3%, 0.05%, 1%
      let tokenPrice = null

      for (const fee of feeTiers) {
        try {
          const params = {
            tokenIn: ethers.getAddress(tokenAddress),
            tokenOut: ethers.getAddress(usdcAddress),
            amountIn: amountIn,
            fee: fee,
            sqrtPriceLimitX96: 0
          }
          
          const quoter = new ethers.Contract(quoterAddress, QUOTER_ABI, provider)
          
          const result = await quoter.quoteExactInputSingle.staticCall(params)
          const amountOut = result[0]
          
          if (amountOut > 0) {
            const price = parseFloat(ethers.formatUnits(amountOut, 6)) // USDC has 6 decimals
            tokenPrice = price
            break
          }
        } catch (err) {
          continue // Try next fee tier
        }
      }

      // If USDC route failed, try WETH route
      if (!tokenPrice) {
        for (const fee of feeTiers) {
          try {
            const params = {
              tokenIn: ethers.getAddress(tokenAddress),
              tokenOut: ethers.getAddress(wethAddress),
              amountIn: amountIn,
              fee: fee,
              sqrtPriceLimitX96: 0
            }
            
            const quoter = new ethers.Contract(quoterAddress, QUOTER_ABI, provider)
            const result = await quoter.quoteExactInputSingle.staticCall(params)
            const amountOut = result[0]
            
            if (amountOut > 0) {
              const ethAmount = parseFloat(ethers.formatUnits(amountOut, 18))
              
              // Get real ETH price from cached data or fetch it
              let ethPriceUSD = 3500 // Default fallback
              try {
                // Try to get ETH price from Uniswap
                const ethQuoter = new ethers.Contract(quoterAddress, QUOTER_ABI, provider)
                const ethToUsdcParams = {
                  tokenIn: wethAddress,
                  tokenOut: usdcAddress,
                  amountIn: ethers.parseEther('1'),
                  fee: 3000,
                  sqrtPriceLimitX96: 0
                }
                const [ethToUsdcAmount] = await ethQuoter.quoteExactInputSingle.staticCall(ethToUsdcParams)
                ethPriceUSD = Number(ethToUsdcAmount) / 1e6
              } catch (err) {
                console.warn('Using fallback ETH price:', ethPriceUSD)
              }
              tokenPrice = ethAmount * ethPriceUSD
              break
            }
          } catch (err) {
            continue
          }
        }
      }

      // Update cache with result
      priceCache.set(cacheKey, {
        price: tokenPrice,
        timestamp: now,
        isLoading: false
      })

      // Save to localStorage
      saveCacheToStorage()

      setPrice(tokenPrice)
    } catch (err) {
      console.error(`Error fetching price for ${tokenSymbol}:`, err)
      setError(err instanceof Error ? err.message : 'Failed to fetch price')
      
      // Update cache to mark as not loading
      priceCache.set(cacheKey, {
        price: cached?.price || null,
        timestamp: now,
        isLoading: false
      })
    } finally {
      setIsLoading(false)
    }
  }, [tokenSymbol, getTokenAddress, getTokenDecimals, network, cacheKey])

  useEffect(() => {
    fetchTokenPrice()
  }, [fetchTokenPrice])

  return { price, isLoading, error, refetch: fetchTokenPrice }
}

// Hook for getting both token prices independently for immediate swap calculation
export function useSwapTokenPricesIndependent(
  fromTokenSymbol: string | null,
  toTokenSymbol: string | null,
  getTokenAddress: (symbol: string) => string,
  getTokenDecimals: (symbol: string) => number,
  network: 'ethereum' | 'arbitrum' | null = 'ethereum'
) {
  const [fromTokenPrice, setFromTokenPrice] = useState<number | null>(null)
  const [toTokenPrice, setToTokenPrice] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBothTokenPrices = useCallback(async () => {
    if (!fromTokenSymbol || !toTokenSymbol) {
      setFromTokenPrice(null)
      setToTokenPrice(null)
      setIsLoading(false)
      return
    }

    // Handle USDC cases
    if (fromTokenSymbol === 'USDC') setFromTokenPrice(1.0)
    if (toTokenSymbol === 'USDC') setToTokenPrice(1.0)

    const fromKey = `${fromTokenSymbol}-${network}`
    const toKey = `${toTokenSymbol}-${network}`
    const now = Date.now()

    // Check cache for both tokens
    const fromCached = priceCache.get(fromKey)
    const toCached = priceCache.get(toKey)

    let needsFetch = false

    if (fromTokenSymbol !== 'USDC' && (!fromCached || now - fromCached.timestamp >= CACHE_DURATION)) {
      if (!fromCached?.isLoading) {
        needsFetch = true
      }
    } else if (fromCached && fromTokenSymbol !== 'USDC') {
      setFromTokenPrice(fromCached.price)
    }

    if (toTokenSymbol !== 'USDC' && (!toCached || now - toCached.timestamp >= CACHE_DURATION)) {
      if (!toCached?.isLoading) {
        needsFetch = true
      }
    } else if (toCached && toTokenSymbol !== 'USDC') {
      setToTokenPrice(toCached.price)
    }

    if (!needsFetch) return

    setIsLoading(true)
    setError(null)

    try {
      const provider = new ethers.JsonRpcProvider(getRPCUrl(network))
      const usdcAddress = getUSDCTokenAddress(network)
      const quoterAddress = getUniswapQuoterAddress(network)
      
      const quoterInterface = new ethers.Interface(QUOTER_ABI)
      const feeTiers = [3000, 500, 10000] // 0.3%, 0.05%, 1%

      // Fetch from token price if needed
      if (fromTokenSymbol !== 'USDC' && (!fromCached || now - fromCached.timestamp >= CACHE_DURATION)) {
        const fromAddress = getTokenAddress(fromTokenSymbol)
        const fromDecimals = getTokenDecimals(fromTokenSymbol)
        
        if (fromAddress) {
          const amountIn = ethers.parseUnits("1", Number(fromDecimals))
          let fromPrice = null

          for (const fee of feeTiers) {
            try {
              const params = {
                tokenIn: ethers.getAddress(fromAddress),
                tokenOut: ethers.getAddress(usdcAddress),
                amountIn: amountIn,
                fee: fee,
                sqrtPriceLimitX96: 0
              }
              
              const quoter = new ethers.Contract(quoterAddress, QUOTER_ABI, provider)
              const result = await quoter.quoteExactInputSingle.staticCall(params)
              const amountOut = result[0]
              
              if (amountOut > 0) {
                fromPrice = parseFloat(ethers.formatUnits(amountOut, 6))
                break
              }
            } catch (err) {
              continue
            }
          }

          if (fromPrice) {
            setFromTokenPrice(fromPrice)
            priceCache.set(fromKey, {
              price: fromPrice,
              timestamp: now,
              isLoading: false
            })
            saveCacheToStorage()
          }
        }
      }

      // Fetch to token price if needed
      if (toTokenSymbol !== 'USDC' && (!toCached || now - toCached.timestamp >= CACHE_DURATION)) {
        const toAddress = getTokenAddress(toTokenSymbol)
        const toDecimals = getTokenDecimals(toTokenSymbol)
        
        if (toAddress) {
          const amountIn = ethers.parseUnits("1", Number(toDecimals))
          let toPrice = null

          for (const fee of feeTiers) {
            try {
              const params = {
                tokenIn: ethers.getAddress(toAddress),
                tokenOut: ethers.getAddress(usdcAddress),
                amountIn: amountIn,
                fee: fee,
                sqrtPriceLimitX96: 0
              }
              
              const quoter = new ethers.Contract(quoterAddress, QUOTER_ABI, provider)
              const result = await quoter.quoteExactInputSingle.staticCall(params)
              const amountOut = result[0]
              
              if (amountOut > 0) {
                toPrice = parseFloat(ethers.formatUnits(amountOut, 6))
                break
              }
            } catch (err) {
              continue
            }
          }

          if (toPrice) {
            setToTokenPrice(toPrice)
            priceCache.set(toKey, {
              price: toPrice,
              timestamp: now,
              isLoading: false
            })
            saveCacheToStorage()
          }
        }
      }
    } catch (err) {
      console.error('Error fetching token prices:', err)
      
      // Handle 429 Too Many Requests error specifically
      if (err instanceof Error && err.message.includes('Too Many Requests')) {
        setError('Rate limit exceeded. Please try again later.')
        
        // Cache the error state to prevent immediate retries
        priceCache.set(fromKey, {
          price: null,
          timestamp: now,
          isLoading: false
        })
        priceCache.set(toKey, {
          price: null,
          timestamp: now,
          isLoading: false
        })
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch prices')
      }
    } finally {
      setIsLoading(false)
    }
  }, [fromTokenSymbol, toTokenSymbol, getTokenAddress, getTokenDecimals, network])

  useEffect(() => {
    // Debounce the fetch to prevent too many requests when user changes tokens quickly
    const timeoutId = setTimeout(() => {
      fetchBothTokenPrices()
    }, 500) // 500ms delay

    return () => clearTimeout(timeoutId)
  }, [fetchBothTokenPrices])

  const calculateSimpleSwapQuote = useCallback((fromAmount: number) => {
    if (!fromTokenPrice || !toTokenPrice || fromAmount <= 0) {
      return null
    }

    const fromValueUSD = fromAmount * fromTokenPrice
    const toAmount = fromValueUSD / toTokenPrice
    
    // Apply simple fee estimation (0.3% typical for AMM DEXs)
    const feeRate = 0.003
    const toAmountAfterFees = toAmount * (1 - feeRate)
    
    return {
      fromAmount,
      toAmount: toAmountAfterFees,
      exchangeRate: toAmountAfterFees / fromAmount,
      fromValueUSD,
      isBasicEstimate: true
    }
  }, [fromTokenPrice, toTokenPrice])

  return {
    fromTokenPrice,
    toTokenPrice,
    isLoading,
    error,
    calculateSimpleSwapQuote,
    refetch: fetchBothTokenPrices
  }
} 
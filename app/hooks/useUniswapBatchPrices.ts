"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { ethers } from "ethers"
import { 
  getRPCUrl,
  getUniswapQuoterAddress,
  getMulticallAddress,
  getUSDCTokenAddress,
  getWETHAddress,
  getWBTCAddress,
  getUNIAddress,
  getLINKAddress
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

  const getTokenPrice = useCallback(async (token: TokenInfo, provider: ethers.JsonRpcProvider): Promise<TokenPrice | null> => {
    try {
      const usdcAddress = getUSDCTokenAddress(network)
      
      // Skip USDC - always $1
      if (token.address.toLowerCase() === usdcAddress.toLowerCase()) {
        return {
          symbol: 'USDC',
          address: usdcAddress,
          priceUSD: 1.0,
          decimals: 6,
          lastUpdated: new Date()
        }
      }

      // Validate token first
      const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider)
      
      try {
        await tokenContract.decimals()
        await tokenContract.symbol()
      } catch (tokenError) {
        console.warn(`Token ${token.symbol} (${token.address}) appears to be invalid on ${network}`)
        return null
      }

      // Create quoter contract
      const quoterContract = new ethers.Contract(
        getUniswapQuoterAddress(network),
        QUOTER_ABI,
        provider
      )

      // Try different fee tiers
      const feeTiers = [3000, 500, 10000] // 0.3%, 0.05%, 1%
      const amountIn = ethers.parseUnits("1", token.decimals)

      for (const fee of feeTiers) {
        try {
          const params = {
            tokenIn: ethers.getAddress(token.address),
            tokenOut: ethers.getAddress(usdcAddress),
            amountIn: amountIn,
            fee: fee,
            sqrtPriceLimitX96: 0
          }

          const result = await quoterContract.quoteExactInputSingle.staticCall(params)
          const amountOut = result[0]
          const priceUSD = parseFloat(ethers.formatUnits(amountOut, 6))

          if (priceUSD > 0) {
            console.log(`Got price for ${token.symbol} with ${fee/100}% fee: $${priceUSD}`)
            return {
              symbol: token.symbol,
              address: token.address,
              priceUSD: priceUSD,
              decimals: token.decimals,
              lastUpdated: new Date()
            }
          }
        } catch (feeError) {
          console.warn(`Fee tier ${fee} failed for ${token.symbol}:`, feeError)
          continue
        }
      }

      // If USDC quote failed, try WETH
      const wethAddress = getWETHAddress(network)
      for (const fee of feeTiers) {
        try {
          const params = {
            tokenIn: ethers.getAddress(token.address),
            tokenOut: ethers.getAddress(wethAddress),
            amountIn: amountIn,
            fee: fee,
            sqrtPriceLimitX96: 0
          }

          const result = await quoterContract.quoteExactInputSingle.staticCall(params)
          const amountOut = result[0]
          const ethAmount = parseFloat(ethers.formatUnits(amountOut, 18))

          if (ethAmount > 0) {
            // Get ETH price in USD (approximate)
            const ethPriceUSD = network === 'arbitrum' ? 2400 : 2400 // Rough estimate
            const priceUSD = ethAmount * ethPriceUSD

            console.log(`Got price for ${token.symbol} via WETH with ${fee/100}% fee: $${priceUSD}`)
            return {
              symbol: token.symbol,
              address: token.address,
              priceUSD: priceUSD,
              decimals: token.decimals,
              lastUpdated: new Date()
            }
          }
        } catch (feeError) {
          console.warn(`WETH fee tier ${fee} failed for ${token.symbol}:`, feeError)
          continue
        }
      }

      console.warn(`No price found for ${token.symbol} on ${network}`)
      return null

    } catch (error) {
      console.error(`Error getting price for ${token.symbol}:`, error)
      return null
    }
  }, [network])

  const fetchBatchPrices = useCallback(async (forceRefresh: boolean = false) => {
    if (tokens.length === 0) {
      setPriceData({
        tokens: {},
        timestamp: Date.now(),
        source: 'Uniswap V3 Individual Calls (No tokens provided)',
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
      
      console.log(`Fetching prices for ${tokens.length} tokens on ${network}`)
      
      const provider = await getProvider()
      const processedTokens: Record<string, TokenPrice> = {}

      // Process tokens individually with concurrency limit
      const CONCURRENT_LIMIT = 3
      const batches = []
      for (let i = 0; i < tokens.length; i += CONCURRENT_LIMIT) {
        batches.push(tokens.slice(i, i + CONCURRENT_LIMIT))
      }

      for (const batch of batches) {
        const promises = batch.map(token => getTokenPrice(token, provider))
        const results = await Promise.allSettled(promises)
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            processedTokens[result.value.symbol] = result.value
          }
        })
      }

      // Always add USDC
      const usdcAddress = getUSDCTokenAddress(network)
      processedTokens.USDC = {
        symbol: 'USDC',
        address: usdcAddress,
        priceUSD: 1.0,
        decimals: 6,
        lastUpdated: new Date()
      }

      console.log(`Successfully fetched ${Object.keys(processedTokens).length} prices`)

      setPriceData({
        tokens: processedTokens,
        timestamp: Date.now(),
        source: 'Uniswap V3 Individual Calls',
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
        source: 'Fallback (Individual Call Error)',
        error: `Price fetch error on ${network}: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
      })
    } finally {
      setIsLoading(false)
    }
  }, [tokens, getProvider, getTokenPrice])

  // Create stable token key to prevent unnecessary re-renders
  const tokenKey = useMemo(() => {
    return tokens.map(t => `${t.address}-${t.symbol}-${t.decimals}`).sort().join(',')
  }, [tokens])

  // Initial fetch using stable tokenKey
  useEffect(() => {
    if (tokenKey) {
      fetchBatchPrices()
    } else {
      setIsLoading(false)
    }
  }, [tokenKey, fetchBatchPrices])

  // Auto-refresh every 2 minutes
  useEffect(() => {
    if (!tokenKey) return
    
    const interval = setInterval(() => {
      fetchBatchPrices(true) // Force refresh for periodic updates
    }, 120000) // 2 minutes
    
    return () => clearInterval(interval)
  }, [fetchBatchPrices, tokenKey])

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
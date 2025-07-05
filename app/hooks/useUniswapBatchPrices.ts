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
    
    // Always add USDC first
    processedTokens.USDC = {
      symbol: 'USDC',
      address: usdcAddress,
      priceUSD: 1.0,
      decimals: 6,
      lastUpdated: new Date()
    }

    // Filter out USDC from processing
    const tokensToProcess = tokens.filter((token: TokenInfo) => 
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
        const amountIn = ethers.parseUnits("1", token.decimals)
        
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
      // Limit batch size to prevent gas issues
      const MAX_BATCH_SIZE = 50
      const allResults: Array<{success: boolean, returnData: string}> = []
      
      for (let i = 0; i < calls.length; i += MAX_BATCH_SIZE) {
        const batchCalls = calls.slice(i, i + MAX_BATCH_SIZE)
        
        try {
          const multicallContract = new ethers.Contract(multicallAddress, MULTICALL3_ABI, provider)
          const response = await multicallContract.tryAggregate.staticCall(false, batchCalls)
          
          const batchResults = response.map((result: any) => ({
            success: result.success,
            returnData: result.returnData
          }))
          
          allResults.push(...batchResults)
        } catch (batchError) {
          console.error(`Batch ${Math.floor(i / MAX_BATCH_SIZE) + 1} failed:`, batchError)
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
              const ethPriceUSD = 2400 // Rough estimate
              priceUSD = ethAmount * ethPriceUSD
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
        } else {
          console.warn(`No price found for ${token.symbol} on ${network}`)
        }
      }

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
  }, [tokens, getProvider, fetchBatchPricesWithMulticall])

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
'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useInvestableTokens } from '@/app/hooks/useInvestableTokens'
import { useUniswapBatchPrices } from '@/app/hooks/useUniswapBatchPrices'
import { useWallet } from '@/app/hooks/useWallet'

interface TokenPrice {
  address: string
  symbol: string
  decimals: number
  priceUSD: number
  timestamp: number
}

interface TokenPriceContextType {
  tokenPrices: Map<string, TokenPrice>
  getTokenPrice: (address: string) => TokenPrice | undefined
  getTokenPriceBySymbol: (symbol: string) => TokenPrice | undefined
  isLoading: boolean
  error: any
  lastUpdated: number
  refetch: () => void
}

const TokenPriceContext = createContext<TokenPriceContextType | undefined>(undefined)

export function TokenPriceProvider({ 
  children,
  context = 'challenge'
}: { 
  children: React.ReactNode
  context?: 'challenge' | 'fund'
}) {
  const [tokenPricesMap, setTokenPricesMap] = useState<Map<string, TokenPrice>>(new Map())
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now())
  
  // Get network from URL path instead of wallet
  const pathParts = typeof window !== 'undefined' ? window.location.pathname.split('/') : []
  const networkFromUrl = pathParts.find(part => part === 'ethereum' || part === 'arbitrum') || 'arbitrum'
  const network = networkFromUrl as 'ethereum' | 'arbitrum'
  
  // Determine context from URL if not explicitly provided
  const actualContext = context || (pathParts.includes('fund') ? 'fund' : 'challenge')

  // Get investable tokens based on context
  const { data: investableTokens, isLoading: isLoadingTokens } = useInvestableTokens(network, actualContext)

  // Prepare token infos for batch price fetching
  const tokenInfos = useMemo(() => {
    if (!investableTokens?.investableTokens || investableTokens.investableTokens.length === 0) return []
    
    return investableTokens.investableTokens.map(token => ({
      address: token.tokenAddress,
      symbol: token.symbol,
      decimals: Number(token.decimals)
    }))
  }, [investableTokens])

  // Fetch prices for all investable tokens at once
  const { 
    data: priceData, 
    isLoading: isLoadingPrices, 
    error,
    refetch 
  } = useUniswapBatchPrices(tokenInfos, network)
  
  // Set up 5-minute refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (tokenInfos.length > 0 && network) {
        refetch()
      }
    }, 5 * 60 * 1000) // 5 minutes
    
    return () => clearInterval(interval)
  }, [refetch, tokenInfos.length, network])

  // Update token prices map when data changes
  useEffect(() => {
    if (priceData?.tokens && investableTokens?.investableTokens) {
      const newMap = new Map<string, TokenPrice>()
      
      investableTokens.investableTokens.forEach(token => {
        const priceInfo = priceData.tokens[token.symbol]
        if (priceInfo) {
          newMap.set(token.tokenAddress.toLowerCase(), {
            address: token.tokenAddress,
            symbol: token.symbol,
            decimals: Number(token.decimals),
            priceUSD: priceInfo.priceUSD,
            timestamp: Date.now()
          })
        }
      })
      
      setTokenPricesMap(newMap)
      setLastUpdated(Date.now())
    }
  }, [priceData, investableTokens])

  // Get token price by address
  const getTokenPrice = useCallback((address: string): TokenPrice | undefined => {
    return tokenPricesMap.get(address.toLowerCase())
  }, [tokenPricesMap])

  // Get token price by symbol
  const getTokenPriceBySymbol = useCallback((symbol: string): TokenPrice | undefined => {
    for (const tokenPrice of tokenPricesMap.values()) {
      if (tokenPrice.symbol.toLowerCase() === symbol.toLowerCase()) {
        return tokenPrice
      }
    }
    return undefined
  }, [tokenPricesMap])

  const contextValue = useMemo(() => ({
    tokenPrices: tokenPricesMap,
    getTokenPrice,
    getTokenPriceBySymbol,
    isLoading: isLoadingTokens || isLoadingPrices,
    error,
    lastUpdated,
    refetch
  }), [tokenPricesMap, getTokenPrice, getTokenPriceBySymbol, isLoadingTokens, isLoadingPrices, error, lastUpdated, refetch])

  return (
    <TokenPriceContext.Provider value={contextValue}>
      {children}
    </TokenPriceContext.Provider>
  )
}

// Hook to use token prices
export function useTokenPrices() {
  const context = useContext(TokenPriceContext)
  if (context === undefined) {
    throw new Error('useTokenPrices must be used within a TokenPriceProvider')
  }
  return context
}

// Helper hook to get specific token price
export function useTokenPrice(addressOrSymbol: string | undefined) {
  const { getTokenPrice, getTokenPriceBySymbol } = useTokenPrices()
  
  return useMemo(() => {
    if (!addressOrSymbol) return undefined
    
    // Check if it's an address (starts with 0x) or symbol
    if (addressOrSymbol.startsWith('0x')) {
      return getTokenPrice(addressOrSymbol)
    } else {
      return getTokenPriceBySymbol(addressOrSymbol)
    }
  }, [addressOrSymbol, getTokenPrice, getTokenPriceBySymbol])
}

// Helper hook to get multiple token prices
export function useMultipleTokenPrices(addresses: string[]) {
  const { getTokenPrice } = useTokenPrices()
  
  return useMemo(() => {
    return addresses.map(address => getTokenPrice(address))
  }, [addresses, getTokenPrice])
}
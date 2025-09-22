'use client'

import { useMemo } from 'react'
import { useFundInvestableTokens } from '../[network]/[id]/hooks/useFundInvestableTokens'
import { useTokenPrices } from '@/lib/token-price-context'

// Fund-specific investable token prices hook
export function useFundInvestableTokenPrices(network: 'ethereum' | 'arbitrum' | null = 'arbitrum') {
  // Get fund investable tokens data (separate from challenge tokens)
  const { data: tokensData, isLoading: isLoadingTokens, error: tokensError } = useFundInvestableTokens(
    network === 'ethereum' || network === 'arbitrum' ? network : 'arbitrum'
  )
  
  // Get prices from the global context
  const { 
    getTokenPrice, 
    getTokenPriceBySymbol, 
    isLoading: isLoadingPrices, 
    error: priceError,
    refetch: refetchPrices
  } = useTokenPrices()

  // Combine fund token info with price data
  const fundTokensWithPrices = useMemo(() => {
    if (!tokensData || tokensData.length === 0) return []

    return tokensData.map(token => {
      // Try to get price by address first, then by symbol
      const priceInfo = getTokenPrice(token.address) || getTokenPriceBySymbol(token.symbol)
      return {
        ...token,
        tokenAddress: token.address, // Map address to tokenAddress for consistency
        price: priceInfo?.priceUSD || null,
        priceLastUpdated: priceInfo?.timestamp ? new Date(priceInfo.timestamp) : null,
        isRealTime: priceInfo?.priceUSD ? true : false // Indicate if we have real-time price data
      }
    })
  }, [tokensData, getTokenPrice, getTokenPriceBySymbol])

  // Helper function to get token price by symbol (for fund context)
  const getFundTokenPriceBySymbol = (symbol: string) => {
    const token = fundTokensWithPrices.find(t => t.symbol === symbol)
    return token?.price || null
  }

  // Helper function to get token price by address (for fund context)
  const getFundTokenPriceByAddress = (address: string) => {
    const token = fundTokensWithPrices.find(t => t.address.toLowerCase() === address.toLowerCase())
    return token?.price || null
  }

  // Helper function to get token info by symbol (for fund context)
  const getFundTokenInfoBySymbol = (symbol: string) => {
    return fundTokensWithPrices.find(t => t.symbol === symbol) || null
  }

  return {
    data: fundTokensWithPrices,
    tokens: fundTokensWithPrices, // alias for convenience
    isLoading: isLoadingTokens || isLoadingPrices,
    error: tokensError || priceError,
    refetch: refetchPrices,
    getFundTokenPriceBySymbol,
    getFundTokenPriceByAddress,
    getFundTokenInfoBySymbol
  }
}

export interface FundInvestableTokenWithPrice {
  id: string
  address: string
  tokenAddress: string // for consistency with challenge tokens
  decimals: string
  symbol: string
  isInvestable: boolean
  updatedTimestamp: string
  price: number | null
  priceLastUpdated: Date | null
  isRealTime: boolean
}
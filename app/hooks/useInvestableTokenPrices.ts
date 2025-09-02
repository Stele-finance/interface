'use client'

import { useMemo } from 'react'
import { useInvestableTokens } from './useInvestableTokens'
import { useTokenPrices } from '@/lib/token-price-context'

export function useInvestableTokenPrices(network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  // Get investable tokens data
  const { data: tokensData, isLoading: isLoadingTokens, error: tokensError } = useInvestableTokens(network)
  
  // Get prices from the global context
  const { 
    getTokenPrice, 
    getTokenPriceBySymbol, 
    isLoading: isLoadingPrices, 
    error: priceError,
    refetch: refetchPrices
  } = useTokenPrices()

  // Combine token info with price data
  const tokensWithPrices = useMemo(() => {
    if (!tokensData?.investableTokens) return []

    return tokensData.investableTokens.map(token => {
      const priceInfo = getTokenPrice(token.tokenAddress) || getTokenPriceBySymbol(token.symbol)
      return {
        ...token,
        price: priceInfo?.priceUSD || null,
        priceLastUpdated: priceInfo?.timestamp ? new Date(priceInfo.timestamp) : null
      }
    })
  }, [tokensData, getTokenPrice, getTokenPriceBySymbol])

  return {
    data: tokensWithPrices,
    isLoading: isLoadingTokens || isLoadingPrices,
    error: tokensError || priceError,
    refetch: refetchPrices
  }
}

export interface InvestableTokenWithPrice {
  id: string
  tokenAddress: string
  decimals: string
  symbol: string
  isInvestable: boolean
  updatedTimestamp: string
  price: number | null
  priceLastUpdated: Date | null
}
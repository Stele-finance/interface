'use client'

import { useMemo } from 'react'
import { useInvestableTokens } from './useInvestableTokens'
import { useTokenPrices } from '@/lib/token-price-context'

export function useChallengeInvestableTokenPrices(network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  // Get challenge investable tokens data
  const { data: tokensData, isLoading: isLoadingTokens, error: tokensError } = useInvestableTokens(network)
  
  // Get prices from the global context
  const { 
    getTokenPrice, 
    getTokenPriceBySymbol, 
    isLoading: isLoadingPrices, 
    error: priceError,
    refetch: refetchPrices
  } = useTokenPrices()

  // Combine challenge token info with price data
  const challengeTokensWithPrices = useMemo(() => {
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

  // Helper function to get token price by symbol (for challenge context)
  const getChallengeTokenPriceBySymbol = (symbol: string) => {
    const token = challengeTokensWithPrices.find(t => t.symbol === symbol)
    return token?.price || null
  }

  // Helper function to get token price by address (for challenge context)
  const getChallengeTokenPriceByAddress = (address: string) => {
    const token = challengeTokensWithPrices.find(t => t.tokenAddress.toLowerCase() === address.toLowerCase())
    return token?.price || null
  }

  return {
    data: challengeTokensWithPrices,
    tokens: challengeTokensWithPrices, // alias for convenience
    isLoading: isLoadingTokens || isLoadingPrices,
    error: tokensError || priceError,
    refetch: refetchPrices,
    getChallengeTokenPriceBySymbol,
    getChallengeTokenPriceByAddress
  }
}

export interface ChallengeInvestableTokenWithPrice {
  id: string
  tokenAddress: string
  decimals: string
  symbol: string
  isInvestable: boolean
  updatedTimestamp: string
  price: number | null
  priceLastUpdated: Date | null
}